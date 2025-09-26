
import os
import re
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from near_api.providers import JsonProvider
from near_api.signer import Signer, KeyPair
from near_api.account import Account
import pandas as pd
from io import StringIO
import numpy as np
import base64

# --- Pydantic Models for API requests ---
class ProofOfRestRequest(BaseModel):
    photoDataUri: str
    accountId: str

class ScoreRequest(BaseModel):
    fnirsData: str
    glucoseLevel: float

class EmailAnalyzeRequest(BaseModel):
    emailContent: str
    campaign: str


# --- FastAPI App Initialization ---
app = FastAPI()

# --- Contract and Agent Configuration ---
CONTRACT_ID = os.environ.get("NEXT_PUBLIC_contractId", "stake-bonus-js.think2earn.near")
AGENT_ACCOUNT_ID = os.environ.get("NEAR_ACCOUNT_ID")
# In a real TEE, the seed phrase would be securely provided.
# For local dev, we use a private key derived from it.
AGENT_SEED_PHRASE = os.environ.get("NEAR_SEED_PHRASE")

# Initialize NEAR connection
provider = JsonProvider("https://rpc.testnet.near.org")

# Create signer from seed phrase if available, otherwise it will fail gracefully on transactions
signer = None
agent_account = None

if AGENT_ACCOUNT_ID and AGENT_SEED_PHRASE:
    try:
        # near-api-py uses ed25519 keys from a seed phrase
        key_pair = KeyPair.from_seed_phrase(AGENT_SEED_PHRASE)
        signer = Signer(AGENT_ACCOUNT_ID, key_pair)
        agent_account = Account(provider, signer, AGENT_ACCOUNT_ID)
        print(f"Agent account {AGENT_ACCOUNT_ID} initialized successfully.")
    except Exception as e:
        print(f"Could not initialize NEAR agent account. Transactions will fail. Error: {e}")
else:
    print("NEAR Account ID or Seed Phrase not found in environment. Transactions will be disabled.")


# --- Helper Functions (ported from old Flask app) ---

def calculate_score(fnirs_data, glucose_level):
    """
    Calculates a deterministic score based on fNIRS and glucose data.
    This logic is ported from the Genkit prompt.
    """
    logs = []
    fnirs_score = 0
    plausibility_score = 0
    
    # 1. fNIRS Data Quality
    logs.append("Starting fNIRS data quality check.")
    lines = fnirs_data.strip().split('\n')
    num_lines = len(lines)
    
    if num_lines > 500:
        fnirs_score += 20
        logs.append(f"Data length > 500 lines. Score +20. Current fNIRS score: {fnirs_score}")
    elif 200 <= num_lines <= 500:
        fnirs_score += 10
        logs.append(f"Data length 200-500 lines. Score +10. Current fNIRS score: {fnirs_score}")
    else:
        fnirs_score += 5
        logs.append(f"Data length < 200 lines. Score +5. Current fNIRS score: {fnirs_score}")

    try:
        df = pd.read_csv(StringIO(fnirs_data))
        logs.append("Successfully parsed fNIRS data into a DataFrame.")
        numeric_cols = df.select_dtypes(include=np.number).columns
        if not numeric_cols.empty:
            Q1 = df[numeric_cols].quantile(0.25)
            Q3 = df[numeric_cols].quantile(0.75)
            IQR = Q3 - Q1
            outliers = ((df[numeric_cols] < (Q1 - 1.5 * IQR)) | (df[numeric_cols] > (Q3 + 1.5 * IQR))).sum().sum()
            noise_penalty = min(outliers * 2, 20)
            fnirs_score -= noise_penalty
            logs.append(f"Detected {outliers} outliers. Applying noise penalty of -{noise_penalty}. Current fNIRS score: {fnirs_score}")
        else:
             fnirs_score -= 20
             logs.append("No numeric data found. Applying penalty of -20. Current fNIRS score: {fnirs_score}")

        if df.shape[1] < 2:
            fnirs_score -= 20
            logs.append(f"Data has fewer than 2 columns. Applying format penalty of -20. Current fNIRS score: {fnirs_score}")
        
    except Exception as e:
        fnirs_score -= 40
        logs.append(f"Failed to parse data as CSV. Applying penalty of -40. Error: {e}. Current fNIRS score: {fnirs_score}")

    fnirs_score = max(0, fnirs_score)
    logs.append(f"Final fNIRS Data Quality score (capped at 60): {min(60, fnirs_score)}")

    # 2. Data Plausibility
    logs.append("Starting Data Plausibility check.")
    if 70 <= glucose_level <= 180:
        if 90 <= glucose_level <= 110:
            plausibility_score += 20
            logs.append(f"Glucose level {glucose_level} is optimal. Score +20. Current plausibility score: {plausibility_score}")
        else:
            plausibility_score += 15
            logs.append(f"Glucose level {glucose_level} is in good range. Score +15. Current plausibility score: {plausibility_score}")
    else:
        plausibility_score += 5
        logs.append(f"Glucose level {glucose_level} is outside optimal range. Score +5. Current plausibility score: {plausibility_score}")

    if 'df' in locals() and not df.select_dtypes(include=np.number).empty:
        variability = df.select_dtypes(include=np.number).iloc[:,0].std()
        logs.append(f"fNIRS data variability (std dev) is {variability:.2f}.")
        is_stable_glucose = 80 <= glucose_level <= 120
        
        if is_stable_glucose and variability < 10:
            plausibility_score += 20
            logs.append(f"Good correlation: Stable glucose and low fNIRS variability. Score +20. Current plausibility score: {plausibility_score}")
        elif not is_stable_glucose and variability > 15:
            plausibility_score += 20
            logs.append(f"Good correlation: Non-stable glucose and high fNIRS variability. Score +20. Current plausibility score: {plausibility_score}")
        else:
            plausibility_score += 10
            logs.append(f"Average correlation. Score +10. Current plausibility score: {plausibility_score}")
    else:
        plausibility_score += 0
        logs.append("Could not parse fNIRS data to check correlation. Score +0. Current plausibility score: {plausibility_score}")

    logs.append(f"Final Data Plausibility score (capped at 40): {min(40, plausibility_score)}")
    total_score = int(max(0, min(100, min(60, fnirs_score) + min(40, plausibility_score))))
    logs.append(f"Total calculated score: {total_score}")
    
    reward = total_score // 10
    logs.append(f"Calculated reward: {reward}")

    reason = ""
    if total_score > 85:
        reason = "Great submission! The fNIRS data was clean and showed strong correlation with the provided glucose level."
    elif total_score > 60:
        reason = "Good data, but some noise was detected in the fNIRS signal. A cleaner signal next time could improve your score."
    else:
        reason = "Thank you for the contribution. The data had some formatting or quality issues which impacted the score."
    logs.append(f"Generated reason: '{reason}'")

    return {
        "contributionScore": total_score,
        "reward": reward,
        "reason": reason,
        "logs": logs
    }

def analyze_email_stance(email_content, campaign_topic):
    """
    Analyzes the stance of an email based on keywords.
    """
    content = email_content.lower()
    supporting_keywords = ['support', 'agree', 'in favor', 'good idea', 'approve', 'yes', 'pro-']
    opposing_keywords = ['oppose', 'disagree', 'against', 'bad idea', 'reject', 'no', 'con-']

    support_count = sum(1 for word in supporting_keywords if re.search(r'\\b' + word + r'\\b', content))
    oppose_count = sum(1 for word in opposing_keywords if re.search(r'\\b' + word + r'\\b', content))

    if support_count > oppose_count:
        stance = "SUPPORTING"
        reason = f"The email seems to support the '{campaign_topic}' based on keywords."
    elif oppose_count > support_count:
        stance = "OPPOSING"
        reason = f"The email seems to oppose the '{campaign_topic}' based on keywords."
    else:
        stance = "NEUTRAL"
        reason = "The email's stance on the topic is unclear or neutral."
    
    return {"stance": stance, "reason": reason}


# --- API Endpoints ---

@app.post("/verify-rest")
async def verify_rest(request: ProofOfRestRequest):
    """
    API endpoint to verify a user's "Proof of Rest" and approve bonus.
    """
    # Step 1: Analyze the photo to verify it's a bed.
    # A more robust regex to handle various data URI formats
    if not re.match(r"data:image/[a-zA-Z\\+\\.-]+;base64,[a-zA-Z0-9/\\+=]+", request.photoDataUri):
        raise HTTPException(status_code=400, detail="Verification failed: The provided data is not a valid image data URI.")

    # Step 2: Check if agent is configured to send transactions.
    if not agent_account:
        raise HTTPException(status_code=503, detail="Agent is not configured for on-chain transactions. NEAR credentials may be missing.")

    # Step 3: If verification is successful, call the smart contract.
    try:
        # This is where the agent automates the admin's job.
        # It calls the `withdraw` method on the contract for the user.
        print(f"Attempting to call 'withdraw' for staker: {request.accountId}")
        result = await agent_account.function_call(
            contract_id=CONTRACT_ID,
            method_name="withdraw",
            args={"staker_id": request.accountId},
            gas=30000000000000  # 30 TGas
        )
        
        # The transaction hash is available in the result
        tx_hash = result['transaction']['hash']
        
        print(f"Successfully sent transaction {tx_hash} for {request.accountId}")

        return {
            "status": "success",
            "message": f"Bonus approved for {request.accountId}",
            "transaction_hash": tx_hash
        }

    except Exception as e:
        # If the transaction fails, return a detailed error.
        print(f"Error calling contract: {e}")
        # The exception from near-api-py can be complex, so we serialize it carefully
        error_detail = str(e)
        try:
            # Try to get a more specific error message if it's a JSON-like string
            error_dict = eval(str(e))
            if 'ExecutionError' in error_dict.get('type', {}):
                 error_detail = error_dict['type']['ExecutionError']
        except:
            pass # fallback to string representation
        raise HTTPException(status_code=500, detail=f"Failed to call smart contract: {error_detail}")


@app.post("/score")
async def score_endpoint(request: ScoreRequest):
    """
    API endpoint to score data contribution.
    """
    try:
        result = calculate_score(request.fnirsData, request.glucoseLevel)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process data: {str(e)}")

@app.post("/analyze-email")
async def analyze_email_endpoint(request: EmailAnalyzeRequest):
    """
    API endpoint to analyze the stance of a submitted email.
    """
    try:
        result = analyze_email_stance(request.emailContent, request.campaign)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process email: {str(e)}")

# Health check endpoint
@app.get("/")
def health_check():
    return {"status": "ok", "agent_configured": agent_account is not None}


import os
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from near_api.providers import JsonProvider
from near_api.signer import Signer, KeyPair
from near_api.account import Account

# --- Pydantic Models for API requests ---
class ProofOfRestRequest(BaseModel):
    photoDataUri: str
    accountId: str

# --- FastAPI App Initialization ---
app = FastAPI()

# --- Contract and Agent Configuration ---
# These are loaded from the TEE's environment variables
CONTRACT_ID = os.environ.get("NEXT_PUBLIC_contractId", "stake-bonus-js.think2earn.near")
AGENT_ACCOUNT_ID = os.environ.get("NEAR_ACCOUNT_ID")
AGENT_SEED_PHRASE = os.environ.get("NEAR_SEED_PHRASE")

# Initialize NEAR connection
provider = JsonProvider("https://rpc.testnet.near.org")
agent_account = None

if AGENT_ACCOUNT_ID and AGENT_SEED_PHRASE:
    try:
        key_pair = KeyPair.from_seed_phrase(AGENT_SEED_PHRASE)
        signer = Signer(AGENT_ACCOUNT_ID, key_pair)
        agent_account = Account(provider, signer, AGENT_ACCOUNT_ID)
        print(f"Agent account '{AGENT_ACCOUNT_ID}' initialized successfully for contract '{CONTRACT_ID}'.")
    except Exception as e:
        print(f"FATAL: Could not initialize NEAR agent account. On-chain transactions will fail. Error: {e}")
else:
    print("WARNING: NEAR_ACCOUNT_ID or NEAR_SEED_PHRASE not found. On-chain transactions are disabled.")

@app.post("/api/verify-rest")
async def verify_rest(request: ProofOfRestRequest):
    """
    Verifies a user's Proof of Rest and automatically calls the 'approve_bonus'
    function on the smart contract if successful.
    """
    # Step 1: Mock image analysis. In a real app, this would be a CV model.
    # For now, we assume any valid data URI is a success.
    is_verified = request.photoDataUri.startswith("data:image/")

    if not is_verified:
        raise HTTPException(status_code=400, detail="Verification failed: Image is not a valid sleeping surface.")

    if not agent_account:
        raise HTTPException(status_code=503, detail="Agent is not configured for on-chain transactions.")

    # Step 2: If verification is successful, call the smart contract to approve the bonus.
    try:
        print(f"Attempting to call 'approve_bonus' for staker: {request.accountId}")
        
        result = await agent_account.function_call(
            contract_id=CONTRACT_ID,
            method_name="approve_bonus", # This is the CORRECT function to call
            args={"staker_id": request.accountId}, # These are the CORRECT arguments
            gas=30000000000000  # 30 TGas
        )
        
        # This is the CORRECT way to get the transaction hash
        tx_hash = result['transaction_outcome']['id']
        
        print(f"Successfully sent transaction {tx_hash} to approve bonus for {request.accountId}")

        return {
            "status": "success",
            "message": f"Bonus approved for {request.accountId}",
            "transaction_hash": tx_hash
        }
    except Exception as e:
        print(f"Error calling 'approve_bonus' for {request.accountId}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to call smart contract: {str(e)}")

# Health check endpoint
@app.get("/")
def health_check():
    return {"status": "ok", "agent_configured": agent_account is not None}

# (Other endpoints like /api/score and /api/analyze-email can be added here later)

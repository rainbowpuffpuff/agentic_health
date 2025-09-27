
import os
import base58
from fastapi import FastAPI, HTTPException, Request
from pydantic import BaseModel
from py_near.account import Account
from py_near.dapps.core import NEAR

# Import ML pipeline
from ml_pipeline import ml_app, ScoreContributionRequest

# --- Pydantic Models for API requests ---
class ProofOfRestRequest(BaseModel):
    photoDataUri: str
    accountId: str

# --- FastAPI App Initialization ---
app = FastAPI()
agent_account = None

# --- Startup Event to Initialize NEAR Account ---
# This runs once when the FastAPI server starts.
@app.on_event("startup")
async def startup_event():
    global agent_account
    
    # These are loaded from the TEE's environment variables
    contract_id = os.environ.get("NEXT_PUBLIC_contractId", "stake-bonus-js.think2earn.near")
    agent_account_id = os.environ.get("NEAR_ACCOUNT_ID")
    agent_seed_phrase = os.environ.get("NEAR_SEED_PHRASE")

    if agent_account_id and agent_seed_phrase:
        try:
            # Initialize the Account object with seed phrase directly
            # py-near should handle the key derivation internally
            agent_account = Account(
                account_id=agent_account_id,
                private_key=agent_seed_phrase,  # Using seed phrase as private key for now
                rpc_addr="https://rpc.testnet.near.org"
            )
            await agent_account.startup()
            
            print(f"Agent account '{agent_account_id}' initialized successfully with py-near for contract '{contract_id}'.")
        except Exception as e:
            print(f"FATAL: Could not initialize py-near agent account. On-chain transactions will fail. Error: {e}")
    else:
        print("WARNING: NEAR_ACCOUNT_ID or NEAR_SEED_PHRASE not found. On-chain transactions are disabled.")

# --- API Endpoints ---

@app.post("/api/verify-rest")
async def verify_rest(request: ProofOfRestRequest):
    """
    Verifies a user's Proof of Rest and automatically calls the 'approve_bonus'
    function on the smart contract if successful.
    """
    global agent_account
    contract_id = os.environ.get("NEXT_PUBLIC_contractId", "stake-bonus-js.think2earn.near")

    # Step 1: Mock image analysis
    is_verified = request.photoDataUri.startswith("data:image/")
    if not is_verified:
        raise HTTPException(status_code=400, detail="Verification failed: Image is not a valid sleeping surface.")

    if not agent_account:
        raise HTTPException(status_code=503, detail="Agent is not configured for on-chain transactions.")

    # Step 2: Call the smart contract to approve the bonus using py-near.
    try:
        print(f"Attempting to call 'approve_bonus' for staker: {request.accountId}")
        
        # py-near uses a slightly different syntax for function calls
        result = await agent_account.function_call(
            contract_id=contract_id,
            method_name="approve_bonus",
            args={"staker_id": request.accountId},
            gas=30 * NEAR.TERA,  # 30 TGas in py-near
            nowait=False # Wait for the transaction to complete
        )
        
        tx_hash = result.transaction.hash
        
        print(f"Successfully sent transaction {tx_hash} to approve bonus for {request.accountId}")

        return {
            "status": "success",
            "message": f"Bonus approved for {request.accountId}",
            "transaction_hash": tx_hash
        }
    except Exception as e:
        print(f"Error calling 'approve_bonus' for {request.accountId}: {e}")
        # py-near exceptions can be detailed, so we pass the string representation
        raise HTTPException(status_code=500, detail=f"Failed to call smart contract: {str(e)}")

# Mount ML pipeline endpoints
app.mount("/ml", ml_app)

# Health check endpoint
@app.get("/")
def health_check():
    return {
        "status": "ok", 
        "agent_configured": agent_account is not None,
        "services": ["proof_of_rest", "ml_pipeline"]
    }

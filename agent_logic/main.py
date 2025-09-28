
import os
import base58
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
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

# Add CORS middleware to allow frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:9002", "http://127.0.0.1:9002"],  # Next.js dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

@app.options("/verify-rest")
async def verify_rest_options():
    """Handle CORS preflight requests"""
    return {"status": "ok"}

@app.post("/verify-rest")
async def verify_rest(request: ProofOfRestRequest):
    """
    Verifies a user's Proof of Rest and automatically calls the 'approve_bonus'
    function on the smart contract if successful.
    """
    global agent_account
    contract_id = os.environ.get("NEXT_PUBLIC_contractId", "stake-bonus-js.think2earn.near")

    # Step 1: Computer vision analysis using PaliGemma
    try:
        from sleep_vision import verify_sleep_photo
        
        print(f"Analyzing sleep photo for user: {request.accountId}")
        vision_result = verify_sleep_photo(request.photoDataUri)
        
        is_verified = vision_result['is_valid_sleep_surface']
        confidence = vision_result['confidence']
        analysis = vision_result['analysis']
        
        print(f"Vision analysis result: {is_verified} (confidence: {confidence:.2f})")
        print(f"Analysis: {analysis}")
        
        if not is_verified:
            return {
                "isSleepingSurface": False,
                "status": "failed",
                "reason": f"Sleep verification failed: {vision_result['reason']} (confidence: {confidence:.2f})"
            }
        
        # Require minimum confidence for approval
        if confidence < 0.4:
            return {
                "isSleepingSurface": False,
                "status": "failed",
                "reason": f"Sleep verification confidence too low: {confidence:.2f} < 0.4 required"
            }
            
        print(f"Sleep surface verified with {confidence:.2f} confidence: {analysis}")
        
    except ImportError:
        print("WARNING: sleep_vision module not available, using fallback verification")
        # Fallback to simple verification
        is_verified = request.photoDataUri.startswith("data:image/")
        if not is_verified:
            return {
                "isSleepingSurface": False,
                "status": "failed",
                "reason": "Image is not a valid sleeping surface. Please take a photo of your bed or sleeping area."
            }

    if not agent_account:
        print("WARNING: Agent not configured, returning mock success for testing")
        return {
            "isSleepingSurface": True,
            "status": "success",
            "message": f"Mock verification successful for {request.accountId}",
            "transaction_hash": "mock_tx_hash_for_testing",
            "next_step": "Sleep verification complete! Your bonus has been approved."
        }

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
            "isSleepingSurface": True,
            "status": "success",
            "message": f"Bonus approved for {request.accountId}",
            "transaction_hash": tx_hash,
            "next_step": "Sleep verification complete! Your bonus has been approved on the blockchain."
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

# agentic_health
combine on chain agents with health and financial data 


    
# Mainnet Staking Contract Deployment & Interaction Guide

This guide contains all the successful commands used to set up, deploy, and test the `BonusStakingContract` on the NEAR mainnet.

### Prerequisites

1.  **Node.js & Yarn:** Ensure you have Node.js (via `nvm`) and Yarn installed.
2.  **NEAR CLI:** Ensure `near-cli` is installed and you are logged into your main admin account.
3.  **Two Mainnet Accounts:** You need two separate mainnet accounts that you have access to: one to act as the admin/owner, and one to act as the staker.

---

### Step 1: Set Environment Variables

These variables make the following commands easier to copy and paste. Run these in your terminal.

**Replace the placeholder accounts with your actual mainnet account IDs.**

```bash
# The mainnet account that will own and administer the contract.
export ADMIN_ID=think2earn.near

# A second mainnet account for testing the staking and withdrawing flow.
export USER_ID=hellothink.near

# The sub-account where the contract will be deployed.
export CONTRACT_ID=stake-bonus-js.$ADMIN_ID

  

Step 2: Build and Deploy the Contract

These commands compile the contract and deploy it to the mainnet.
code Bash
IGNORE_WHEN_COPYING_START
IGNORE_WHEN_COPYING_END

    
# 1. Navigate to the JS contract directory
cd contracts/staking_contract_js

# 2. Install dependencies (only needed once)
yarn install

# 3. Build the contract (compiles src/contract.ts to build/contract.wasm)
# Note: Ensure package.json build script outputs 'contract.wasm'
yarn build

# 4. Navigate back to the project root
cd ../..

# 5. Create the contract account on mainnet
near create-account $CONTRACT_ID --masterAccount $ADMIN_ID --initialBalance 5 --networkId mainnet

# 6. Deploy and initialize the contract
near deploy $CONTRACT_ID --wasmFile ./contracts/staking_contract_js/build/contract.wasm --initFunction init --initArgs '{"owner_id": "'$ADMIN_ID'"}' --networkId mainnet

  

Step 3: Test the Full Flow on Mainnet

This sequence tests all the functions of the live contract.
code Bash
IGNORE_WHEN_COPYING_START
IGNORE_WHEN_COPYING_END

    
# 1. ADMIN: Deposit 0.01 NEAR into the reward pool
near call $CONTRACT_ID deposit_reward_funds --accountId $ADMIN_ID --deposit 0.01 --networkId mainnet

# VERIFY (Optional): Check the reward pool balance
near view $CONTRACT_ID get_reward_pool_balance --networkId mainnet


# 2. USER: Stake 0.001 NEAR
# Note: If the USER_ID is not logged in, you must log in first.
# Example: near login (and follow prompts) OR near account import-account using-seed-phrase
near call $CONTRACT_ID stake --accountId $USER_ID --deposit 0.001 --networkId mainnet

# VERIFY (Optional): Check the user's stake info
near view $CONTRACT_ID get_stake_info '{"staker_id": "'$USER_ID'"}' --networkId mainnet


# 3. ADMIN: Approve the bonus for the user
near call $CONTRACT_ID approve_bonus '{"staker_id": "'$USER_ID'"}' --accountId $ADMIN_ID --networkId mainnet

# VERIFY (Optional): Check the bonus_approved flag is now true
near view $CONTRACT_ID get_stake_info '{"staker_id": "'$USER_ID'"}' --networkId mainnet


# 4. USER: Withdraw the stake plus the 10% bonus
near call $CONTRACT_ID withdraw --accountId $USER_ID --gas 30000000000000 --networkId mainnet

# VERIFY (Optional): Check that the reward pool has decreased and the user's stake is gone
near view $CONTRACT_ID get_reward_pool_balance --networkId mainnet
near view $CONTRACT_ID get_stake_info '{"staker_id": "'$USER_ID'"}' --networkId mainnet

  

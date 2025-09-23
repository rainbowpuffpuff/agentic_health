// contracts/staking_contract_js/src/contract.ts

import { NearBindgen, near, call, view, initialize, assert, UnorderedMap, NearPromise } from 'near-sdk-js';
import { AccountId } from 'near-sdk-js/lib/types';

// A class to hold information about each staker.
// This is what we'll store in our UnorderedMap.
class StakerInfo {
  amount: bigint;

  constructor(amount: bigint) {
    this.amount = amount;
  }
}

@NearBindgen({ requireInit: true })
export class BonusStakingContract {
  // The trusted agent account that can trigger withdrawals.
  trusted_agent_id: AccountId = "";
  // The pool of funds available to pay out as bonuses. Using bigint for large numbers.
  reward_pool_balance: bigint = 0n;
  // A map storing each staker's information.
  // Key: Staker's AccountId, Value: StakerInfo
  stakers: UnorderedMap<StakerInfo> = new UnorderedMap("s");

  @initialize({})
  init({ trusted_agent_id }: { trusted_agent_id: AccountId }) {
    // This is the account for the verifiable agent that can trigger rewards.
    this.trusted_agent_id = trusted_agent_id;
  }

  // --- Funding Function ---

  /**
   * Allows anyone to deposit NEAR into the reward pool.
   * This function is payable, meaning it accepts attached NEAR tokens.
   */
  @call({ payableFunction: true })
  deposit_reward_funds(): void {
    const attached_amount = near.attachedDeposit();
    assert(attached_amount > 0n, "Must attach NEAR to deposit");
    this.reward_pool_balance += attached_amount;
    near.log(`Deposited ${attached_amount} into reward pool. New balance: ${this.reward_pool_balance}`);
  }

  // --- Staker Functions ---

  /**
   * Allows any user to stake NEAR.
   */
  @call({ payableFunction: true })
  stake(): void {
    const staker_id = near.predecessorAccountId();
    const deposit = near.attachedDeposit();
    assert(deposit > 0n, "Must attach NEAR to stake");

    let staker_info = this.stakers.get(staker_id) as StakerInfo | null;

    if (staker_info) {
      // If the user already has a stake, add to it.
      staker_info.amount += deposit;
    } else {
      // Otherwise, create a new stake entry.
      staker_info = new StakerInfo(deposit);
    }

    this.stakers.set(staker_id, staker_info);
    near.log(`Account ${staker_id} staked ${deposit}. New total stake: ${staker_info.amount}`);
  }

  /**
   * Allows the trusted agent to withdraw funds for a staker after verifying their action (e.g., Proof of Rest).
   * The staker receives their original stake + a 10% bonus.
   * The bonus is paid from the contract's general reward pool.
   */
  @call({})
  withdraw({ staker_id }: { staker_id: AccountId }): NearPromise {
    // Assert that the function is called by the trusted agent.
    assert(near.predecessorAccountId() === this.trusted_agent_id, "Only the trusted agent can call this method");
    
    const staker_info = this.stakers.get(staker_id) as StakerInfo | null;
    assert(staker_info !== null, `Staker '${staker_id}' has no funds to withdraw`);

    let amount_to_withdraw = staker_info.amount;

    const bonus = (staker_info.amount * 10n) / 100n; // Using bigint math for safety
    
    assert(this.reward_pool_balance >= bonus, `Not enough funds in reward pool for bonus. Pool has ${this.reward_pool_balance}, bonus is ${bonus}`);
    
    amount_to_withdraw += bonus;
    this.reward_pool_balance -= bonus;
    
    near.log(`Withdrawing stake of ${staker_info.amount} + bonus of ${bonus} for ${staker_id}`);

    // Remove the stake from the map.
    this.stakers.remove(staker_id);

    // Transfer the total amount to the staker.
    return NearPromise.new(staker_id).transfer(amount_to_withdraw);
  }

  // --- View Functions ---

  @view({})
  get_stake_info({ staker_id }: { staker_id: AccountId }): StakerInfo | null {
    return this.stakers.get(staker_id) as StakerInfo | null;
  }

  @view({})
  get_reward_pool_balance(): string {
    return this.reward_pool_balance.toString();
  }

  @view({})
  get_trusted_agent(): AccountId {
    return this.trusted_agent_id;
  }
}

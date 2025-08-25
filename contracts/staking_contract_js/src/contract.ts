// contracts/staking_contract_js/src/contract.ts

import { NearBindgen, near, call, view, initialize, assert, UnorderedMap, NearPromise } from 'near-sdk-js';
import { AccountId } from 'near-sdk-js/lib/types';

// A class to hold information about each staker.
// This is what we'll store in our UnorderedMap.
class StakerInfo {
  amount: bigint;
  bonus_approved: boolean;

  constructor(amount: bigint) {
    this.amount = amount;
    this.bonus_approved = false;
  }
}

@NearBindgen({ requireInit: true })
export class BonusStakingContract {
  // The admin account who can approve bonuses.
  owner_id: AccountId = "";
  // The pool of funds available to pay out as bonuses. Using bigint for large numbers.
  reward_pool_balance: bigint = 0n;
  // A map storing each staker's information.
  // Key: Staker's AccountId, Value: StakerInfo
  stakers: UnorderedMap<StakerInfo> = new UnorderedMap("s");

  @initialize({})
  init({ owner_id }: { owner_id: AccountId }) {
    this.owner_id = owner_id;
  }

  // --- Admin & Funding Functions ---

  /**
   * Allows anyone (usually the admin) to deposit NEAR into the reward pool.
   * This function is payable, meaning it accepts attached NEAR tokens.
   */
  @call({ payableFunction: true })
  deposit_reward_funds(): void {
    const attached_amount = near.attachedDeposit();
    assert(attached_amount > 0n, "Must attach NEAR to deposit");
    this.reward_pool_balance += attached_amount;
    near.log(`Deposited ${attached_amount} into reward pool. New balance: ${this.reward_pool_balance}`);
  }

  /**
   * Admin-only function to approve a bonus for a specific staker.
   * This simulates the "check condition" passing.
   */
  @call({})
  approve_bonus({ staker_id }: { staker_id: AccountId }): void {
    assert(near.predecessorAccountId() === this.owner_id, "Only the owner can approve bonuses");
    
    let staker_info = this.stakers.get(staker_id) as StakerInfo | null;
    assert(staker_info !== null, `Staker '${staker_id}' not found`);

    staker_info.bonus_approved = true;
    this.stakers.set(staker_id, staker_info);
    near.log(`Bonus approved for ${staker_id}`);
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
   * Allows a staker to withdraw their funds.
   * If their bonus is approved, they receive their stake + 10%.
   * The bonus is paid from the reward pool.
   */
  @call({})
  withdraw(): NearPromise {
    const staker_id = near.predecessorAccountId();
    
    const staker_info = this.stakers.get(staker_id) as StakerInfo | null;
    assert(staker_info !== null, "You have no funds to withdraw");

    let amount_to_withdraw = staker_info.amount;

    if (staker_info.bonus_approved) {
      const bonus = (staker_info.amount * 10n) / 100n; // Using bigint math for safety
      
      assert(this.reward_pool_balance >= bonus, `Not enough funds in reward pool for bonus. Pool has ${this.reward_pool_balance}, bonus is ${bonus}`);
      
      amount_to_withdraw += bonus;
      this.reward_pool_balance -= bonus;
      
      near.log(`Withdrawing stake of ${staker_info.amount} + bonus of ${bonus} for ${staker_id}`);
    } else {
      near.log(`Withdrawing stake of ${staker_info.amount}. No bonus approved.`);
    }

    this.stakers.remove(staker_id);

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
  get_owner(): AccountId {
    return this.owner_id;
  }
  
  // New view function to get all stakers
  @view({})
  get_stakers({ from_index = 0, limit = 50 }: { from_index: number, limit: number }): [AccountId, StakerInfo][] {
    const staker_keys = this.stakers.keys();
    const result: [AccountId, StakerInfo][] = [];
    for (let i = from_index; i < staker_keys.length && i < from_index + limit; i++) {
        const key = staker_keys[i];
        const value = this.stakers.get(key) as StakerInfo;
        result.push([key, value]);
    }
    return result;
  }
}

    
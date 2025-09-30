import { Worker } from 'near-workspaces';
import anyTest from 'ava';
import { setDefaultResultOrder } from 'dns';

// This is the critical fix for the timeout issue in Node.js v17+
setDefaultResultOrder('ipv4first');

/**
 *  @typedef {import('near-workspaces').NearAccount} NearAccount
 *  @type {import('ava').TestFn<{worker: Worker, accounts: Record<string, NearAccount>}>}
 */
const test = anyTest;

// Use beforeEach to create a fresh, isolated sandbox for each test.
test.beforeEach(async t => {
  const worker = t.context.worker = await Worker.init();

  const root = worker.rootAccount;
  const contract = await root.createSubAccount('contract');
  const owner = await root.createSubAccount('owner');
  const agent = await root.createSubAccount('agent');
  const alice = await root.createSubAccount('alice');

  await contract.deploy(process.argv[2]);

  await contract.call(contract, 'init', { owner_id: owner.accountId, agent_id: agent.accountId });
  
  t.context.accounts = { root, contract, owner, agent, alice };
});

test.afterEach.always(async (t) => {
  await t.context.worker.tearDown().catch((error) => {
    console.log('Failed to stop the Sandbox:', error);
  });
});

// --- TEST SUITE ---

test('1. Initialization: Contract initializes with correct owner and agent', async (t) => {
  const { contract, owner, agent } = t.context.accounts;
  
  const ownerId = await contract.view('get_owner', {});
  const agentId = await contract.view('get_agent', {});

  t.is(ownerId, owner.accountId);
  t.is(agentId, agent.accountId);
});

test('2. Staking: A user can stake NEAR', async (t) => {
  const { contract, alice } = t.context.accounts;
  const stakeAmount = '1000000000000000000000000'; // 1 NEAR

  await alice.call(contract, 'stake', {}, { attachedDeposit: stakeAmount });

  const stakeInfo = await contract.view('get_stake_info', { staker_id: alice.accountId });
  
  t.is(stakeInfo.amount, stakeAmount);
  t.false(stakeInfo.bonus_approved);
});


test('3. Permissions: A non-agent cannot approve a bonus', async (t) => {
  const { contract, alice, owner } = t.context.accounts;
  await alice.call(contract, 'stake', {}, { attachedDeposit: '1000000000000000000000000' });

  const aliceApproval = alice.call(contract, 'approve_bonus', { staker_id: alice.accountId });
  await t.throwsAsync(aliceApproval, { message: /Only the designated agent can approve bonuses/ });

  const ownerApproval = owner.call(contract, 'approve_bonus', { staker_id: alice.accountId });
  await t.throwsAsync(ownerApproval, { message: /Only the designated agent can approve bonuses/ });
});

test('4. Withdrawal (No Bonus): A user receives only their stake if bonus is not approved', async (t) => {
    const { contract, alice } = t.context.accounts;
    const stakeAmount = BigInt('1000000000000000000000000'); // 1 NEAR
  
    await alice.call(contract, 'stake', {}, { attachedDeposit: stakeAmount.toString() });
    const balanceBefore = await alice.balance();
    await alice.call(contract, 'withdraw', {});
    const balanceAfter = await alice.balance();
    const profit = BigInt(balanceAfter.total) - BigInt(balanceBefore.total);
    
    t.true(profit < stakeAmount, 'Profit should be negative (due to gas) when no bonus is paid.');
});

test('5. Full Flow: Stake -> Approve -> Withdraw with Bonus', async (t) => {
  const { contract, owner, agent, alice } = t.context.accounts;
  const stakeAmount = BigInt('1000000000000000000000000'); // 1 NEAR
  const rewardDeposit = BigInt('200000000000000000000000'); // 0.2 NEAR for the pool

  await owner.call(contract, 'deposit_reward_funds', {}, { attachedDeposit: rewardDeposit.toString() });
  await alice.call(contract, 'stake', {}, { attachedDeposit: stakeAmount.toString() });
  await agent.call(contract, 'approve_bonus', { staker_id: alice.accountId });

  const stakeInfo = await contract.view('get_stake_info', { staker_id: alice.accountId });
  t.true(stakeInfo.bonus_approved, 'Bonus status should be true after agent approval.');

  const balanceBefore = await alice.balance();
  await alice.call(contract, 'withdraw', {});
  const balanceAfter = await alice.balance();
  const profit = BigInt(balanceAfter.total) - BigInt(balanceBefore.total);
  
  t.true(profit > stakeAmount, 'Profit should be positive and greater than original stake.');
  
  const finalStakeInfo = await contract.view('get_stake_info', { staker_id: alice.accountId });
  t.is(finalStakeInfo, null, 'Staker info should be deleted after withdrawal.');
});


test('6. Admin: Owner can change the agent', async (t) => {
  const { contract, owner, root } = t.context.accounts;
  const newAgent = await root.createSubAccount('new_agent');

  await owner.call(contract, 'change_agent', { new_agent_id: newAgent.accountId });

  const updatedAgentId = await contract.view('get_agent', {});
  t.is(updatedAgentId, newAgent.accountId);

  const nonOwnerAttempt = root.call(contract, 'change_agent', { new_agent_id: root.accountId });
  await t.throwsAsync(nonOwnerAttempt, { message: /Only the owner can change the agent/ });
});
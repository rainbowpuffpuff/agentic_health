/**
 * React hooks for contract interactions
 * 
 * This file provides React hooks that make it easy to interact
 * with the NEAR staking contract from React components.
 */

import { useState, useEffect, useCallback } from 'react';
import { useWalletSelector } from '@/components/WalletProvider';
import { 
  contractInterface, 
  ContractTransactionBuilder,
  ContractUtils,
  type ContractBalance,
  type StakerInfo,
  type DepositTransaction 
} from '@/lib/contract-interface';

/**
 * Hook for managing contract balance
 */
export function useContractBalance() {
  const [balance, setBalance] = useState<ContractBalance | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBalance = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const contractBalance = await contractInterface.getContractBalance();
      setBalance(contractBalance);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch balance');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshBalance = useCallback(() => {
    fetchBalance();
  }, [fetchBalance]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  return {
    balance,
    isLoading,
    error,
    refreshBalance
  };
}

/**
 * Hook for managing staker information
 */
export function useStakerInfo(accountId?: string) {
  const [stakerInfo, setStakerInfo] = useState<StakerInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStakerInfo = useCallback(async (stakerId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const info = await contractInterface.getStakeInfo(stakerId);
      setStakerInfo(info);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch staker info');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (accountId) {
      fetchStakerInfo(accountId);
    }
  }, [accountId, fetchStakerInfo]);

  return {
    stakerInfo,
    isLoading,
    error,
    refetch: accountId ? () => fetchStakerInfo(accountId) : undefined
  };
}

/**
 * Hook for deposit functionality
 */
export function useDeposit() {
  const { wallet, accountId } = useWalletSelector();
  const [transaction, setTransaction] = useState<DepositTransaction | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const deposit = useCallback(async (amountInNear: string): Promise<boolean> => {
    if (!wallet || !accountId) {
      throw new Error('Wallet not connected');
    }

    if (!ContractUtils.isValidNearAmount(amountInNear)) {
      throw new Error('Invalid amount format');
    }

    setIsLoading(true);
    
    const newTransaction: DepositTransaction = {
      amount: amountInNear,
      status: 'pending',
      timestamp: new Date()
    };
    
    setTransaction(newTransaction);

    try {
      const transactionConfig = ContractTransactionBuilder.buildDepositTransaction(amountInNear);
      const result = await wallet.signAndSendTransaction(transactionConfig);
      
      // Update transaction with success
      const successTransaction: DepositTransaction = {
        ...newTransaction,
        status: 'success',
        transactionHash: result.transaction.hash
      };
      
      setTransaction(successTransaction);
      return true;
      
    } catch (error) {
      // Update transaction with failure
      const failedTransaction: DepositTransaction = {
        ...newTransaction,
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Transaction failed'
      };
      
      setTransaction(failedTransaction);
      throw error;
      
    } finally {
      setIsLoading(false);
    }
  }, [wallet, accountId]);

  const resetTransaction = useCallback(() => {
    setTransaction(null);
  }, []);

  return {
    deposit,
    transaction,
    isLoading,
    resetTransaction
  };
}

/**
 * Hook for wallet balance information
 */
export function useWalletBalance() {
  const { accountId } = useWalletSelector();
  const [balance, setBalance] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBalance = useCallback(async (account: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // This would need to be implemented with NEAR RPC calls
      // For now, we'll return a placeholder
      // TODO: Implement actual wallet balance fetching
      setBalance("0");
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch wallet balance');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (accountId) {
      fetchBalance(accountId);
    }
  }, [accountId, fetchBalance]);

  return {
    balance,
    isLoading,
    error,
    refetch: accountId ? () => fetchBalance(accountId) : undefined
  };
}

/**
 * Hook for contract admin information
 */
export function useContractAdmin() {
  const [owner, setOwner] = useState<string | null>(null);
  const [agent, setAgent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAdminInfo = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const [ownerResult, agentResult] = await Promise.all([
        contractInterface.getOwner(),
        contractInterface.getAgent()
      ]);
      
      setOwner(ownerResult);
      setAgent(agentResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch admin info');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAdminInfo();
  }, [fetchAdminInfo]);

  return {
    owner,
    agent,
    isLoading,
    error,
    refetch: fetchAdminInfo
  };
}
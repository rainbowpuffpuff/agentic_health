/**
 * Contract Interface for NEAR Staking Contract v2
 * 
 * This file provides TypeScript interfaces and utility functions
 * for interacting with the NEAR staking contract.
 */

import { providers, utils } from 'near-api-js';
import type { CodeResult } from "near-api-js/lib/providers/provider";
import { CONTRACT_ID } from './constants';

// Network configuration
const NETWORK_CONFIG = {
  networkId: "testnet",
  nodeUrl: "https://rpc.testnet.near.org",
  walletUrl: "https://testnet.mynearwallet.com/",
  helperUrl: "https://helper.testnet.near.org",
  explorerUrl: "https://testnet.nearblocks.io",
};

// Gas constants
export const THIRTY_TGAS = "30000000000000";
export const ONE_YOCTO = "1";

// Type definitions for contract data structures
export interface StakerInfo {
  amount: string;
  bonus_approved: boolean;
}

export interface ContractBalance {
  balance: string;          // Balance in yoctoNEAR
  balanceFormatted: string; // Human-readable balance in NEAR
  lastUpdated: Date;
  status: 'healthy' | 'low' | 'critical';
}

export interface DepositTransaction {
  amount: string;           // Amount in NEAR
  transactionHash?: string;
  status: 'pending' | 'success' | 'failed';
  timestamp: Date;
  errorMessage?: string;
  gasUsed?: string;
}

export interface WalletBalance {
  available: string;        // Available balance in NEAR
  reserved: string;         // Reserved for storage/gas
  total: string;           // Total balance
}

/**
 * Contract Interface Class
 * Provides methods for interacting with the staking contract
 */
export class ContractInterface {
  private provider: providers.JsonRpcProvider;

  constructor() {
    this.provider = new providers.JsonRpcProvider({ url: NETWORK_CONFIG.nodeUrl });
  }

  /**
   * Get staker information for a specific account
   */
  async getStakeInfo(stakerId: string): Promise<StakerInfo | null> {
    try {
      const res = await this.provider.query<CodeResult>({
        request_type: "call_function",
        finality: "final",
        account_id: CONTRACT_ID,
        method_name: "get_stake_info",
        args_base64: btoa(JSON.stringify({ staker_id: stakerId }))
      });
      
      const result = JSON.parse(Buffer.from(res.result).toString());
      return result;
    } catch (error) {
      console.error('Error fetching stake info:', error);
      return null;
    }
  }

  /**
   * Get the current contract reward pool balance
   */
  async getContractBalance(): Promise<ContractBalance> {
    try {
      const res = await this.provider.query<CodeResult>({
        request_type: "call_function",
        finality: "final",
        account_id: CONTRACT_ID,
        method_name: "get_reward_pool_balance",
        args_base64: btoa(JSON.stringify({}))
      });
      
      const balanceYocto = JSON.parse(Buffer.from(res.result).toString());
      const balanceFormatted = utils.format.formatNearAmount(balanceYocto);
      const balanceNumber = parseFloat(balanceFormatted);
      
      let status: 'healthy' | 'low' | 'critical';
      if (balanceNumber > 10) {
        status = 'healthy';
      } else if (balanceNumber >= 1) {
        status = 'low';
      } else {
        status = 'critical';
      }

      return {
        balance: balanceYocto,
        balanceFormatted,
        lastUpdated: new Date(),
        status
      };
    } catch (error) {
      console.error('Error fetching contract balance:', error);
      throw new Error('Failed to fetch contract balance');
    }
  }

  /**
   * Get the contract owner account ID
   */
  async getOwner(): Promise<string> {
    try {
      const res = await this.provider.query<CodeResult>({
        request_type: "call_function",
        finality: "final",
        account_id: CONTRACT_ID,
        method_name: "get_owner",
        args_base64: btoa(JSON.stringify({}))
      });
      
      return JSON.parse(Buffer.from(res.result).toString());
    } catch (error) {
      console.error('Error fetching contract owner:', error);
      throw new Error('Failed to fetch contract owner');
    }
  }

  /**
   * Get the contract agent account ID
   */
  async getAgent(): Promise<string> {
    try {
      const res = await this.provider.query<CodeResult>({
        request_type: "call_function",
        finality: "final",
        account_id: CONTRACT_ID,
        method_name: "get_agent",
        args_base64: btoa(JSON.stringify({}))
      });
      
      return JSON.parse(Buffer.from(res.result).toString());
    } catch (error) {
      console.error('Error fetching contract agent:', error);
      throw new Error('Failed to fetch contract agent');
    }
  }
}

/**
 * Contract Transaction Builder
 * Provides methods for building contract transactions
 */
export class ContractTransactionBuilder {
  /**
   * Build a deposit transaction
   */
  static buildDepositTransaction(amountInNear: string) {
    const deposit = utils.format.parseNearAmount(amountInNear) || "0";
    
    return {
      receiverId: CONTRACT_ID,
      actions: [{
        type: 'FunctionCall' as const,
        params: {
          methodName: 'deposit_reward_funds',
          args: {},
          gas: THIRTY_TGAS,
          deposit
        }
      }]
    };
  }

  /**
   * Build a stake transaction
   */
  static buildStakeTransaction(amountInNear: string) {
    const deposit = utils.format.parseNearAmount(amountInNear) || "0";
    
    return {
      receiverId: CONTRACT_ID,
      actions: [{
        type: 'FunctionCall' as const,
        params: {
          methodName: 'stake',
          args: {},
          gas: THIRTY_TGAS,
          deposit
        }
      }]
    };
  }

  /**
   * Build a withdraw transaction
   */
  static buildWithdrawTransaction() {
    return {
      receiverId: CONTRACT_ID,
      actions: [{
        type: 'FunctionCall' as const,
        params: {
          methodName: 'withdraw',
          args: {},
          gas: THIRTY_TGAS,
          deposit: "0"
        }
      }]
    };
  }
}

/**
 * Utility functions for contract interactions
 */
export class ContractUtils {
  /**
   * Format yoctoNEAR to human-readable NEAR amount
   */
  static formatNearAmount(yoctoNear: string): string {
    return utils.format.formatNearAmount(yoctoNear);
  }

  /**
   * Parse NEAR amount to yoctoNEAR
   */
  static parseNearAmount(nearAmount: string): string {
    return utils.format.parseNearAmount(nearAmount) || "0";
  }

  /**
   * Validate NEAR amount format
   */
  static isValidNearAmount(amount: string): boolean {
    try {
      const parsed = parseFloat(amount);
      return !isNaN(parsed) && parsed > 0 && parsed <= 1000000; // Reasonable upper limit
    } catch {
      return false;
    }
  }

  /**
   * Calculate estimated transaction fee
   */
  static getEstimatedTransactionFee(): string {
    // Rough estimate for transaction fees (in NEAR)
    return "0.001";
  }

  /**
   * Get balance status color for UI
   */
  static getBalanceStatusColor(status: ContractBalance['status']): string {
    switch (status) {
      case 'healthy': return 'text-green-600';
      case 'low': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  }

  /**
   * Get balance status message
   */
  static getBalanceStatusMessage(status: ContractBalance['status']): string {
    switch (status) {
      case 'healthy': return 'Contract has sufficient funds for bonuses';
      case 'low': return 'Contract balance is getting low';
      case 'critical': return 'Contract balance is critically low - withdrawals may fail';
      default: return 'Unknown balance status';
    }
  }
}

// Create singleton instance for easy import
export const contractInterface = new ContractInterface();
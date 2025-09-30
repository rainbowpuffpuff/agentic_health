/**
 * AdminDeposit Component
 * 
 * Main component that integrates ContractBalance and DepositForm
 * for the admin deposit interface functionality.
 */

'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Shield, Info, Users } from 'lucide-react';
import { useWalletSelector } from '@/components/WalletProvider';
import { useToast } from '@/hooks/use-toast';
import ContractBalance from './ContractBalance';
import DepositForm from './DepositForm';
import { cn } from '@/lib/utils';

interface AdminDepositProps {
  isAdminMode?: boolean;  // Future: restrict to admins only
  className?: string;
}

export default function AdminDeposit({ 
  isAdminMode = false, 
  className 
}: AdminDepositProps) {
  const { accountId } = useWalletSelector();
  const { toast } = useToast();
  const [refreshKey, setRefreshKey] = useState(0);

  // Force refresh of balance component after successful deposit
  const handleDepositSuccess = useCallback(() => {
    setRefreshKey(prev => prev + 1);
    
    toast({
      title: "Deposit Successful!",
      description: "Contract balance has been updated. Users can now withdraw bonuses.",
      duration: 5000
    });
  }, [toast]);

  const handleDepositStart = useCallback(() => {
    toast({
      title: "Processing Deposit",
      description: "Please confirm the transaction in your wallet.",
      duration: 3000
    });
  }, [toast]);

  // Future admin mode check
  if (isAdminMode && !accountId) {
    return (
      <Card className={cn("border-yellow-200 bg-yellow-50", className)}>
        <CardHeader>
          <CardTitle className="flex items-center text-yellow-800">
            <Shield className="h-5 w-5 mr-2" />
            Admin Access Required
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-yellow-700">
            Please connect your wallet to access the admin deposit interface.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <DollarSign className="h-6 w-6 mr-2 text-primary" />
              Contract Fund Management
            </span>
            <div className="flex items-center space-x-2">
              {isAdminMode ? (
                <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                  <Shield className="h-3 w-3 mr-1" />
                  Admin Mode
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  <Users className="h-3 w-3 mr-1" />
                  Public Access
                </Badge>
              )}
            </div>
          </CardTitle>
          <CardDescription>
            {isAdminMode 
              ? "Administrative interface for managing contract funds and bonus payouts."
              : "Help fund the contract to ensure bonus payouts are available for all users."
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              {isAdminMode 
                ? "As an admin, you can deposit NEAR tokens to maintain the contract's reward pool balance."
                : "Anyone can contribute NEAR tokens to help maintain the reward pool for bonus payouts."
              }
              {" "}Deposited funds are used exclusively for user bonus rewards when they complete sleep verification.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Balance and Deposit Section */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Contract Balance Display */}
        <ContractBalance 
          key={refreshKey} // Force refresh after deposits
          showRefreshButton={true}
        />

        {/* Deposit Form */}
        <DepositForm 
          onDepositSuccess={handleDepositSuccess}
          onDepositStart={handleDepositStart}
        />
      </div>

      {/* Information Section */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-800 flex items-center">
            <Info className="h-5 w-5 mr-2" />
            How It Works
          </CardTitle>
        </CardHeader>
        <CardContent className="text-blue-700">
          <div className="space-y-3 text-sm">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 rounded-full bg-blue-200 flex items-center justify-center text-blue-800 font-semibold text-xs flex-shrink-0 mt-0.5">
                1
              </div>
              <div>
                <p className="font-medium">Deposit Funds</p>
                <p className="text-blue-600">
                  NEAR tokens you deposit go directly into the contract's reward pool.
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 rounded-full bg-blue-200 flex items-center justify-center text-blue-800 font-semibold text-xs flex-shrink-0 mt-0.5">
                2
              </div>
              <div>
                <p className="font-medium">Users Earn Bonuses</p>
                <p className="text-blue-600">
                  When users complete sleep verification, they become eligible for a 10% bonus on their staked amount.
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 rounded-full bg-blue-200 flex items-center justify-center text-blue-800 font-semibold text-xs flex-shrink-0 mt-0.5">
                3
              </div>
              <div>
                <p className="font-medium">Automatic Payouts</p>
                <p className="text-blue-600">
                  Bonus payments are automatically deducted from the reward pool when users withdraw their stakes.
                </p>
              </div>
            </div>
          </div>

          <Separator className="my-4 bg-blue-300" />

          <div className="text-xs text-blue-600">
            <p className="font-medium mb-1">Security & Transparency:</p>
            <p>
              All transactions are recorded on the NEAR blockchain and can be verified through the 
              {" "}<a 
                href="https://testnet.nearblocks.io" 
                target="_blank" 
                rel="noopener noreferrer"
                className="underline hover:text-blue-800"
              >
                NEAR Explorer
              </a>.
              {" "}Funds can only be used for bonus payouts as defined in the smart contract.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Wallet Connection Prompt */}
      {!accountId && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-orange-800 font-medium mb-2">
                Connect Your Wallet
              </p>
              <p className="text-orange-700 text-sm">
                Connect your NEAR wallet to deposit funds and help maintain the reward pool.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
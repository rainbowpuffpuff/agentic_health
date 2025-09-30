/**
 * DepositForm Component
 * 
 * Form for depositing NEAR tokens into the staking contract
 * with comprehensive validation and user feedback.
 */

'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader, DollarSign, AlertTriangle, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useWalletSelector } from '@/components/WalletProvider';
import { useDeposit, useWalletBalance } from '@/hooks/useContract';
import { ContractUtils } from '@/lib/contract-interface';
import { cn } from '@/lib/utils';

// Create validation schema factory that takes wallet balance
const createDepositSchema = (walletBalance?: string) => z.object({
  amount: z
    .string()
    .min(1, 'Amount is required')
    .refine((val) => {
      const num = parseFloat(val);
      return !isNaN(num) && num > 0;
    }, 'Amount must be a positive number')
    .refine((val) => {
      return ContractUtils.isValidNearAmount(val);
    }, 'Invalid NEAR amount format')
    .refine((val) => {
      const num = parseFloat(val);
      return num <= 1000000; // Reasonable upper limit
    }, 'Amount is too large')
    .refine((val) => {
      if (!walletBalance) return true; // Skip validation if balance not loaded
      const amount = parseFloat(val);
      const balance = parseFloat(walletBalance);
      const fee = parseFloat(ContractUtils.getEstimatedTransactionFee());
      return amount + fee <= balance;
    }, 'Insufficient wallet balance (including transaction fee)')
});

type DepositFormData = z.infer<ReturnType<typeof createDepositSchema>>;

interface DepositFormProps {
  className?: string;
  onDepositSuccess?: () => void;
  onDepositStart?: () => void;
}

export default function DepositForm({ 
  className, 
  onDepositSuccess,
  onDepositStart 
}: DepositFormProps) {
  const { accountId } = useWalletSelector();
  const { deposit, transaction, isLoading, resetTransaction } = useDeposit();
  const { balance: walletBalance, isLoading: isLoadingBalance } = useWalletBalance();
  const { toast } = useToast();
  const [showAdvanced, setShowAdvanced] = useState(false);

  const form = useForm<DepositFormData>({
    resolver: zodResolver(createDepositSchema(walletBalance || undefined)),
    defaultValues: {
      amount: ''
    }
  });

  // Re-validate form when wallet balance changes
  useEffect(() => {
    if (walletBalance) {
      form.trigger(); // Re-run validation
    }
  }, [walletBalance, form]);

  const watchedAmount = form.watch('amount');
  const estimatedFee = ContractUtils.getEstimatedTransactionFee();

  // Calculate total cost (amount + fee)
  const getTotalCost = () => {
    const amount = parseFloat(watchedAmount || '0');
    const fee = parseFloat(estimatedFee);
    return (amount + fee).toFixed(6);
  };

  const onSubmit = async (data: DepositFormData) => {
    if (!accountId) {
      toast({
        variant: "destructive",
        title: "Wallet Not Connected",
        description: "Please connect your NEAR wallet to deposit funds."
      });
      return;
    }

    try {
      onDepositStart?.();
      await deposit(data.amount);
      
      toast({
        title: "Deposit Successful!",
        description: `Successfully deposited ${data.amount} NEAR to the contract.`
      });
      
      form.reset();
      onDepositSuccess?.();
      
    } catch (error) {
      console.error('Deposit failed:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      toast({
        variant: "destructive",
        title: "Deposit Failed",
        description: errorMessage
      });
    }
  };

  const handleReset = () => {
    form.reset();
    resetTransaction();
  };

  // Show transaction status if there's an active transaction
  if (transaction) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Deposit Status</CardTitle>
          <CardDescription>
            Depositing {transaction.amount} NEAR to contract
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-3">
            {transaction.status === 'pending' && (
              <>
                <Loader className="h-5 w-5 animate-spin text-primary" />
                <span>Processing transaction...</span>
              </>
            )}
            {transaction.status === 'success' && (
              <>
                <div className="h-5 w-5 rounded-full bg-green-500 flex items-center justify-center">
                  <div className="h-2 w-2 rounded-full bg-white" />
                </div>
                <span className="text-green-700">Transaction successful!</span>
              </>
            )}
            {transaction.status === 'failed' && (
              <>
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <span className="text-red-700">Transaction failed</span>
              </>
            )}
          </div>

          {transaction.transactionHash && (
            <div className="text-sm text-muted-foreground">
              Transaction Hash: 
              <a 
                href={`https://testnet.nearblocks.io/txns/${transaction.transactionHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-1 text-primary hover:underline"
              >
                {transaction.transactionHash.slice(0, 20)}...
              </a>
            </div>
          )}

          {transaction.errorMessage && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {transaction.errorMessage}
              </AlertDescription>
            </Alert>
          )}

          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              onClick={handleReset}
              disabled={transaction.status === 'pending'}
            >
              {transaction.status === 'success' ? 'Make Another Deposit' : 'Try Again'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center">
          <DollarSign className="h-5 w-5 mr-2" />
          Deposit Funds
        </CardTitle>
        <CardDescription>
          Add NEAR tokens to the contract for bonus payouts
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (NEAR)</Label>
            <div className="relative">
              <Input
                id="amount"
                type="number"
                step="0.000001"
                min="0"
                max="1000000"
                placeholder="0.000000"
                {...form.register('amount')}
                className={cn(
                  "pr-16",
                  form.formState.errors.amount && "border-red-500"
                )}
                disabled={isLoading}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                NEAR
              </div>
            </div>
            {form.formState.errors.amount && (
              <p className="text-sm text-red-600">
                {form.formState.errors.amount.message}
              </p>
            )}
          </div>

          {/* Wallet Balance Display */}
          {accountId && (
            <div className="text-sm text-muted-foreground">
              <div className="flex justify-between items-center">
                <span>Wallet Balance:</span>
                <span>
                  {isLoadingBalance ? (
                    <Loader className="h-3 w-3 animate-spin inline" />
                  ) : walletBalance ? (
                    `${walletBalance} NEAR`
                  ) : (
                    'Unable to load'
                  )}
                </span>
              </div>
            </div>
          )}

          {watchedAmount && parseFloat(watchedAmount) > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-2">
              <div className="flex items-center text-blue-800">
                <Info className="h-4 w-4 mr-2" />
                <span className="font-medium">Transaction Summary</span>
              </div>
              <div className="text-sm text-blue-700 space-y-1">
                <div className="flex justify-between">
                  <span>Deposit Amount:</span>
                  <span>{watchedAmount} NEAR</span>
                </div>
                <div className="flex justify-between">
                  <span>Estimated Fee:</span>
                  <span>{estimatedFee} NEAR</span>
                </div>
                <div className="flex justify-between font-medium border-t border-blue-300 pt-1">
                  <span>Total Cost:</span>
                  <span>{getTotalCost()} NEAR</span>
                </div>
                {walletBalance && (
                  <div className="flex justify-between text-xs">
                    <span>Remaining Balance:</span>
                    <span>
                      {(parseFloat(walletBalance) - parseFloat(getTotalCost())).toFixed(6)} NEAR
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {!accountId && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Please connect your NEAR wallet to deposit funds.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex space-x-2">
            <Button 
              type="submit" 
              disabled={!accountId || isLoading || !form.formState.isValid}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <Loader className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <DollarSign className="h-4 w-4 mr-2" />
                  Deposit {watchedAmount || '0'} NEAR
                </>
              )}
            </Button>
            
            {form.formState.isDirty && (
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleReset}
                disabled={isLoading}
              >
                Reset
              </Button>
            )}
          </div>

          <div className="text-xs text-muted-foreground">
            <p>
              Funds will be added to the contract's reward pool and used for bonus payouts.
              This transaction requires NEAR wallet approval.
            </p>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
/**
 * ContractBalance Component
 * 
 * Displays the current NEAR contract balance with visual status indicators
 * and refresh functionality.
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader, RefreshCw, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { useContractBalance } from '@/hooks/useContract';
import { ContractUtils } from '@/lib/contract-interface';
import { cn } from '@/lib/utils';

interface ContractBalanceProps {
  className?: string;
  showRefreshButton?: boolean;
  onBalanceUpdate?: (balance: string) => void;
}

export default function ContractBalance({ 
  className, 
  showRefreshButton = true,
  onBalanceUpdate 
}: ContractBalanceProps) {
  const { balance, isLoading, error, refreshBalance } = useContractBalance();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshBalance();
    setIsRefreshing(false);
    
    if (balance && onBalanceUpdate) {
      onBalanceUpdate(balance.balanceFormatted);
    }
  };

  const getStatusIcon = () => {
    if (!balance) return null;
    
    switch (balance.status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'low':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'critical':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusBadge = () => {
    if (!balance) return null;
    
    const statusConfig = {
      healthy: { variant: 'default' as const, label: 'Healthy' },
      low: { variant: 'secondary' as const, label: 'Low' },
      critical: { variant: 'destructive' as const, label: 'Critical' }
    };
    
    const config = statusConfig[balance.status];
    
    return (
      <Badge variant={config.variant} className="ml-2">
        {config.label}
      </Badge>
    );
  };

  if (error) {
    return (
      <Card className={cn("border-red-200 bg-red-50", className)}>
        <CardHeader className="pb-3">
          <CardTitle className="text-red-800 flex items-center">
            <XCircle className="h-5 w-5 mr-2" />
            Contract Balance Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-700 text-sm mb-3">{error}</p>
          {showRefreshButton && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              {isRefreshing ? (
                <Loader className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Try Again
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center">
            Contract Balance
            {getStatusIcon()}
            {getStatusBadge()}
          </span>
          {showRefreshButton && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleRefresh}
              disabled={isLoading || isRefreshing}
            >
              {isLoading || isRefreshing ? (
                <Loader className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          )}
        </CardTitle>
        <CardDescription>
          Available funds for bonus payouts
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading && !balance ? (
          <div className="flex items-center justify-center py-8">
            <Loader className="h-6 w-6 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Loading balance...</span>
          </div>
        ) : balance ? (
          <div className="space-y-3">
            <div className="text-3xl font-bold text-primary">
              {balance.balanceFormatted} NEAR
            </div>
            
            <div className={cn(
              "text-sm",
              ContractUtils.getBalanceStatusColor(balance.status)
            )}>
              {ContractUtils.getBalanceStatusMessage(balance.status)}
            </div>
            
            <div className="text-xs text-muted-foreground">
              Last updated: {balance.lastUpdated.toLocaleTimeString()}
            </div>
            
            {balance.status === 'critical' && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-3">
                <div className="flex items-start">
                  <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 mr-2 flex-shrink-0" />
                  <div className="text-sm text-red-800">
                    <p className="font-medium">Low Balance Warning</p>
                    <p className="mt-1">
                      The contract balance is critically low. Users may not be able to withdraw bonuses until more funds are deposited.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {balance.status === 'low' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-3">
                <div className="flex items-start">
                  <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-medium">Balance Getting Low</p>
                    <p className="mt-1">
                      Consider depositing more funds to ensure bonus payouts remain available.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No balance data available
          </div>
        )}
      </CardContent>
    </Card>
  );
}
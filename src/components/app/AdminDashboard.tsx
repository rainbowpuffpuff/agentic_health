
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { UserCog, PiggyBank, Loader, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { utils } from 'near-api-js';
import type { StakerInfo } from '@/app/page';

type AdminDashboardProps = {
    rewardPoolBalance: string | null;
    stakerIdToApprove: string;
    setStakerIdToApprove: (value: string) => void;
    isCheckingAddress: boolean;
    infoForAddress: StakerInfo | null;
    handleApproveBonus: (stakerId: string) => void;
    depositAmount: string;
    setDepositAmount: (value: string) => void;
    handleDepositRewardFunds: () => void;
};

export default function AdminDashboard({
    rewardPoolBalance,
    stakerIdToApprove,
    setStakerIdToApprove,
    isCheckingAddress,
    infoForAddress,
    handleApproveBonus,
    depositAmount,
    setDepositAmount,
    handleDepositRewardFunds
}: AdminDashboardProps) {
    return (
        <Card className="lg:col-span-2 slide-in-from-bottom transition-all hover:shadow-primary/5">
            <CardHeader>
                <CardTitle className="font-headline text-2xl flex items-center gap-3"><UserCog className="text-primary" />Admin Dashboard</CardTitle>
                <CardDescription>Approve staking bonuses for users and monitor the reward pool.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="p-4 rounded-lg bg-secondary flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <PiggyBank className="text-primary" size={24} />
                        <div >
                            <p className="font-semibold">Reward Pool Balance</p>
                            <p className="text-sm text-muted-foreground">Funds available for bonuses.</p>
                        </div>
                    </div>
                    {rewardPoolBalance !== null ? (
                        <p className="font-bold text-xl text-primary">{utils.format.formatNearAmount(rewardPoolBalance, 4)} NEAR</p>
                    ) : (
                        <Loader className="animate-spin" size={20} />
                    )}
                </div>
                <div className="space-y-4">
                    <Label htmlFor="staker-id">Approve Bonus for Staker</Label>
                    <div className="flex items-start gap-2">
                        <div className="flex-grow space-y-2">
                            <Input
                                id="staker-id"
                                value={stakerIdToApprove}
                                onChange={(e) => setStakerIdToApprove(e.target.value)}
                                placeholder="e.g. user.near"
                            />
                            {isCheckingAddress && <p className="text-sm text-muted-foreground flex items-center gap-2"><Loader className="animate-spin" size={16} /> Checking...</p>}
                            {infoForAddress && (
                                <Alert>
                                    <AlertTitle className="flex items-center gap-2">
                                        {infoForAddress.bonus_approved ? <CheckCircle2 className="text-green-500" /> : <AlertTriangle className="text-yellow-500" />}
                                        Staker Information
                                    </AlertTitle>
                                    <AlertDescription>
                                        <p>Stake: {utils.format.formatNearAmount(infoForAddress.amount, 4)} NEAR</p>
                                        <p>Bonus Approved: {infoForAddress.bonus_approved ? 'Yes' : 'No'}</p>
                                    </AlertDescription>
                                </Alert>
                            )}
                            {!isCheckingAddress && stakerIdToApprove.length > 5 && !infoForAddress && (
                                <Alert variant="destructive">
                                    <AlertTriangle className="h-4 w-4" />
                                    <AlertTitle>Staker Not Found</AlertTitle>
                                    <AlertDescription>
                                        This account has no stake in this contract.
                                    </AlertDescription>
                                </Alert>
                            )}
                        </div>
                        <Button
                            onClick={() => handleApproveBonus(stakerIdToApprove)}
                            disabled={!infoForAddress || infoForAddress.bonus_approved}
                        >
                            Approve Bonus
                        </Button>
                    </div>
                </div>
                <div className="space-y-4 pt-4 border-t">
                    <Label htmlFor="deposit-amount">Deposit to Reward Pool</Label>
                    <div className="flex items-stretch gap-2">
                        <div className="flex-grow">
                            <Label htmlFor="deposit-amount" className="sr-only">Deposit Amount (NEAR)</Label>
                            <Input
                                id="deposit-amount"
                                type="number"
                                value={depositAmount}
                                onChange={(e) => setDepositAmount(e.target.value)}
                                placeholder="Amount in NEAR"
                                className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                        </div>
                        <Button onClick={handleDepositRewardFunds} disabled={!depositAmount || Number(depositAmount) <= 0}>
                            Deposit NEAR
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

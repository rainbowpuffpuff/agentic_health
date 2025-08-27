
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { HardDrive, Loader, AlertTriangle, Copy, FileUp } from 'lucide-react';
import type { SwarmKeys } from '@/app/page';

type SwarmStorageProps = {
    swarmState: 'idle' | 'generating_keys' | 'keys_generated' | 'funding' | 'buying_stamps' | 'ready_to_upload';
    setSwarmState: (state: any) => void;
    swarmKeys: SwarmKeys;
    setSwarmKeys: (keys: SwarmKeys) => void;
    credentialsSaved: boolean;
    setCredentialsSaved: (saved: boolean) => void;
    accountFunded: boolean;
    setAccountFunded: (funded: boolean) => void;
    stampsPurchased: boolean;
    setStampsPurchased: (purchased: boolean) => void;
    handleSetupSwarm: () => void;
    handleContinueFromKeys: () => void;
    handleFunded: () => void;
    handleBuyStamps: () => void;
    copyToClipboard: (text: string) => void;
};

export default function SwarmStorage({
    swarmState,
    swarmKeys,
    credentialsSaved,
    accountFunded,
    stampsPurchased,
    handleSetupSwarm,
    handleContinueFromKeys,
    handleFunded,
    handleBuyStamps,
    copyToClipboard,
}: SwarmStorageProps) {
    return (
        <Card className="lg:col-span-2 slide-in-from-bottom transition-all hover:shadow-primary/5" style={{ animationDelay: '500ms' }}>
            <CardHeader>
                <CardTitle className="font-headline text-2xl flex items-center gap-3"><HardDrive className="text-primary" /> Sovereign Storage on Swarm</CardTitle>
                <CardDescription>Securely store your encrypted fNIRS data on a decentralized network.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {swarmState === 'idle' && (
                    <>
                        <p className="text-sm text-muted-foreground">Set up your personal, decentralized storage to own and control your health data. This involves creating a new Swarm account.</p>
                        <Button onClick={handleSetupSwarm} className="w-full">
                            Setup Swarm Storage
                        </Button>
                    </>
                )}

                {swarmState === 'generating_keys' && (
                    <div className="flex items-center justify-center p-8 space-x-4">
                        <Loader className="h-8 w-8 animate-spin text-primary" />
                        <p>Generating your secure Swarm credentials...</p>
                    </div>
                )}

                {swarmState === 'keys_generated' && swarmKeys && (
                    <div className="space-y-4">
                        <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/50">
                            <div className="flex items-start">
                                <AlertTriangle className="h-5 w-5 mr-3 mt-1 text-destructive" />
                                <div>
                                    <h4 className="font-bold text-destructive">Save These Credentials!</h4>
                                    <p className="text-sm text-destructive-foreground/90">This is generated locally in your browser so it cannot be retrieved by anyone else.</p>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="ethAddress">Gnosis Chain Address</Label>
                            <div className="flex items-center gap-2">
                                <Input id="ethAddress" value={swarmKeys.ethereumAddress} readOnly />
                                <Button variant="ghost" size="icon" onClick={() => copyToClipboard(swarmKeys.ethereumAddress)}><Copy /></Button>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="publicKey">Swarm Public Key</Label>
                            <div className="flex items-center gap-2">
                                <Input id="publicKey" value={swarmKeys.publicKey} readOnly />
                                <Button variant="ghost" size="icon" onClick={() => copyToClipboard(swarmKeys.publicKey)}><Copy /></Button>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>                            <div className="flex items-center gap-2">
                                <Input id="password" value={swarmKeys.password} readOnly />
                                <Button variant="ghost" size="icon" onClick={() => copyToClipboard(swarmKeys.password)}><Copy /></Button>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2 pt-2">
                            <Checkbox id="terms" onCheckedChange={(checked) => setCredentialsSaved(checked as boolean)} />
                            <label
                                htmlFor="terms"
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                                I have saved my credentials in a secure place.
                            </label>
                        </div>
                        <Button onClick={handleContinueFromKeys} disabled={!credentialsSaved} className="w-full">Continue</Button>
                    </div>
                )}

                {swarmState === 'funding' && (
                    <div className="space-y-4 rounded-lg border p-4">
                        <h3 className="font-headline text-lg">1. Fund Your Account</h3>
                        <p className="text-sm text-muted-foreground">To use Swarm, your Gnosis Chain address needs funds. Send ~0.01 xDAI (for gas fees) and ~0.2 xBZZ (for storage) to your address shown in the previous step.</p>
                        <Button onClick={handleFunded} disabled={accountFunded} className="w-full">
                            {accountFunded ? 'Account Funded' : 'I Have Funded My Account'}
                        </Button>
                    </div>
                )}
                {(swarmState === 'buying_stamps' || swarmState === 'ready_to_upload') && (
                    <div className="space-y-4 rounded-lg border p-4">
                        <h3 className="font-headline text-lg">2. Buy Postage Stamps</h3>
                        <p className="text-sm text-muted-foreground">Postage stamps are required to upload data to Swarm. They cover the cost of storage for a specific duration.</p>
                        <Button onClick={handleBuyStamps} disabled={stampsPurchased || swarmState !== 'buying_stamps'} className="w-full">
                            {swarmState === 'ready_to_upload' ? 'Stamps Purchased!' : 'Purchase Postage Stamps'}
                        </Button>
                    </div>
                )}
                {swarmState === 'ready_to_upload' && (
                    <div className="space-y-4 rounded-lg border p-4 bg-primary/10">
                        <h3 className="font-headline text-lg flex items-center gap-3"><FileUp /> Ready to Upload</h3>
                        <p className="text-sm text-muted-foreground">Your Swarm storage is set up. You can now upload your encrypted fNIRS data sessions.</p>
                        <Button className="w-full">Upload fNIRS Data</Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

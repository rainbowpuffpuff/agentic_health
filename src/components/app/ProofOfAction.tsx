
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Mail, CheckCircle2, Upload, BrainCircuit, KeyRound, Sprout, FileQuestion } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Campaign, CampaignState, GardenFlower } from '@/app/page';
import { CAMPAIGN_DETAILS } from '@/app/page';

type ProofOfActionProps = {
    appState: string;
    progress: number;
    selectedCampaign: Campaign;
    setSelectedCampaign: (campaign: Campaign) => void;
    campaignStates: Record<Campaign, CampaignState>;
    isVerifyingAction: boolean;
    intentionPoints: number;
    gardenFlowers: GardenFlower[];
    handleSendEmail: (campaign: Campaign) => void;
    emailUploadRef: React.RefObject<HTMLInputElement>;
    handleUseBoilerplateEmail: (campaign: Campaign) => void;
};

const getStateDescription = (state: string) => {
    switch (state) {
      case 'generating_action_proof':
        return { icon: <KeyRound className="animate-spin text-primary" />, text: 'Generating ZK-Proof of Action...' };
      case 'planting_seed':
        return { icon: <Sprout className="sprout text-primary" />, text: 'Verifying on Civic Action Registry...' };
      default:
        return { icon: null, text: '' };
    }
  };
  
const ProgressDisplay = ({ state, inCard = true } : { state: string; inCard?: boolean }) => {
    const statesToShow = [
      'generating_action_proof', 'planting_seed'
    ];
    if (!statesToShow.includes(state)) {
      return null;
    }

    const { icon, text } = getStateDescription(state);

    const content = (
        <div className="space-y-3 fade-in">
            <div className="flex items-center gap-3 text-sm font-medium">
                {icon}
                <span>{text}</span>
            </div>
            <Progress value={0} className="w-full h-2" />
        </div>
    );
    
    if (inCard) {
      return <div className="mt-4 p-4 bg-secondary/50 rounded-lg">{content}</div>;
    }
    
    return content;
};

export default function ProofOfAction({
    appState,
    progress,
    selectedCampaign,
    setSelectedCampaign,
    campaignStates,
    isVerifyingAction,
    intentionPoints,
    gardenFlowers,
    handleSendEmail,
    emailUploadRef,
    handleUseBoilerplateEmail,
}: ProofOfActionProps) {
    return (
        <Card className="slide-in-from-bottom transition-all hover:shadow-primary/5">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="font-headline text-2xl">Civic Action</CardTitle>
                        <CardDescription>Generate proof of your civic engagement.</CardDescription>
                    </div>
                    <div className="flex gap-2">
                        {gardenFlowers.map((flower, i) => {
                            const { Icon, unlocked } = flower;
                            return (
                                <Icon
                                    key={i}
                                    className={cn(
                                        "h-8 w-8 transition-all duration-500",
                                        unlocked ? "text-primary sprout" : "text-gray-300 opacity-50",
                                    )}
                                    style={{ animationDelay: `${i * 50}ms` }}
                                />
                            )
                        })}
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-4 rounded-lg border p-4 hover:border-primary/20 transition-colors">
                    <div className="flex items-center gap-3">
                        <Mail className="h-6 w-6 text-primary" />
                        <h3 className="font-headline text-lg">Proof of Action</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">Select a campaign and send a signed email to prove you've taken action. Costs 10 Intention Points.</p>
                    <RadioGroup value={selectedCampaign} onValueChange={(value) => setSelectedCampaign(value as Campaign)} className="space-y-2">
                        {Object.keys(CAMPAIGN_DETAILS).map((campaignKey) => {
                            const campaign = campaignKey as Campaign;
                            const details = CAMPAIGN_DETAILS[campaign];
                            const campaignState = campaignStates[campaign];

                            return (
                                <Label key={campaign} htmlFor={campaign} className={cn("flex flex-col gap-2 rounded-md border p-3 cursor-pointer transition-colors", { 'border-primary ring-2 ring-primary': selectedCampaign === campaign, 'opacity-50 cursor-not-allowed': campaignState === 'verified' })}>
                                    <div className="flex items-start gap-3">
                                        <RadioGroupItem value={campaign} id={campaign} className="mt-1" disabled={campaignState === 'verified'} />
                                        <div className="flex-grow space-y-1">
                                            <p className="font-medium">{details.title}</p>
                                            <p className="text-sm text-muted-foreground">{details.description}</p>
                                        </div>
                                    </div>
                                    {selectedCampaign === campaign && campaignState !== 'verified' && (
                                        <div className="pt-2 pl-7 space-y-2">
                                            {campaignState === 'idle' && (
                                                <Button onClick={() => handleSendEmail(campaign)} disabled={isVerifyingAction || intentionPoints < 10} className="w-full" size="sm">
                                                    <Mail className="mr-2" />
                                                    {intentionPoints < 10 ? 'Need 10 Points' : 'Send Email for 10 Points'}
                                                </Button>
                                            )}
                                            {campaignState === 'email_pending' && (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                    <Button onClick={() => emailUploadRef.current?.click()} disabled={isVerifyingAction} className="w-full" size="sm" variant="outline">
                                                        <Upload className="mr-2" />
                                                        Upload Email
                                                    </Button>
                                                    <Button onClick={() => handleUseBoilerplateEmail(campaign)} disabled={isVerifyingAction} className="w-full" size="sm" variant="secondary">
                                                        <FileQuestion className="mr-2" />
                                                        Use Sample
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    {campaignState === 'verified' && (
                                        <div className="pt-2 pl-7">
                                            <Alert variant="default" className="border-green-500 text-green-700">
                                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                                                <AlertTitle>Action Verified!</AlertTitle>
                                                <AlertDescription>
                                                    You have successfully completed this action.
                                                </AlertDescription>
                                            </Alert>
                                        </div>
                                    )}
                                </Label>
                            )
                        })}
                    </RadioGroup>
                    {isVerifyingAction && <ProgressDisplay state={appState} />}
                </div>
            </CardContent>
        </Card>
    );
}

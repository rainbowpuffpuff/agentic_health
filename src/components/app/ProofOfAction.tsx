
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Mail, CheckCircle2, Upload, KeyRound, Sprout, FileQuestion, ExternalLink, TestTube } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { GardenFlower } from '@/app/page';
import { CAMPAIGN_DETAILS, type Campaign, type CampaignState } from '@/lib/constants';
import { useZKEmail, useEmailUpload } from '@/hooks/use-zk-email';
import { generateSampleEmailForCampaign } from '@/lib/zk-email';
import { ZK_EMAIL_DEV_CONFIG } from '@/lib/zk-email-config';

type ProofOfActionProps = {
    appState: string;
    progress: number;
    selectedCampaign: Campaign;
    setSelectedCampaign: (campaign: Campaign) => void;
    campaignStates: Record<Campaign, CampaignState>;
    isVerifyingAction: boolean;
    intentionPoints: number;
    gardenFlowers: GardenFlower[];
    handleEngageCampaign: (campaign: Campaign) => void;
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

const ProgressDisplay = ({ state }: { state: string, inCard?: boolean }) => {
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

    return <div className="mt-4 p-4 bg-secondary/50 rounded-lg">{content}</div>;
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
    handleEngageCampaign,
    handleSendEmail,
    emailUploadRef,
    handleUseBoilerplateEmail,
}: ProofOfActionProps) {
    // ZK-Email SDK integration
    const zkEmail = useZKEmail();
    const emailUpload = useEmailUpload();

    // Handle email file upload and proof generation
    const handleEmailUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            await emailUpload.handleFileUpload(file);
            
            if (emailUpload.emlContent) {
                // Generate ZK proof from uploaded email
                const proof = await zkEmail.generateProof(emailUpload.emlContent, selectedCampaign);
                
                if (proof) {
                    console.log('Generated civic engagement proof:', proof);
                    // TODO: Submit proof for verification and reward distribution
                }
            }
        } catch (error) {
            console.error('Email upload failed:', error);
        }
    };

    // Handle default email loading for testing (similar to sleep verification)
    const handleUseDefaultEmail = async (campaign: Campaign) => {
        try {
            console.log('🧪 Loading default email for testing...');
            
            // Load the sample-email-DKIM.eml file from public directory
            const response = await fetch('/sample-email-DKIM.eml');
            if (!response.ok) {
                throw new Error(`Failed to load sample email: ${response.status} ${response.statusText}`);
            }
            
            const emlContent = await response.text();
            console.log('✅ Sample email loaded successfully');
            console.log('📧 Email preview:', emlContent.substring(0, 200) + '...');
            
            // Generate ZK proof from default email
            console.log('🔐 Generating ZK proof for campaign:', campaign);
            const proof = await zkEmail.generateProof(emlContent, campaign);
            
            if (proof) {
                console.log('✅ Generated proof from default email:', proof);
                console.log('🎉 Default email verification successful for campaign:', campaign);
                
                // Show success message to user
                // TODO: Integrate with toast system and state management
                alert(`✅ Default email verification successful!\n\nCampaign: ${campaign}\nProof generated successfully.\n\nThis is a test using the sample email from /public/sample-email-DKIM.eml`);
            } else {
                throw new Error('Proof generation returned null');
            }
        } catch (error) {
            console.error('❌ Default email proof generation failed:', error);
            
            // Show error message to user
            alert(`❌ Default email test failed:\n\n${error instanceof Error ? error.message : 'Unknown error'}\n\nCheck the browser console for more details.`);
        }
    };

    // Keep the original function for backward compatibility
    const handleUseSampleEmail = handleUseDefaultEmail;
    return (
        <Card className="slide-in-from-bottom transition-all hover:shadow-primary/5">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="font-headline text-2xl flex items-center gap-3">
                            <Mail className="h-6 w-6" />
                            Proof of Action
                        </CardTitle>
                        <CardDescription>Generate proof of your civic engagement by sending a signed email. Costs 10 Intention Points.</CardDescription>
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
                     <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="item-1" className='border-0'>
                            <Alert>
                                <AccordionTrigger className="flex w-full items-center justify-between text-sm font-medium hover:no-underline [&_svg]:h-4 [&_svg]:w-4 p-0">
                                    <div className='flex items-center gap-2'>
                                        <FileQuestion className="h-4 w-4" />
                                        <AlertTitle className="mb-0">How does this work?</AlertTitle>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className='pt-2'>
                                    <AlertDescription>
                                        We use a Zero-Knowledge Proof (ZK-Proof) to verify the DKIM signature in your email. This proves you sent the email without revealing its content.
                                        <div className="flex flex-col gap-1 mt-2">
                                            <a href="https://docs.zk.email/architecture/dkim-verification" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium flex items-center gap-1">
                                                Learn about ZK-Email <ExternalLink size={14}/>
                                            </a>
                                            <a href={`https://registry.zk.email/${ZK_EMAIL_DEV_CONFIG.BLUEPRINT_ID}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium flex items-center gap-1">
                                                View Parliament Blueprint <ExternalLink size={14}/>
                                            </a>
                                        </div>
                                    </AlertDescription>
                                </AccordionContent>
                            </Alert>
                        </AccordionItem>
                    </Accordion>
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
                                            <p className="font-semibold text-card-foreground">{details.title}</p>
                                            <p className="text-sm text-muted-foreground">{details.description}</p>
                                        </div>
                                    </div>
                                    {selectedCampaign === campaign && campaignState !== 'verified' && (
                                        <div className="pt-2 pl-7 space-y-2">
                                            {campaignState === 'idle' && (
                                                <Button onClick={() => handleEngageCampaign(campaign)} disabled={isVerifyingAction || intentionPoints < 10} className="w-full" size="sm">
                                                    {intentionPoints < 10 ? 'Need 10 Points' : 'Take Action for 10 Points'}
                                                </Button>
                                            )}
                                            {campaignState === 'taking_action' && (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                    <Button onClick={() => emailUploadRef.current?.click()} disabled={isVerifyingAction || zkEmail.isGeneratingProof} className="w-full" size="sm" variant="outline">
                                                        <Upload className="mr-2" />
                                                        Upload Your Email (.eml)
                                                    </Button>
                                                    <Button onClick={() => handleUseDefaultEmail(campaign)} disabled={isVerifyingAction || zkEmail.isGeneratingProof} className="w-full" size="sm" variant="secondary">
                                                        <TestTube className="mr-2" />
                                                        Use Default Email (Testing)
                                                    </Button>
                                                </div>
                                            )}
                                            {campaignState === 'email_pending' && (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                     <Button onClick={() => emailUploadRef.current?.click()} disabled={isVerifyingAction || zkEmail.isGeneratingProof} className="w-full" size="sm" variant="outline">
                                                        <Upload className="mr-2" />
                                                        Upload Your Email (.eml)
                                                    </Button>
                                                    <Button onClick={() => handleUseDefaultEmail(campaign)} disabled={isVerifyingAction || zkEmail.isGeneratingProof} className="w-full" size="sm" variant="secondary">
                                                        <TestTube className="mr-2" />
                                                        Use Default Email (Testing)
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
                    
                    {/* ZK-Email SDK Status */}
                    {zkEmail.error && (
                        <Alert variant="destructive">
                            <AlertTitle>ZK-Email Error</AlertTitle>
                            <AlertDescription>{zkEmail.error}</AlertDescription>
                        </Alert>
                    )}
                    
                    {zkEmail.isInitializing && (
                        <Alert>
                            <KeyRound className="h-4 w-4 animate-spin" />
                            <AlertTitle>Initializing ZK-Email SDK</AlertTitle>
                            <AlertDescription>Setting up zero-knowledge proof generation...</AlertDescription>
                        </Alert>
                    )}
                    
                    {zkEmail.isGeneratingProof && (
                        <Alert>
                            <KeyRound className="h-4 w-4 animate-spin" />
                            <AlertTitle>Generating ZK Proof</AlertTitle>
                            <AlertDescription>Creating privacy-preserving proof of your civic engagement...</AlertDescription>
                        </Alert>
                    )}
                    
                    {/* Hidden file input for email upload */}
                    <input
                        ref={emailUploadRef}
                        type="file"
                        accept=".eml"
                        onChange={handleEmailUpload}
                        style={{ display: 'none' }}
                    />
                </div>
            </CardContent>
        </Card>
    );
}

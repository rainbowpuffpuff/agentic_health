'use client';

import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Bed, PiggyBank, Clock, CheckCircle2, BrainCircuit, KeyRound, Zap, Camera, Upload, ShieldCheck, ImageIcon, AlertTriangle, Loader, FileQuestion, Smartphone } from 'lucide-react';
import { cn } from '@/lib/utils';
import { utils } from 'near-api-js';
import type { StakerInfo, GardenFlower } from '@/app/page';

// MODIFICATION 1 of 3: Add the 'handleWithdraw' prop to the component's interface.
type ProofOfRestProps = {
    appState: string;
    progress: number;
    rewardPoolBalance?: string | null;
    stakerInfo?: StakerInfo | null;
    walletConnected?: boolean;
    isVerifyingSleep: boolean;
    stakeAmount?: string;
    setStakeAmount?: (value: string) => void;
    handleStake?: () => void;
    handleWithdraw?: () => void; // This was missing.
    handleBeginSleepVerification: () => void;
    uploadedImage?: { url: string, date: string } | null;
    videoRef?: React.RefObject<HTMLVideoElement>;
    canvasRef?: React.RefObject<HTMLCanvasElement>;
    fileInputRef?: React.RefObject<HTMLInputElement>;
    hasCameraPermission?: boolean | null;
    isMobile: boolean | null;
    handleUseDefaultPhoto?: () => void;
    takePhoto?: () => string | null;
    handleFileUpload?: (event: React.ChangeEvent<HTMLInputElement>) => void;
    handleConfirmPhoto?: () => void;
    setAppState?: (state: string) => void;
    setUploadedImage?: (image: { url: string, date: string } | null) => void;
    sleepFlowers: GardenFlower[];
};


const getStateDescription = (state: string) => {
    switch (state) {
        case 'analyzing_photo':
            return { icon: <BrainCircuit className="animate-pulse text-primary" />, text: 'Analyzing photo for sleeping surface...' };
        case 'sleeping':
            return { icon: <Bed className="animate-pulse text-primary" />, text: 'Capturing sleep sensor data...' };
        case 'generating_sleep_proof':
            return { icon: <KeyRound className="animate-spin text-primary" />, text: 'Generating ZK-Proof of Rest...' };
        case 'minting_dew':
            return { icon: <Zap className="futuristic-glow text-primary" />, text: 'Approving bonus on-chain...' };
        default:
            return { icon: null, text: '' };
    }
};

const ProgressDisplay = ({ state, inCard = true }: { state: string; inCard?: boolean }) => {
    const statesToShow = [
        'analyzing_photo', 'sleeping', 'generating_sleep_proof', 'minting_dew'
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
            <Progress value={state === 'sleeping' ? undefined : 0} className="w-full h-2" />
        </div>
    );

    if (inCard) {
        return <div className="mt-4 p-4 bg-secondary/50 rounded-lg">{content}</div>;
    }

    return content
};


export default function ProofOfRest({
    appState,
    progress,
    rewardPoolBalance,
    stakerInfo,
    walletConnected,
    isVerifyingSleep,
    stakeAmount,
    setStakeAmount,
    handleStake,
    handleWithdraw, // Destructure the new prop
    handleBeginSleepVerification,
    uploadedImage,
    videoRef,
    canvasRef,
    fileInputRef,
    hasCameraPermission,
    isMobile,
    handleUseDefaultPhoto,
    takePhoto,
    handleFileUpload,
    handleConfirmPhoto,
    setAppState,
    setUploadedImage,
    sleepFlowers,
}: ProofOfRestProps) {

    // This part for taking a photo is unchanged and correct.
    if (appState === 'taking_photo') {
        return (
            <Card className="slide-in-from-bottom transition-all hover:shadow-primary/5">
                <CardHeader>
                    <CardTitle className="font-headline text-2xl">Provide Evidence of Rest</CardTitle>
                    <CardDescription>Take a photo of your bed or upload one from your gallery.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="w-full aspect-video bg-secondary rounded-md overflow-hidden flex items-center justify-center relative">
                        {uploadedImage ? (
                            <Image src={uploadedImage.url} alt="Uploaded bed photo" layout="fill" objectFit="cover" />
                        ) : (
                            <>
                                <video ref={videoRef} className={cn("h-full w-full object-cover", { 'hidden': hasCameraPermission !== true })} autoPlay muted playsInline />
                                {hasCameraPermission === false &&
                                    <Alert variant="default" className='m-4'>
                                        <AlertTriangle className="h-4 w-4" />
                                        <AlertTitle>Camera Unavailable</AlertTitle>
                                        <AlertDescription>No problem. Please upload a photo from your gallery or use the default image.</AlertDescription>
                                    </Alert>
                                }
                                {hasCameraPermission === null && !videoRef?.current?.srcObject && <Loader className="h-8 w-8 animate-spin text-primary" />}
                            </>
                        )}
                    </div>
                    {uploadedImage && ( <Alert variant="default"><AlertTriangle className="h-4 w-4" /><AlertTitle>Image Selected</AlertTitle><AlertDescription>{uploadedImage.date}</AlertDescription></Alert> )}
                    <canvas ref={canvasRef} className="hidden" />
                    <Input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                    {isVerifyingSleep && <ProgressDisplay state={appState} inCard={false} />}
                </CardContent>
                <CardFooter className="flex flex-col sm:flex-row gap-2">
                    <Button variant="outline" onClick={handleUseDefaultPhoto} className="w-full"><ImageIcon className="mr-2 h-4 w-4" />Use Default</Button>
                    <Button variant="outline" onClick={takePhoto} disabled={!hasCameraPermission} className="w-full"><Camera className="mr-2 h-4 w-4" />Take Photo</Button>
                    <Button variant="outline" onClick={() => fileInputRef?.current?.click()} className="w-full"><Upload className="mr-2 h-4 w-4" />Upload</Button>
                    <div className='flex-grow' />
                    <Button onClick={handleConfirmPhoto} disabled={!uploadedImage || isVerifyingSleep} className="w-full sm:w-auto"><ShieldCheck className="mr-2 h-4 w-4" />Confirm</Button>
                    <Button variant="ghost" onClick={() => { setAppState?.('idle'); setUploadedImage?.(null); }} className="w-full sm:w-auto">Cancel</Button>
                </CardFooter>
            </Card>
        )
    }

    // This is the main view of the component.
    return (
        <Card className="slide-in-from-bottom transition-all hover:shadow-primary/5">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="font-headline text-2xl flex items-center gap-3"><Bed className="h-6 w-6" />Proof of Rest</CardTitle>
                        <CardDescription>Commit NEAR to verify your sleep. After verification, your commitment is returned with a bonus.</CardDescription>
                    </div>
                     <div className="flex gap-2">
                        {sleepFlowers.map((flower, i) => {
                            const { Icon, unlocked } = flower;
                            return ( <Icon key={i} className={cn("h-8 w-8 transition-all duration-500", unlocked ? "text-primary sprout" : "text-gray-300 opacity-50")} style={{ animationDelay: `${i * 50}ms` }} /> )
                        })}
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-4 rounded-lg border p-4 hover:border-primary/20 transition-colors">
                    <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="item-1" className='border-0'>
                            <Alert>
                                <div className='flex items-center gap-2'>
                                     <AccordionTrigger className="flex w-full items-center justify-between text-sm font-medium hover:no-underline [&_svg]:h-4 [&_svg]:w-4 p-0">
                                        <div className='flex items-center gap-2'><FileQuestion className="h-4 w-4" /><AlertTitle className="mb-0">How does this work?</AlertTitle></div>
                                    </AccordionTrigger>
                                </div>
                                <AccordionContent className='pt-2'>
                                    <AlertDescription>
                                        We use a photo of your bed and phone sensors to prove you rested. An agent then calls the contract to approve your bonus for withdrawal.
                                        {isMobile && <span className='flex items-center gap-1 mt-1'><Smartphone size={14}/> Your motion sensor is active.</span>}
                                    </AlertDescription>
                                </AccordionContent>
                            </Alert>
                        </AccordionItem>
                    </Accordion>
                    
                    {rewardPoolBalance !== null && (
                        <div className="text-xs text-muted-foreground flex items-center gap-2"><PiggyBank size={14} /><span>Available Rewards: {utils.format.formatNearAmount(rewardPoolBalance, 4)} NEAR</span></div>
                    )}

                    {/* MODIFICATION 2 of 3: The UI for a staked user is completely rewritten for clarity and correctness. */}
                    {stakerInfo && walletConnected ? (
                        <div className='p-4 bg-secondary rounded-md space-y-3'>
                            <div>
                                <p className='text-sm font-semibold'>You have <span className="font-bold text-primary">{utils.format.formatNearAmount(stakerInfo.amount, 4)} NEAR</span> committed.</p>
                                <p className="text-xs text-muted-foreground mt-1">Complete sleep verification to enable withdrawal.</p>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <span>Bonus Status:</span>
                                {stakerInfo.bonus_approved ? (
                                    <span className='font-medium text-green-600 flex items-center gap-1'><CheckCircle2 size={16} /> Approved</span>
                                ) : (
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <span className='font-medium text-muted-foreground flex items-center gap-1 cursor-help'><Clock size={16} /> Pending</span>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Complete sleep verification to approve the bonus.</p>
                                        </TooltipContent>
                                    </Tooltip>
                                )}
                            </div>
                            <div className="flex flex-col sm:flex-row gap-2">
                                <Button onClick={handleBeginSleepVerification} disabled={isVerifyingSleep || stakerInfo.bonus_approved} className="w-full">
                                    Verify Sleep
                                </Button>
                                {/* MODIFICATION 3 of 3: The "Withdraw" button's disabled logic is now correct. */}
                                <Button onClick={handleWithdraw} disabled={isVerifyingSleep || !stakerInfo.bonus_approved} className="w-full" variant="outline">
                                    Withdraw
                                </Button>
                            </div>
                            {isVerifyingSleep && <ProgressDisplay state={appState} />}
                        </div>
                    ) : (
                        <div className="flex flex-col sm:flex-row items-stretch gap-2">
                            <div className="flex-grow">
                                <Label htmlFor="stake-amount" className="sr-only">Commitment (NEAR)</Label>
                                <Input id="stake-amount" type="number" value={stakeAmount} onChange={(e) => setStakeAmount?.(e.target.value)} placeholder="Commitment (NEAR)" className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                            </div>
                            <Button onClick={handleStake} disabled={isVerifyingSleep || !walletConnected || !stakeAmount || Number(stakeAmount) <= 0} className="w-full sm:w-auto">
                                Commit & Begin
                            </Button>
                        </div>
                    )}
                    {isVerifyingSleep && !stakerInfo && <ProgressDisplay state={appState} />}
                </div>
            </CardContent>
        </Card>
    );
}
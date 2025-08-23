
'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Wallet, Bed, Mail, Zap, Loader, KeyRound, Sprout, Network, ShoppingCart, BrainCircuit, HardDrive, FileUp, AlertTriangle, Copy, ShieldCheck, UploadCloud, Video, Upload, Camera } from 'lucide-react';
import DewDropIcon from '@/components/icons/DewDropIcon';
import FlowerIcon from '@/components/icons/FlowerIcon';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { detectSleepingSurface } from '@/ai/flows/detect-sleeping-surface-flow';

type JournalEntry = {
  id: number;
  date: string;
  sleep: string;
  imageUrl: string;
};

type SwarmKeys = {
  ethereumAddress: string;
  publicKey: string;
  password: string;
} | null;

export default function Home() {
  const [walletConnected, setWalletConnected] = useState(false);
  const [dreamDew, setDreamDew] = useState(200); // Start with enough dew to test
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [gardenFlowers, setGardenFlowers] = useState(0);
  const [hasFnirsDevice, setHasFnirsDevice] = useState(false);
  const [hasAbbottDevice, setHasAbbottDevice] = useState(false);


  const [isLoading, setIsLoading] = useState(true);
  const [appState, setAppState] = useState<'idle' | 'sleeping' | 'generating_sleep_proof' | 'minting_dew' | 'taking_action' | 'generating_action_proof' | 'planting_seed' | 'taking_photo' | 'analyzing_photo'>('idle');
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  // Staking state
  const [isStaked, setIsStaked] = useState(false);
  const [stakeAmount, setStakeAmount] = useState(50);

  // Swarm State
  const [swarmState, setSwarmState] = useState<'idle' | 'generating_keys' | 'keys_generated' | 'funding' | 'buying_stamps' | 'ready_to_upload'>('idle');
  const [swarmKeys, setSwarmKeys] = useState<SwarmKeys>(null);
  const [credentialsSaved, setCredentialsSaved] = useState(false);
  const [accountFunded, setAccountFunded] = useState(false);
  const [stampsPurchased, setStampsPurchased] = useState(false);
  
  // Camera State
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedImage, setUploadedImage] = useState<{url: string, date: string} | null>(null);

  useEffect(() => {
    // Simulate initial loading
    setTimeout(() => setIsLoading(false), 1000);
  }, []);

  const handleConnectWallet = () => {
    setIsLoading(true);
    setTimeout(() => {
      setWalletConnected(true);
      setIsLoading(false);
    }, 1500);
  };
  
  const runProgress = async (duration: number, onComplete?: () => void) => {
    let startTime: number | null = null;
    const animate = (time: number) => {
      if (!startTime) startTime = time;
      const elapsedTime = time - startTime;
      const newProgress = Math.min((elapsedTime / duration) * 100, 100);
      setProgress(newProgress);
      if (elapsedTime < duration) {
        requestAnimationFrame(animate);
      } else {
        setProgress(100);
        if(onComplete) onComplete();
      }
    };
    requestAnimationFrame(animate);
    await new Promise(resolve => setTimeout(resolve, duration));
  };

  const handleStake = () => {
    if (dreamDew >= stakeAmount) {
      setDreamDew(prev => prev - stakeAmount);
      setIsStaked(true);
      toast({
          title: "Stake Successful",
          description: `You have staked ${stakeAmount} Dream Dew.`,
        });
    } else {
        toast({
            variant: "destructive",
            title: "Insufficient Funds",
            description: "You don't have enough Dream Dew to stake.",
        });
    }
  };

  const handleBeginSleepRitual = () => {
    setUploadedImage(null);
    setAppState('taking_photo');
  };

  const getCameraPermission = async () => {
      if(hasCameraPermission === true) return true;
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setHasCameraPermission(true);
        return true;
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        return false;
      }
    };

  useEffect(() => {
    if(appState === 'taking_photo' && !uploadedImage) {
        getCameraPermission();
    }
  }, [appState, uploadedImage]);
  
  
  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        const imageUrl = canvas.toDataURL('image/png');
        const timestamp = `Timestamp: ${new Date().toLocaleString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            hour12: true
        })}`;
        
        // Stop camera stream
        const stream = video.srcObject as MediaStream;
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }
        video.srcObject = null;
        setHasCameraPermission(null);

        setUploadedImage({url: imageUrl, date: timestamp});

        return imageUrl;
      }
    }
    return null;
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string;
        const lastModifiedDate = new Date(file.lastModified);
        const formattedDate = lastModifiedDate.toLocaleString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            hour12: true
        });
        setUploadedImage({ url: imageUrl, date: `Timestamp: ${formattedDate}`});
        
        // Stop camera if it's on
        if(videoRef.current?.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
            setHasCameraPermission(null);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleConfirmPhoto = async () => {
    let photoUrl = uploadedImage?.url;
    if (!photoUrl) {
      photoUrl = takePhoto();
    }
    if (!photoUrl) {
        toast({
            variant: "destructive",
            title: "Photo Error",
            description: "Could not capture a photo. Please try again.",
        });
        return;
    }

    setAppState('analyzing_photo');
    setProgress(0);
    await runProgress(1000);

    try {
        const result = await detectSleepingSurface({ photoDataUri: photoUrl });
        await runProgress(1000);

        if (result.isSleepingSurface) {
            setAppState('sleeping');
            await runProgress(3000);

            setAppState('generating_sleep_proof');
            await runProgress(2500);
            
            setAppState('minting_dew');
            await runProgress(2000);

            const newDew = Math.floor(Math.random() * 5) + 5;
            setDreamDew(prev => prev + newDew);
            
            const newEntry: JournalEntry = {
              id: Date.now(),
              date: uploadedImage?.date || new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' }),
              sleep: `${(newDew - 0.5).toFixed(1)} hours verified`,
              imageUrl: photoUrl,
            };
            setJournalEntries(prev => [newEntry, ...prev]);

            setAppState('idle');
            setUploadedImage(null);
            setProgress(0);

        } else {
            toast({
                variant: "destructive",
                title: "Verification Failed",
                description: result.reason,
                duration: 5000,
            });
            setAppState('taking_photo');
            setUploadedImage(null); // Allow user to try again
            setProgress(0);
        }
    } catch (error) {
        console.error("Error analyzing photo:", error);
        toast({
            variant: "destructive",
            title: "Analysis Error",
            description: "Could not analyze the photo. Please try again.",
        });
        setAppState('taking_photo');
        setUploadedImage(null);
        setProgress(0);
    }
  };


  const handleCivicAction = async () => {
    setAppState('taking_action');
    await runProgress(2000);
    
    setAppState('generating_action_proof');
    await runProgress(3000);
    
    setAppState('planting_seed');
    await runProgress(1500, () => {
        setGardenFlowers(prev => prev + 1);
        setDreamDew(prev => Math.max(0, prev - 10));
    });

    setAppState('idle');
    setProgress(0);
  };

  const handleAcquireDevice = (cost: number, setHasDevice: (has: boolean) => void) => {
    if (dreamDew >= cost) {
      setDreamDew(prev => prev - cost);
      setHasDevice(true);
    }
  };

  const handleSetupSwarm = () => {
    setSwarmState('generating_keys');
    setTimeout(() => {
      setSwarmKeys({
        ethereumAddress: '0x' + [...Array(40)].map(() => Math.floor(Math.random() * 16).toString(16)).join(''),
        publicKey: '0x' + [...Array(64)].map(() => Math.floor(Math.random() * 16).toString(16)).join(''),
        password: 'secure-password-' + Math.random().toString(36).substring(2, 10),
      });
      setSwarmState('keys_generated');
    }, 2000);
  };

  const handleContinueFromKeys = () => {
    if (credentialsSaved) {
      setSwarmKeys(null); // Clear keys from state
      setSwarmState('funding');
    }
  };

  const handleFunded = () => {
    setAccountFunded(true);
    setSwarmState('buying_stamps');
  };

  const handleBuyStamps = () => {
    // Simulate buying stamps
    setTimeout(() => {
      setStampsPurchased(true);
      setSwarmState('ready_to_upload');
    }, 2000);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied to clipboard!' });
  }
  
  const getStateDescription = () => {
    switch (appState) {
      case 'taking_photo':
        return { icon: <Camera className="text-primary" />, text: 'Take a timestamped photo of your bed...' };
      case 'analyzing_photo':
        return { icon: <BrainCircuit className="animate-pulse text-primary" />, text: 'Analyzing photo for sleeping surface...' };
      case 'sleeping':
        return { icon: <Bed className="animate-pulse text-primary" />, text: 'Capturing sleep sensor data...' };
      case 'generating_sleep_proof':
        return { icon: <KeyRound className="animate-spin text-primary" />, text: 'Generating ZK-Proof of Rest...' };
      case 'minting_dew':
        return { icon: <Zap className="futuristic-glow text-primary" />, text: 'Minting Dream Dew on NEAR...' };
      case 'taking_action':
        return { icon: <Mail className="text-primary" />, text: 'Sending secure email...' };
      case 'generating_action_proof':
        return { icon: <KeyRound className="animate-spin text-primary" />, text: 'Generating ZK-Proof of Action...' };
      case 'planting_seed':
        return { icon: <Sprout className="sprout text-primary" />, text: 'Verifying on Civic Action Registry...' };
      default:
        return { icon: null, text: '' };
    }
  };

  if (isLoading && !walletConnected) {
    return <div className="flex h-screen w-full items-center justify-center bg-background"><Loader className="h-12 w-12 animate-spin text-primary" /></div>;
  }

  if (!walletConnected) {
    return (
      <main className="flex min-h-screen w-full items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md fade-in shadow-2xl shadow-primary/10 border-primary/20 bg-card">
          <CardHeader>
            <CardTitle className="font-headline text-3xl text-center">think2earn: Sovereign Edition</CardTitle>
            <CardDescription className="text-center pt-2 text-muted-foreground">
              Verifiable Rest, Provable Action.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center space-y-4">
            <div className="flex items-center space-x-4 p-4 rounded-lg bg-secondary">
                <Network className="h-8 w-8 text-primary" />
                <p>An on-chain identity requires a NEAR wallet.</p>
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full futuristic-glow" onClick={handleConnectWallet} disabled={isLoading}>
              <Wallet className="mr-2 h-4 w-4" />
              {isLoading ? 'Connecting...' : 'Connect NEAR Wallet'}
            </Button>
          </CardFooter>
        </Card>
      </main>
    );
  }

  return (
    <div className="min-h-screen w-full bg-background text-foreground fade-in">
      <header className="sticky top-0 z-10 border-b border-border/50 bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <h1 className="font-headline text-2xl text-primary">think2earn</h1>
          <div className="flex items-center gap-4 rounded-full border border-border/50 bg-card px-4 py-2 text-sm shadow-sm">
            <div className="flex items-center gap-2">
              <DewDropIcon className="h-5 w-5 text-accent" />
              <span className="font-bold text-lg">{dreamDew}</span>
              <span className="text-muted-foreground">Dream Dew</span>
            </div>
            <div className="h-6 w-px bg-border" />
            <div className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-primary" />
              <span className="font-mono text-muted-foreground">think2earn.near</span>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
          
          <Card className="lg:col-span-2 slide-in-from-bottom transition-all hover:shadow-primary/5">
            <CardHeader>
              <CardTitle className="font-headline text-2xl">My Action Garden</CardTitle>
              <CardDescription>A testament to your verified positive actions.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-4 p-4 rounded-lg min-h-[200px] bg-secondary/30 border border-border/50">
                {Array.from({ length: gardenFlowers }).map((_, i) => (
                  <FlowerIcon key={i} className="h-10 w-10 sprout text-primary" style={{ animationDelay: `${i * 50}ms` }}/>
                ))}
                 {gardenFlowers === 0 && <p className="col-span-full text-center text-muted-foreground self-center">Your garden awaits. Plant a seed by taking civic action.</p>}
              </div>
            </CardContent>
          </Card>
          
          <Card className="lg:row-span-3 slide-in-from-bottom transition-all hover:shadow-primary/5" style={{animationDelay: '300ms'}}>
             <CardHeader className="flex flex-row items-start justify-between">
                <div className='flex-grow'>
                    <CardTitle className="font-headline text-2xl">Sleep Log</CardTitle>
                    <CardDescription>Your private, encrypted memories of rest.</CardDescription>
                </div>
                <Button variant="outline" size="sm">
                    <UploadCloud className="mr-2 h-4 w-4" />
                    Import Whoop CSV
                </Button>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[720px] pr-4">
                <div className="space-y-4">
                  {journalEntries.map(entry => (
                    <div key={entry.id} className="flex items-center gap-4 rounded-lg border p-3 bg-card hover:bg-secondary/50 transition-colors" data-ai-hint="bed bedroom">
                      <Image src={entry.imageUrl} alt="A photo of a bed" width={80} height={60} className="rounded-md object-cover aspect-[4/3]" data-ai-hint="night sleep" />
                      <div className="flex-grow">
                        <p className="font-semibold">{entry.date}</p>
                        <p className="text-sm text-primary">{entry.sleep}</p>
                      </div>
                    </div>
                  ))}
                  {journalEntries.length === 0 && <p className="text-center text-muted-foreground pt-16">Complete a Sleep Ritual to start your log.</p>}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {!isStaked && appState === 'idle' && (
            <Card className="lg:col-span-2 slide-in-from-bottom transition-all hover:shadow-primary/5" style={{animationDelay: '200ms'}}>
              <CardHeader>
                <CardTitle className="font-headline text-2xl flex items-center gap-3">
                  <ShieldCheck className="text-primary"/> Secure Your Stake
                </CardTitle>
                <CardDescription>Commit funds to a NEAR contract to participate in sleep rituals.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                 <p className="text-sm text-muted-foreground">To ensure commitment and data integrity, a stake of {stakeAmount} Dream Dew is required before you can begin verifying your sleep. This stake is refundable.</p>
                 <div className="flex items-center space-x-2">
                    <Label htmlFor="stake-amount">Stake Amount</Label>
                    <Input id="stake-amount" type="number" value={stakeAmount} onChange={(e) => setStakeAmount(Number(e.target.value))} className="w-24 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                    <DewDropIcon className="h-5 w-5 text-accent"/>
                 </div>
              </CardContent>
              <CardFooter>
                 <Button onClick={handleStake} disabled={dreamDew < stakeAmount} className="w-full">
                    Stake {stakeAmount} Dream Dew
                 </Button>
              </CardFooter>
            </Card>
          )}
          
          {appState === 'taking_photo' && (
             <Card className="lg:col-span-2 slide-in-from-bottom transition-all hover:shadow-primary/5" style={{animationDelay: '200ms'}}>
               <CardHeader>
                  <CardTitle className="font-headline text-2xl">Begin Sleep Ritual</CardTitle>
                  <CardDescription>Take a photo of your bed or upload one from your gallery.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                   <div className="w-full aspect-video bg-secondary rounded-md overflow-hidden flex items-center justify-center relative">
                    {uploadedImage ? (
                        <Image src={uploadedImage.url} alt="Uploaded bed photo" layout="fill" objectFit="cover" />
                    ) : (
                        <>
                            <video ref={videoRef} className={cn("h-full w-full object-cover", { 'hidden': hasCameraPermission !== true })} autoPlay muted playsInline />
                            {hasCameraPermission === false && <p className='text-muted-foreground'>Camera not available.</p>}
                            {hasCameraPermission === null && !videoRef.current?.srcObject && <Loader className="h-8 w-8 animate-spin text-primary" />}
                        </>
                    )}
                   </div>
                    {hasCameraPermission === false && !uploadedImage && (
                        <Alert>
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle>Camera Unavailable</AlertTitle>
                            <AlertDescription>
                                Please upload a photo from your gallery instead. Manual uploads may take longer to process for verification.
                            </AlertDescription>
                        </Alert>
                    )}
                    {uploadedImage && (
                        <Alert variant="default">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle>Image Uploaded</AlertTitle>
                            <AlertDescription>
                                {uploadedImage.date}
                            </AlertDescription>
                        </Alert>
                    )}
                   <canvas ref={canvasRef} className="hidden" />
                   <Input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                </CardContent>
                <CardFooter className="flex flex-col sm:flex-row gap-2">
                    <Button variant="outline" onClick={() => takePhoto()} disabled={!hasCameraPermission} className="w-full">
                        <Camera className="mr-2 h-4 w-4"/>
                        Take Photo
                    </Button>
                    <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="w-full">
                        <Upload className="mr-2 h-4 w-4"/>
                        Upload from Gallery
                    </Button>
                    <Button onClick={handleConfirmPhoto} disabled={!uploadedImage} className="w-full">
                      <ShieldCheck className="mr-2 h-4 w-4"/>
                      Confirm and Verify
                    </Button>
                    <Button variant="ghost" onClick={() => { setAppState('idle'); setUploadedImage(null); }} className="w-full sm:w-auto">Cancel</Button>
                </CardFooter>
             </Card>
          )}


          {isStaked && appState !== 'taking_photo' && appState !== 'analyzing_photo' && (
            <Card className="lg:col-span-2 slide-in-from-bottom transition-all hover:shadow-primary/5" style={{animationDelay: '200ms'}}>
              <CardHeader>
                <CardTitle className="font-headline text-2xl">Daily Rituals</CardTitle>
                <CardDescription>Generate proofs of your positive actions.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4 rounded-lg border p-4 hover:border-primary/20 transition-colors">
                    <div className="flex items-center gap-3">
                      <Bed className="h-6 w-6 text-primary" />
                      <h3 className="font-headline text-lg">Proof of Rest</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">Commit to rest. Take a photo of your bed, and we'll generate a ZK-Proof of your sleep, minting 'Dream Dew' tokens without compromising your data.</p>
                    <Button onClick={handleBeginSleepRitual} disabled={appState !== 'idle'} className="w-full">
                      {appState === 'idle' ? 'Begin Sleep Ritual' : 'Ritual in Progress...'}
                    </Button>
                </div>

                <div className="space-y-4 rounded-lg border p-4 hover:border-primary/20 transition-colors">
                    <div className="flex items-center gap-3">
                      <Mail className="h-6 w-6 text-primary" />
                      <h3 className="font-headline text-lg">Proof of Action</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">Spend 10 Dream Dew to plant a flower in your garden. Use ZK-Email to prove you've contacted a representative, and your anonymous action will be added to the public registry.</p>
                    <Button onClick={handleCivicAction} disabled={appState !== 'idle' || dreamDew < 10} variant="outline" className="w-full">
                      {dreamDew < 10 ? 'Need 10 Dream Dew' : 'Plant a Seed of Action'}
                    </Button>
                </div>

                {appState !== 'idle' && appState !== 'taking_photo' && (
                  <div className="mt-4 space-y-3 p-4 bg-secondary/50 rounded-lg fade-in">
                    <div className="flex items-center gap-3 text-sm font-medium">
                      {getStateDescription().icon}
                      <span>{getStateDescription().text}</span>
                    </div>
                    <Progress value={progress} className="w-full h-2" />
                  </div>
                )}
              </CardContent>
            </Card>
          )}

           {(appState === 'analyzing_photo') && (
                 <Card className="lg:col-span-2 slide-in-from-bottom transition-all hover:shadow-primary/5" style={{animationDelay: '200ms'}}>
                    <CardHeader>
                        <CardTitle className="font-headline text-2xl">Daily Rituals</CardTitle>
                        <CardDescription>Generate proofs of your positive actions.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="mt-4 space-y-3 p-4 bg-secondary/50 rounded-lg fade-in">
                            <div className="flex items-center gap-3 text-sm font-medium">
                            {getStateDescription().icon}
                            <span>{getStateDescription().text}</span>
                            </div>
                            <Progress value={progress} className="w-full h-2" />
                        </div>
                    </CardContent>
                </Card>
            )}
          
          <Card className="lg:col-span-2 slide-in-from-bottom transition-all hover:shadow-primary/5" style={{animationDelay: '400ms'}}>
            <CardHeader>
                <CardTitle className="font-headline text-2xl flex items-center gap-3"><ShoppingCart className="text-primary"/> Device Store</CardTitle>
                <CardDescription>Acquire the tools to contribute to glucose monitoring research.</CardDescription>
            </CardHeader>
            <CardContent className="grid sm:grid-cols-2 gap-4">
                <Card className="p-4 flex flex-col items-start gap-4 hover:bg-secondary/50 transition-colors">
                    <Image src="https://placehold.co/100x100.png" alt="fNIRS Armband" width={100} height={100} className="rounded-lg self-center" data-ai-hint="wearable technology"/>
                    <div className="flex-grow space-y-2">
                        <h3 className="font-headline text-lg">fNIRS Armband</h3>
                        <p className="text-sm text-muted-foreground">Open-hardware fNIRS device for continuous, non-invasive data collection.</p>
                        <div className="flex items-center gap-2 text-accent font-bold">
                            <DewDropIcon className="h-5 w-5"/>
                            <span>100 Dream Dew</span>
                        </div>
                    </div>
                    <Button onClick={() => handleAcquireDevice(100, setHasFnirsDevice)} disabled={dreamDew < 100 || hasFnirsDevice} className="w-full">
                      {hasFnirsDevice ? 'Acquired' : 'Acquire'}
                    </Button>
                </Card>
                <Card className="p-4 flex flex-col items-start gap-4 hover:bg-secondary/50 transition-colors">
                    <Image src="https://placehold.co/100x100.png" alt="Abbott Glucose Monitor" width={100} height={100} className="rounded-lg self-center" data-ai-hint="medical device"/>
                    <div className="flex-grow space-y-2">
                        <h3 className="font-headline text-lg">Abbott Glucose Monitor</h3>
                        <p className="text-sm text-muted-foreground">Certified medical device for providing baseline glucose data to train the model.</p>
                        <div className="flex items-center gap-2 text-accent font-bold">
                           <DewDropIcon className="h-5 w-5"/>
                           <span>150 Dream Dew</span>
                        </div>
                    </div>
                    <Button onClick={() => handleAcquireDevice(150, setHasAbbottDevice)} disabled={dreamDew < 150 || hasAbbottDevice} className="w-full">
                        {hasAbbottDevice ? 'Acquired' : 'Acquire'}
                    </Button>
                </Card>
            </CardContent>
             {(hasFnirsDevice && hasAbbottDevice) &&
                <CardFooter>
                    <Card className="p-4 w-full bg-secondary/50 border-primary/30">
                        <div className="flex items-center gap-3">
                            <BrainCircuit className="h-6 w-6 text-primary" />
                            <h3 className="font-headline text-lg">Ready to Contribute</h3>
                        </div>
                        <p className="text-sm text-muted-foreground mt-2">You have both devices. Start pairing your data to help train the glucose prediction model and earn proportional rewards.</p>
                        <Button className="mt-3 w-full">Begin Data Pairing</Button>
                    </Card>
                </CardFooter>
            }
          </Card>
           
          {hasFnirsDevice && (
            <Card className="lg:col-span-2 slide-in-from-bottom transition-all hover:shadow-primary/5" style={{animationDelay: '500ms'}}>
               <CardHeader>
                  <CardTitle className="font-headline text-2xl flex items-center gap-3"><HardDrive className="text-primary"/> Sovereign Storage on Swarm</CardTitle>
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
                    <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/50 text-destructive-foreground">
                      <div className="flex items-start">
                        <AlertTriangle className="h-5 w-5 mr-3 mt-1 text-destructive" />
                        <div>
                          <h4 className="font-bold">Save These Credentials!</h4>
                          <p className="text-sm">This is the only time you will see your password. We do not store it. Keep it safe.</p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ethAddress">Gnosis Chain Address</Label>
                      <div className="flex items-center gap-2">
                        <Input id="ethAddress" value={swarmKeys.ethereumAddress} readOnly />
                        <Button variant="ghost" size="icon" onClick={() => copyToClipboard(swarmKeys.ethereumAddress)}><Copy/></Button>
                      </div>
                    </div>
                     <div className="space-y-2">
                      <Label htmlFor="publicKey">Swarm Public Key</Label>
                       <div className="flex items-center gap-2">
                        <Input id="publicKey" value={swarmKeys.publicKey} readOnly />
                         <Button variant="ghost" size="icon" onClick={() => copyToClipboard(swarmKeys.publicKey)}><Copy/></Button>
                      </div>
                    </div>
                     <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                       <div className="flex items-center gap-2">
                        <Input id="password" value={swarmKeys.password} readOnly />
                        <Button variant="ghost" size="icon" onClick={() => copyToClipboard(swarmKeys.password)}><Copy/></Button>
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
                      <h3 className="font-headline text-lg flex items-center gap-3"><FileUp/> Ready to Upload</h3>
                      <p className="text-sm text-muted-foreground">Your Swarm storage is set up. You can now upload your encrypted fNIRS data sessions.</p>
                      <Button className="w-full">Upload fNIRS Data</Button>
                   </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}


'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Wallet, Bed, Mail, Zap, Loader, KeyRound, Sprout, Network, ShoppingCart, BrainCircuit, HardDrive, FileUp, AlertTriangle, Copy, ShieldCheck, UploadCloud, Camera, Upload } from 'lucide-react';
import DewDropIcon from '@/components/icons/DewDropIcon';
import FlowerIcon from '@/components/icons/FlowerIcon';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { detectSleepingSurface } from '@/ai/flows/detect-sleeping-surface-flow';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from "@/components/ui/chart"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';
import { useWalletSelector } from '@/components/WalletProvider';
import { CONTRACT_ID } from '@/lib/constants';
import { utils } from 'near-api-js';

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

type WhoopData = {
    date: string;
    'Time in Bed (hours)': number;
    'Sleep (hours)': number;
}[];

const chartConfig = {
  timeInBed: {
    label: "Time in Bed",
    color: "hsl(var(--chart-1))",
  },
  sleep: {
    label: "Sleep",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig

const THIRTY_TGAS = "30000000000000";
const CIVIC_ACTION_STAKE = "0.1"; // 0.1 NEAR for civic action stake

export default function Home() {
  const [dreamDew, setDreamDew] = useState(200); // Start with enough dew to test
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [gardenFlowers, setGardenFlowers] = useState(0);
  const [hasFnirsDevice, setHasFnirsDevice] = useState(false);
  const [hasAbbottDevice, setHasAbbottDevice] = useState(false);


  const [isLoading, setIsLoading] = useState(true);
  const [appState, setAppState] = useState<'idle' | 'sleeping' | 'generating_sleep_proof' | 'minting_dew' | 'taking_action' | 'generating_action_proof' | 'planting_seed' | 'taking_photo' | 'analyzing_photo'>('idle');
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const { selector, signedAccountId, logOut, logIn, isLoggingIn } = useWalletSelector();
  const walletConnected = !!signedAccountId;

  // Staking state
  const [isRestStaked, setIsRestStaked] = useState(false);
  const [isActionStaked, setIsActionStaked] = useState(false);
  const [stakeAmount, setStakeAmount] = useState("1"); // In NEAR for sleep
  const [stakedBalance, setStakedBalance] = useState("0");


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
  const whoopInputRef = useRef<HTMLInputElement>(null);
  const [uploadedImage, setUploadedImage] = useState<{url: string, date: string} | null>(null);

  // Whoop Data
  const [whoopData, setWhoopData] = useState<WhoopData>([]);


  useEffect(() => {
    // Simulate initial loading
    setTimeout(() => setIsLoading(false), 1000);
  }, []);

  const getStakedBalance = useCallback(async () => {
    if (!selector || !signedAccountId) return;
    const { network } = selector.options;
    const provider = new utils.JsonRpcProvider({ url: network.nodeUrl });

    try {
        const balanceResult = await provider.query({
        request_type: "call_function",
        finality: "final",
        account_id: CONTRACT_ID,
        method_name: "get_staked_balance",
        args_base64: btoa(JSON.stringify({ account_id: signedAccountId })),
      });
      
      const staked = JSON.parse(Buffer.from((balanceResult as any).result).toString());
      const formattedBalance = utils.format.formatNearAmount(staked);
      setStakedBalance(formattedBalance);

      // Simple logic to check if staked for rest or action.
      // A more robust solution might involve checking different staking pools in the contract.
      const numericBalance = Number(formattedBalance);
      if (numericBalance > 0) {
        if (numericBalance >= 1) { // Assuming sleep stake is >= 1
             setIsRestStaked(true);
        } else {
             setIsActionStaked(true);
        }
      } else {
        setIsRestStaked(false);
        setIsActionStaked(false);
      }


    } catch (error) {
      console.error("Failed to get staked balance:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch staked balance.",
      });
    }

  }, [selector, signedAccountId, toast]);


  useEffect(() => {
    if(walletConnected) {
        getStakedBalance();
    }
  }, [walletConnected, getStakedBalance]);

  
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

  const handleStake = async (amount: string, stakeType: 'rest' | 'action') => {
    if (!walletConnected || !selector) {
      toast({ variant: "destructive", title: "Wallet not connected", description: "Please connect your NEAR wallet to stake." });
      return;
    }
    const wallet = await selector.wallet();
    if (!wallet) {
      toast({ variant: "destructive", title: "Wallet not connected" });
      return;
    }

    try {
      await wallet.signAndSendTransaction({
        receiverId: CONTRACT_ID,
        actions: [
          {
            type: 'FunctionCall',
            params: {
              methodName: 'stake',
              args: {},
              gas: THIRTY_TGAS,
              deposit: utils.format.parseNearAmount(amount) || "0",
            },
          },
        ],
      });
      
      toast({
        title: "Commitment Successful",
        description: `You have staked ${amount} NEAR.`,
      });
      await getStakedBalance();
      
      if(stakeType === 'rest') {
          handleBeginSleepVerification();
      } else {
          handleCivicAction();
      }

    } catch (error) {
      console.error("Stake failed:", error);
      toast({
        variant: "destructive",
        title: "Stake Failed",
        description: (error as Error).message,
      });
    }
  };
  
    const handleUnstake = async (amountToUnstake: string) => {
        if (!walletConnected || !selector) {
            toast({ variant: "destructive", title: "Wallet not connected", description: "Please connect your wallet to unstake." });
            return;
        }
        const wallet = await selector.wallet();
        if (!wallet) {
            toast({ variant: "destructive", title: "Wallet not connected" });
            return;
        }

        try {
            const amountInYocto = utils.format.parseNearAmount(amountToUnstake);
            if(!amountInYocto) {
                toast({ variant: "destructive", title: "Error", description: "Invalid unstake amount" });
                return;
            }

            await wallet.signAndSendTransaction({
                receiverId: CONTRACT_ID,
                actions: [
                    {
                        type: 'FunctionCall',
                        params: {
                            methodName: 'unstake',
                            args: { amount: amountInYocto },
                            gas: THIRTY_TGAS,
                            deposit: "0",
                        },
                    },
                ],
            });
            toast({
                title: "Unstake Successful",
                description: `You have unstaked ${amountToUnstake} NEAR plus rewards.`,
            });
            await getStakedBalance();
        } catch (error) {
            console.error("Unstake failed:", error);
            toast({
                variant: "destructive",
                title: "Unstake Failed",
                description: (error as Error).message,
            });
        }
    };

  const handleBeginSleepVerification = () => {
    setUploadedImage(null);
    setAppState('taking_photo');
  };

  const getCameraPermission = useCallback(async () => {
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
    },[hasCameraPermission]);

  useEffect(() => {
    if(appState === 'taking_photo' && !uploadedImage) {
        getCameraPermission();
    }
  }, [appState, uploadedImage, getCameraPermission]);
  
  
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

    const handleWhoopImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const text = e.target?.result as string;
                try {
                    const rows = text.split('\n').slice(1); // Skip header
                    const parsedData = rows.map(row => {
                        const columns = row.split(',');
                        // Assuming CSV format: Date, ... some columns ..., Time in Bed (seconds), Sleep Duration (seconds)
                        // This will need adjustment based on the actual CSV structure
                        const date = new Date(columns[0]).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                        const timeInBed = parseFloat(columns[19]) / 3600; // Example column
                        const sleep = parseFloat(columns[20]) / 3600; // Example column
                        
                        if (!date || isNaN(timeInBed) || isNaN(sleep)) return null;

                        return { date, 'Time in Bed (hours)': timeInBed, 'Sleep (hours)': sleep };
                    }).filter(Boolean) as WhoopData;
                    
                    if(parsedData.length === 0) {
                        throw new Error("CSV format is not as expected or file is empty.");
                    }

                    setWhoopData(parsedData.slice(-7)); // Show last 7 days
                    toast({
                        title: "Import Successful",
                        description: `Imported ${parsedData.length} sleep records.`,
                    });
                } catch (err) {
                    console.error("Error parsing Whoop CSV:", err);
                    toast({
                        variant: "destructive",
                        title: "Import Failed",
                        description: "The CSV file could not be parsed. Please ensure it's a valid Whoop sleep data export.",
                        duration: 5000,
                    });
                }
            };
            reader.readAsText(file);
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
            await runProgress(2000, async () => {
                // Only unstake if the sleep verification is successful
                if(walletConnected) {
                    await handleUnstake(stakeAmount);
                }
            });

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
    await runProgress(1500, async () => {
        setGardenFlowers(prev => prev + 1);
        setDreamDew(prev => Math.max(0, prev - 10));
        if (walletConnected) {
            await handleUnstake(CIVIC_ACTION_STAKE);
        }
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
        return { icon: <Zap className="futuristic-glow text-primary" />, text: 'Returning your stake...' };
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

  if (isLoading) {
    return <div className="flex h-screen w-full items-center justify-center bg-background"><Loader className="h-12 w-12 animate-spin text-primary" /></div>;
  }

  return (
    <div className="min-h-screen w-full bg-background text-foreground fade-in">
      <header className="sticky top-0 z-10 border-b border-border/50 bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <h1 className="font-headline text-xl md:text-2xl text-primary">think2earn</h1>
          <div className="flex items-center gap-2 md:gap-4">
            <div className="flex items-center gap-2 rounded-full border border-border/50 bg-card px-3 md:px-4 py-2 text-sm shadow-sm">
                <DewDropIcon className="h-5 w-5 text-accent" />
                <span className="font-bold text-base md:text-lg">{dreamDew}</span>
                <span className="text-muted-foreground hidden sm:inline">Dream Dew</span>
            </div>
            
            {walletConnected ? (
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 rounded-full border border-border/50 bg-card px-3 md:px-4 py-2 text-sm shadow-sm">
                        <Wallet className="h-5 w-5 text-primary" />
                        <span className="font-mono text-muted-foreground text-xs md:text-sm truncate max-w-[100px] sm:max-w-none">{signedAccountId}</span>
                    </div>
                    <Button variant="ghost" size="sm" onClick={logOut}>Logout</Button>
                </div>
            ) : (
                <Button onClick={logIn} disabled={isLoggingIn}>
                    <Wallet className="mr-2 h-4 w-4" />
                    {isLoggingIn ? 'Connecting...' : 'Connect NEAR Wallet'}
                </Button>
            )}
          </div>
        </div>
      </header>
      
      <main className="container mx-auto p-4">
      <Input type="file" accept=".csv" ref={whoopInputRef} onChange={handleWhoopImport} className="hidden" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
            
            {/* Main Column */}
            <div className="lg:col-span-2 space-y-6">
                
                {appState === 'taking_photo' && (
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
                                                <AlertDescription>
                                                    No problem. Please upload a photo from your gallery instead. Note that manual uploads may take longer to process for verification.
                                                </AlertDescription>
                                            </Alert>
                                        }
                                        {hasCameraPermission === null && !videoRef.current?.srcObject && <Loader className="h-8 w-8 animate-spin text-primary" />}
                                    </>
                                )}
                            </div>

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

                {appState !== 'taking_photo' && (
                    <Card className="slide-in-from-bottom transition-all hover:shadow-primary/5">
                    <CardHeader>
                        <CardTitle className="font-headline text-2xl">Daily Actions</CardTitle>
                        <CardDescription>Generate proofs of your positive actions by making a commitment.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-4 rounded-lg border p-4 hover:border-primary/20 transition-colors">
                            <div className="flex items-center gap-3">
                                <Bed className="h-6 w-6 text-primary" />
                                <h3 className="font-headline text-lg">Proof of Rest</h3>
                            </div>
                            <p className="text-sm text-muted-foreground">Commit NEAR as a pledge to your sleep. Your stake is returned with a reward after successful verification.</p>
                            
                            {isRestStaked && walletConnected ? (
                                <div className='p-4 bg-secondary rounded-md'>
                                    <p className='text-sm font-semibold'>You have <span className="font-bold text-primary">{stakedBalance} NEAR</span> staked.</p>
                                    <p className="text-xs text-muted-foreground mt-1">Complete the sleep verification to get it back with a reward.</p>
                                    <Button onClick={handleBeginSleepVerification} disabled={appState !== 'idle'} className="w-full mt-3">
                                        Verify Sleep
                                    </Button>
                                </div>
                            ) : (
                                <div className="flex items-end gap-2">
                                    <div className="flex-grow">
                                        <Label htmlFor="stake-amount">Commitment (NEAR)</Label>
                                        <Input id="stake-amount" type="number" value={stakeAmount} onChange={(e) => setStakeAmount(e.target.value)} className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                                    </div>
                                    <Button onClick={() => handleStake(stakeAmount, 'rest')} disabled={appState !== 'idle' || Number(stakeAmount) <= 0}>
                                        Commit & Begin
                                    </Button>
                                </div>
                            )}
                        </div>

                        <div className="space-y-4 rounded-lg border p-4 hover:border-primary/20 transition-colors">
                            <div className="flex items-center gap-3">
                                <Mail className="h-6 w-6 text-primary" />
                                <h3 className="font-headline text-lg">Proof of Action</h3>
                            </div>
                            <p className="text-sm text-muted-foreground">Commit a small stake of {CIVIC_ACTION_STAKE} NEAR and spend 10 Dream Dew to prove you've contacted a representative. Your anonymous action will be added to the public registry, and your stake returned.</p>

                            {isActionStaked && walletConnected ? (
                                <div className='p-4 bg-secondary rounded-md'>
                                    <p className='text-sm font-semibold'>You have a civic action commitment active.</p>
                                    <Button onClick={handleCivicAction} disabled={appState !== 'idle'} className="w-full mt-3">
                                        Verify Action
                                    </Button>
                                </div>
                            ) : (
                                <Button onClick={() => handleStake(CIVIC_ACTION_STAKE, 'action')} disabled={appState !== 'idle' || dreamDew < 10} variant="outline" className="w-full">
                                    {dreamDew < 10 ? 'Need 10 Dream Dew' : `Commit ${CIVIC_ACTION_STAKE} NEAR & Plant Seed`}
                                </Button>
                            )}
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

                 <Card className="slide-in-from-bottom transition-all hover:shadow-primary/5" style={{animationDelay: '100ms'}}>
                    <CardHeader>
                    <CardTitle className="font-headline text-2xl">My Action Garden</CardTitle>
                    <CardDescription>A testament to your verified positive actions.</CardDescription>
                    </CardHeader>
                    <CardContent>
                    <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-4 p-4 rounded-lg min-h-[160px] bg-secondary/30 border border-border/50">
                        {Array.from({ length: gardenFlowers }).map((_, i) => (
                        <FlowerIcon key={i} className="h-10 w-10 sprout text-primary" style={{ animationDelay: `${i * 50}ms` }}/>
                        ))}
                        {gardenFlowers === 0 && <p className="col-span-full text-center text-muted-foreground self-center">Your garden awaits. Plant a seed by taking civic action.</p>}
                    </div>
                    </CardContent>
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
            </div>
            
            {/* Side Column */}
            <div className="lg:col-span-1 space-y-6">
                 <Card className="slide-in-from-bottom transition-all hover:shadow-primary/5" style={{animationDelay: '300ms'}}>
                    <CardHeader>
                        <div className='flex items-start justify-between gap-4'>
                            <div>
                                <CardTitle className="font-headline text-2xl">Sleep Log</CardTitle>
                                <CardDescription>Your private, encrypted records of rest.</CardDescription>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => whoopInputRef.current?.click()}>
                                <UploadCloud className="mr-2 h-4 w-4" />
                                Import
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {whoopData.length > 0 && (
                            <div className="mb-6">
                                <h4 className="text-lg font-headline mb-2">Recent Sleep Performance</h4>
                                <ChartContainer config={chartConfig} className="h-[200px] w-full">
                                    <BarChart accessibilityLayer data={whoopData} margin={{ top: 20, right: 20, bottom: 5, left: 0 }}>
                                        <CartesianGrid vertical={false} />
                                        <XAxis dataKey="date" tickLine={false} tickMargin={10} axisLine={false} />
                                        <YAxis unit="h" tickLine={false} axisLine={false} />
                                        <RechartsTooltip cursor={false} content={<ChartTooltipContent />} />
                                        <Legend />
                                        <Bar dataKey="Time in Bed (hours)" name="Time in Bed" fill="var(--color-timeInBed)" radius={4} />
                                        <Bar dataKey="Sleep (hours)" name="Sleep" fill="var(--color-sleep)" radius={4} />
                                    </BarChart>
                                </ChartContainer>
                            </div>
                        )}
                        <ScrollArea className="h-[520px] pr-4">
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
                                {journalEntries.length === 0 && <p className="text-center text-muted-foreground pt-16">Complete a sleep verification to start your log.</p>}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>
        </div>
      </main>
    </div>
  );
}


    

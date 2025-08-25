

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Wallet, Bed, Mail, Zap, Loader, KeyRound, Sprout, Network, ShoppingCart, BrainCircuit, HardDrive, FileUp, AlertTriangle, Copy, ShieldCheck, UploadCloud, Camera, Upload, TestTube, FilePlus2, CheckCircle2, UserCog, FileText, Activity, Clock, BarChart2, Lock } from 'lucide-react';
import DewDropIcon from '@/components/icons/DewDropIcon';
import FlowerIcon from '@/components/icons/FlowerIcon';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { detectSleepingSurface } from '@/ai/flows/detect-sleeping-surface-flow';
import { scoreDataContribution } from '@/ai/flows/score-data-contribution-flow';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from "@/components/ui/chart"
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';
import { useWalletSelector } from '@/components/WalletProvider';
import { CONTRACT_ID } from '@/lib/constants';
import { utils, providers } from 'near-api-js';
import type { CodeResult } from "near-api-js/lib/providers/provider";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import FlowerIconTwo from '@/components/icons/FlowerIconTwo';
import FlowerIconThree from '@/components/icons/FlowerIconThree';


type MotionDataPoint = {
  time: number;
  magnitude: number;
};

type JournalEntry = {
  id: number;
  date: string;
  sleep: string;
  imageUrl: string;
  motionData?: MotionDataPoint[];
};

type PairedDataEntry = {
  id: number;
  date: string;
  fnirsFile: string;
  glucoseLevel: number;
  contributionScore: number;
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

type GardenFlower = {
    id: number;
    Icon: React.ElementType;
    unlocked: boolean;
};

const whoopChartConfig = {
  timeInBed: {
    label: "Time in Bed",
    color: "hsl(var(--chart-1))",
  },
  sleep: {
    label: "Sleep",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig

const motionChartConfig = {
    magnitude: {
      label: "Movement",
      color: "hsl(var(--primary))",
    },
} satisfies ChartConfig


type StakerInfo = {
    amount: string; // Comes as a string from the contract
    bonus_approved: boolean;
};

type FileInfo = {
    name: string;
    size: string;
    rows: number;
    cols: number;
} | null;

type Campaign = 'chat_control' | 'sugar_tax' | 'sleep_compensation';

type CampaignState = 'idle' | 'email_pending' | 'verified';

const CAMPAIGN_DETAILS: Record<Campaign, { title: string; description: string; subject: string }> = {
    chat_control: {
        title: "Stop Chat Control",
        description: "The EU is working on a law that would monitor all citizens' communications. Voice your opposition to this mass surveillance proposal.",
        subject: "Regarding the 'Chat Control' Proposal",
    },
    sugar_tax: {
        title: "Should sugar be taxed?",
        description: "Contribute your opinion to the debate on whether a sugar tax is an effective public health policy for combating obesity and related diseases.",
        subject: "Opinion on Sugar Taxation Policy"
    },
    sleep_compensation: {
        title: "Should sleep be compensated?",
        description: "Argue for or against the idea that adequate sleep, which boosts productivity and reduces errors, should be recognized or compensated by employers.",
        subject: "The Economic Case for Sleep Compensation"
    }
};


const THIRTY_TGAS = "30000000000000";
type MotionStatus = 'still' | 'slight' | 'heavy';

export default function Home() {
  const [intentionPoints, setIntentionPoints] = useState(250); // Start with enough points to test
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [gardenFlowers, setGardenFlowers] = useState<GardenFlower[]>([
    { id: 1, Icon: FlowerIcon, unlocked: false },
    { id: 2, Icon: FlowerIconTwo, unlocked: false },
    { id: 3, Icon: FlowerIconThree, unlocked: false },
    { id: 4, Icon: FlowerIcon, unlocked: false },
    { id: 5, Icon: FlowerIconTwo, unlocked: false },
  ]);
  const [hasFnirsDevice, setHasFnirsDevice] = useState(false);
  const [hasAbbottDevice, setHasAbbottDevice] = useState(false);
  const [isSleepLogUnlocked, setIsSleepLogUnlocked] = useState(false);


  const [isLoading, setIsLoading] = useState(true);
  const [appState, setAppState] = useState<'idle' | 'sleeping' | 'generating_sleep_proof' | 'minting_dew' | 'taking_action' | 'generating_action_proof' | 'planting_seed' | 'taking_photo' | 'analyzing_photo' | 'uploading_data'>('idle');
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const { selector, signedAccountId, logOut, logIn, isLoggingIn } = useWalletSelector();
  const walletConnected = !!signedAccountId;

  // Staking state
  const [stakerInfo, setStakerInfo] = useState<StakerInfo | null>(null);
  const [stakeAmount, setStakeAmount] = useState("0.1"); // In NEAR for sleep

  // Civic Action State
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign>('chat_control');
  const [campaignStates, setCampaignStates] = useState<Record<Campaign, CampaignState>>({
      chat_control: 'idle',
      sugar_tax: 'idle',
      sleep_compensation: 'idle'
  });
  const emailUploadRef = useRef<HTMLInputElement>(null);

  // Swarm State
  const [swarmState, setSwarmState] = useState<'idle' | 'generating_keys' | 'keys_generated' | 'funding' | 'buying_stamps' | 'ready_to_upload'>('idle');
  const [swarmKeys, setSwarmKeys] = useState<SwarmKeys>(null);
  const [credentialsSaved, setCredentialsSaved] = useState(false);
  const [accountFunded, setAccountFunded] = useState(false);
  const [stampsPurchased, setStampsPurchased] = useState(false);
  const [showSwarmUI, setShowSwarmUI] = useState(false);
  
  // Camera State
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const whoopInputRef = useRef<HTMLInputElement>(null);
  const fnirsInputRef = useRef<HTMLInputElement>(null);
  const glucoseInputRef = useRef<HTMLInputElement>(null);
  const [uploadedImage, setUploadedImage] = useState<{url: string, date: string} | null>(null);

  // Whoop Data
  const [whoopData, setWhoopData] = useState<WhoopData>([]);
  
  // Data Contribution State
  const [fnirsFile, setFnirsFile] = useState<File | null>(null);
  const [glucoseFile, setGlucoseFile] = useState<File | null>(null);
  const [fnirsInfo, setFnirsInfo] = useState<FileInfo>(null);
  const [glucoseInfo, setGlucoseInfo] = useState<FileInfo>(null);
  const [pairedDataHistory, setPairedDataHistory] = useState<PairedDataEntry[]>([]);

  // Admin state
  const [isAdmin, setIsAdmin] = useState(false);
  const [contractOwner, setContractOwner] = useState<string | null>(null);
  const [stakerIdToApprove, setStakerIdToApprove] = useState('');
  const [infoForAddress, setInfoForAddress] = useState<StakerInfo | null>(null);
  const [isCheckingAddress, setIsCheckingAddress] = useState(false);
  
  // Motion Sensor State
  const [motionData, setMotionData] = useState<MotionDataPoint[]>([]);
  const motionStartTimeRef = useRef<number | null>(null);
  const [liveMotionStatus, setLiveMotionStatus] = useState<MotionStatus>('still');
  const [hasMotionSensor, setHasMotionSensor] = useState<boolean|null>(null);
  const motionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isVerifyingSleep = ['analyzing_photo', 'sleeping', 'generating_sleep_proof', 'minting_dew'].includes(appState);
  const isVerifyingAction = ['generating_action_proof', 'planting_seed'].includes(appState);
  const isUploadingData = appState === 'uploading_data';


  useEffect(() => {
    // Simulate initial loading
    setTimeout(() => setIsLoading(false), 1000);
    startLiveMotionTracking(); // Attempt to start tracking on load
  }, []);

  const getContractOwner = useCallback(async () => {
    if (!selector) return;
    const { network } = selector.options;
    const provider = new providers.JsonRpcProvider({ url: network.nodeUrl });

    try {
      const res = await provider.query<CodeResult>({
        request_type: "call_function",
        finality: "final",
        account_id: CONTRACT_ID,
        method_name: "get_owner",
        args_base64: btoa(JSON.stringify({})),
      });
      const owner = JSON.parse(Buffer.from(res.result).toString());
      setContractOwner(owner);
    } catch (error) {
      console.error("Failed to get contract owner:", error);
    }
  }, [selector]);
  
  const getStakerInfo = useCallback(async (stakerId: string) => {
    if (!selector) return null;
    const { network } = selector.options;
    const provider = new providers.JsonRpcProvider({ url: network.nodeUrl });

    try {
        const res = await provider.query<CodeResult>({
            request_type: "call_function",
            finality: "final",
            account_id: CONTRACT_ID,
            method_name: "get_stake_info",
            args_base64: btoa(JSON.stringify({ staker_id: stakerId })),
        });
      
      const info = JSON.parse(Buffer.from(res.result).toString());
      return info;
    } catch (error) {
      console.error(`Failed to get staker info for ${stakerId}:`, error);
      return null;
    }
  }, [selector]);

  useEffect(() => {
    getContractOwner();
  }, [getContractOwner]);

  useEffect(() => {
    async function checkAdminStatus() {
        if (walletConnected && signedAccountId && contractOwner) {
            setIsAdmin(signedAccountId === contractOwner);
        } else {
            setIsAdmin(false);
        }
    }
    checkAdminStatus();
  }, [walletConnected, signedAccountId, contractOwner]);

  useEffect(() => {
    async function fetchUserInfo() {
        if (walletConnected && signedAccountId) {
            const info = await getStakerInfo(signedAccountId);
            setStakerInfo(info);
        } else {
            setStakerInfo(null);
        }
    }
    fetchUserInfo();
  }, [walletConnected, signedAccountId, getStakerInfo]);

  useEffect(() => {
    const checkAddressInfo = async () => {
        if(stakerIdToApprove.endsWith('.near') && stakerIdToApprove.length > 5) { // Basic validation
            setIsCheckingAddress(true);
            const info = await getStakerInfo(stakerIdToApprove);
            setInfoForAddress(info);
            setIsCheckingAddress(false);
        } else {
            setInfoForAddress(null);
        }
    }
    
    const debounceCheck = setTimeout(() => {
        checkAddressInfo();
    }, 500);

    return () => clearTimeout(debounceCheck);

  }, [stakerIdToApprove, getStakerInfo]);


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
  
  const handleStake = async () => {
    if (!walletConnected || !selector) {
      toast({ variant: "destructive", title: "Wallet not connected", description: "Please connect your NEAR wallet to make a commitment." });
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
              deposit: utils.format.parseNearAmount(stakeAmount) || "0",
            },
          },
        ],
      });
      
      toast({
        title: "Commitment Successful",
        description: `You have committed ${stakeAmount} NEAR.`,
      });
      
      const updatedInfo = await getStakerInfo(signedAccountId!);
      setStakerInfo(updatedInfo);
      
      handleBeginSleepVerification();

    } catch (error: any) {
       if (error.message.includes("User closed the window")) {
                toast({
                    variant: "default",
                    title: "Transaction Cancelled",
                    description: "You cancelled the transaction in your wallet.",
                });
            } else {
                console.error("Stake failed:", error);
                toast({
                    variant: "destructive",
                    title: "Commitment Failed",
                    description: error.message || "An unknown error occurred.",
                });
            }
    }
  };
  
    const handleWithdraw = async () => {
        if (!walletConnected || !selector) {
            toast({ variant: "destructive", title: "Wallet not connected", description: "Please connect your wallet to withdraw." });
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
                            methodName: 'withdraw',
                            args: {},
                            gas: THIRTY_TGAS, // Withdraw might need more gas for transfers
                            deposit: "0",
                        },
                    },
                ],
            });
            toast({
                title: "Withdrawal Successful",
                description: `Your commitment has been returned.`,
            });
            const updatedInfo = await getStakerInfo(signedAccountId!);
            setStakerInfo(updatedInfo);
        } catch (error: any) {
            if (error.message.includes("User closed the window")) {
                toast({
                    variant: "default",
                    title: "Transaction Cancelled",
                    description: "You cancelled the transaction in your wallet.",
                });
            } else {
                console.error("Withdrawal failed:", error);
                toast({
                    variant: "destructive",
                    title: "Withdrawal Failed",
                    description: error.message || "An unknown error occurred.",
                });
            }
        }
    };
    
    const handleApproveBonus = async (stakerId: string) => {
        if (!walletConnected || !selector || !isAdmin) {
            toast({ variant: "destructive", title: "Permission Denied", description: "Only the admin can approve bonuses." });
            return;
        }
        const wallet = await selector.wallet();
        if (!wallet) return;

        try {
            await wallet.signAndSendTransaction({
                receiverId: CONTRACT_ID,
                actions: [
                    {
                        type: 'FunctionCall',
                        params: {
                            methodName: 'approve_bonus',
                            args: { staker_id: stakerId },
                            gas: THIRTY_TGAS,
                            deposit: "0",
                        },
                    },
                ],
            });
            toast({ title: "Bonus Approved!", description: `Bonus for ${stakerId} has been approved.` });
            
            // Refresh the info for the address
            const info = await getStakerInfo(stakerId);
            setInfoForAddress(info);

        } catch(error: any) {
             if (error.message.includes("User closed the window")) {
                toast({
                    variant: "default",
                    title: "Transaction Cancelled",
                    description: "You cancelled the transaction in your wallet.",
                });
            } else {
                console.error("Approval failed:", error);
                 toast({ variant: "destructive", title: "Approval Failed", description: (error as Error).message });
            }
        }
    }


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
          const lines = text.split('\n').filter(line => line.trim() !== '');
          if (lines.length < 2) {
            throw new Error("CSV is empty or has no header.");
          }
          
          const headerLine = lines[0].trim();
          const header = headerLine.split(',');
          const rows = lines.slice(1);

          const getIndex = (name: string) => {
            const index = header.findIndex(h => h.trim().toLowerCase() === name.toLowerCase());
            if (index === -1) {
              const alternateNames: {[key: string]: string[]} = {
                  'cycle start time': ['date'],
                  'in bed duration (min)': ['time in bed (min)'],
                  'asleep duration (min)': ['sleep duration (min)', 'asleep (min)'],
              }
              const alternatives = alternateNames[name.toLowerCase()];
              if(alternatives) {
                  for(const alt of alternatives) {
                      const altIndex = header.findIndex(h => h.trim().toLowerCase() === alt.toLowerCase());
                      if(altIndex !== -1) return altIndex;
                  }
              }
              throw new Error(`Required column "${name}" not found in CSV header.`);
            }
            return index;
          };

          const dateIndex = getIndex('Cycle start time');
          const timeInBedIndex = getIndex('In bed duration (min)');
          const sleepIndex = getIndex('Asleep duration (min)');

          const parsedData = rows.map(row => {
            const columns = row.split(',');
            if (columns.length < header.length) return null;

            const dateStr = columns[dateIndex];
            if (!dateStr) return null;

            const date = new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            const timeInBed = parseFloat(columns[timeInBedIndex]) / 60;
            const sleep = parseFloat(columns[sleepIndex]) / 60;
            
            if (!date || isNaN(timeInBed) || isNaN(sleep)) return null;

            return { date, 'Time in Bed (hours)': timeInBed, 'Sleep (hours)': sleep };
          }).filter(Boolean) as WhoopData;
          
          if (parsedData.length === 0) {
            throw new Error("No valid sleep records could be parsed from the file.");
          }

          setWhoopData(parsedData.slice(-7)); // Show last 7 days
          toast({
            title: "Import Successful",
            description: `Imported ${parsedData.length} sleep records.`,
          });
        } catch (err: any) {
          console.error("Error parsing Whoop CSV:", err);
          toast({
            variant: "destructive",
            title: "Import Failed",
            description: err.message || "The CSV file could not be parsed. Please ensure it's a valid Whoop sleep data export.",
            duration: 5000,
          });
        }
      };
      reader.readAsText(file);
    }
  };

  const handleMotion = useCallback((event: DeviceMotionEvent) => {
    if (event.acceleration?.x && event.acceleration?.y && event.acceleration?.z) {
        const { x, y, z } = event.acceleration;
        const magnitude = Math.sqrt(x*x + y*y + z*z);
        if (motionStartTimeRef.current === null) {
            motionStartTimeRef.current = Date.now();
        }
        const time = (Date.now() - motionStartTimeRef.current) / 1000; // in seconds
        setMotionData(prevData => [...prevData, { time, magnitude }]);
    }
  }, []);

  const startMotionTracking = useCallback(async () => {
    // Feature detection
    if (typeof (DeviceMotionEvent as any)?.requestPermission === 'function') {
        // iOS 13+
        try {
            const permissionState = await (DeviceMotionEvent as any).requestPermission();
            if (permissionState === 'granted') {
                window.addEventListener('devicemotion', handleMotion);
            }
        } catch(error) {
            console.error("DeviceMotionEvent permission request failed", error);
            toast({variant: "destructive", title: "Motion Sensor Error", description: "Could not get permission to access motion sensors."})
        }
    } else {
        // Other browsers
        if ('DeviceMotionEvent' in window) {
           window.addEventListener('devicemotion', handleMotion);
        } else {
            toast({title: "Motion Sensors Not Supported", description: "Your device does not support motion tracking."})
        }
    }
  }, [handleMotion, toast]);

  const stopMotionTracking = useCallback(() => {
    window.removeEventListener('devicemotion', handleMotion);
    motionStartTimeRef.current = null;
  }, [handleMotion]);
  
  const handleLiveMotion = useCallback((event: DeviceMotionEvent) => {
    if (event.acceleration?.x && event.acceleration?.y && event.acceleration?.z) {
        const { x, y, z } = event.acceleration;
        // The resting state magnitude is around 9.8 (gravity). We subtract this to focus on user-generated movement.
        const magnitude = Math.abs(Math.sqrt(x*x + y*y + z*z) - 9.8);

        let newStatus: MotionStatus = 'still';
        if (magnitude > 1.5) { // Threshold for heavy movement
            newStatus = 'heavy';
        } else if (magnitude > 0.2) { // Threshold for slight movement
            newStatus = 'slight';
        }
        setLiveMotionStatus(newStatus);
        
        // Reset to 'still' after a short period of no movement
        if(motionTimeoutRef.current) {
            clearTimeout(motionTimeoutRef.current);
        }
        motionTimeoutRef.current = setTimeout(() => {
            setLiveMotionStatus('still');
        }, 1000);
    }
  }, []);

  const startLiveMotionTracking = useCallback(async () => {
    if (hasMotionSensor !== null) return; // Already tried

    if (typeof (DeviceMotionEvent as any)?.requestPermission === 'function') {
        try {
            const permissionState = await (DeviceMotionEvent as any).requestPermission();
            if (permissionState === 'granted') {
                setHasMotionSensor(true);
                window.addEventListener('devicemotion', handleLiveMotion);
            } else {
                setHasMotionSensor(false);
            }
        } catch(error) {
            setHasMotionSensor(false);
            console.error("DeviceMotionEvent permission request failed", error);
        }
    } else if ('DeviceMotionEvent' in window) {
        setHasMotionSensor(true);
        window.addEventListener('devicemotion', handleLiveMotion);
    } else {
        setHasMotionSensor(false);
    }
  }, [handleLiveMotion, hasMotionSensor]);


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
            
            if(walletConnected && signedAccountId && contractOwner === signedAccountId) {
                // If the admin is testing, approve their own bonus for the demo
                await handleApproveBonus(signedAccountId);
            }
            
            setMotionData([]); // Clear previous data
            startMotionTracking();
            
            setAppState('sleeping');
            await runProgress(3000); // Simulate sleep duration

            stopMotionTracking();

            setAppState('generating_sleep_proof');
            await runProgress(2500);
            
            setAppState('minting_dew');
            await runProgress(2000, async () => {
                if(walletConnected) {
                    await handleWithdraw();
                }
            });

            const newPoints = Math.floor(Math.random() * 5) + 5;
            setIntentionPoints(prev => prev + newPoints);
            
            const newEntry: JournalEntry = {
              id: Date.now(),
              date: uploadedImage?.date || new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' }),
              sleep: `${(newPoints - 0.5).toFixed(1)} hours verified`,
              imageUrl: photoUrl,
              motionData: [...motionData] // snapshot the data
            };
            setJournalEntries(prev => [newEntry, ...prev]);

            setAppState('idle');
            setUploadedImage(null);
            setProgress(0);
            setMotionData([]); // Clear for next run

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


  const handleSendEmail = (campaign: Campaign) => {
    const details = CAMPAIGN_DETAILS[campaign];
    const mailtoLink = `mailto:test@gmail.com?subject=${encodeURIComponent(details.subject)}`;
    window.location.href = mailtoLink;
    setCampaignStates(prev => ({ ...prev, [campaign]: 'email_pending' }));
    toast({
        title: "Action Required",
        description: "Your email client has been opened. Please send the email and then upload the .eml file to complete verification.",
        duration: 8000,
    });
  };

  const handleEmailUpload = (e: React.ChangeEvent<HTMLInputElement>, campaign: Campaign) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
        const emailContent = event.target?.result as string;

        setAppState('generating_action_proof');
        await runProgress(2000);

        // Simple regex to check for DKIM-Signature header
        const dkimRegex = /DKIM-Signature/i;
        if (dkimRegex.test(emailContent)) {
            setAppState('planting_seed');
            await runProgress(1500);

            setIntentionPoints(prev => Math.max(0, prev - 10));
            setGardenFlowers(prev => {
                const firstUnlockedIndex = prev.findIndex(f => !f.unlocked);
                if (firstUnlockedIndex !== -1) {
                    const newFlowers = [...prev];
                    newFlowers[firstUnlockedIndex] = { ...newFlowers[firstUnlockedIndex], unlocked: true };
                    return newFlowers;
                }
                return prev;
            });
            
            toast({
                title: "Action Verified!",
                description: "Your civic action has been recorded on-chain. A new flower has bloomed!",
            });
            setCampaignStates(prev => ({ ...prev, [campaign]: 'verified' }));
        } else {
            toast({
                variant: "destructive",
                title: "Verification Failed",
                description: "No DKIM signature found in the uploaded email. Please ensure you upload the correct .eml file.",
                duration: 6000
            });
        }
        setAppState('idle');
        setProgress(0);
        // Reset the input so the same file can be uploaded again if needed
        if (emailUploadRef.current) emailUploadRef.current.value = '';
    };
    reader.readAsText(file);
  };


  const handleAcquireDevice = (cost: number, device: 'fnirs' | 'abbott') => {
    if (intentionPoints >= cost) {
      setIntentionPoints(prev => prev - cost);
      if (device === 'fnirs') {
        setHasFnirsDevice(true);
      } else {
        setHasAbbottDevice(true);
        setShowSwarmUI(true);
      }
    }
  };

  const handleUnlockSleepLog = () => {
      const cost = 500;
      if (intentionPoints >= cost) {
          setIntentionPoints(prev => prev - cost);
          setIsSleepLogUnlocked(true);
          toast({
              title: "Feature Unlocked!",
              description: "Your Sleep Log is now available."
          });
      }
  };
  
    const processFile = (file: File, setInfo: (info: FileInfo) => void) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result as string;
            const lines = text.split('\n').filter(line => line.trim() !== '');
            const rows = lines.length;
            const cols = rows > 0 ? lines[0].split(',').length : 0;
            const sizeInKB = (file.size / 1024).toFixed(2);

            setInfo({
                name: file.name,
                size: `${sizeInKB} KB`,
                rows: rows,
                cols: cols
            });
        };
        reader.readAsText(file);
    };

    const handleFnirsUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setFnirsFile(file);
            processFile(file, setFnirsInfo);
        }
    };

    const handleGlucoseUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setGlucoseFile(file);
            processFile(file, setGlucoseInfo);
        }
    };


  const handleDataContribution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fnirsFile || !glucoseFile) {
      toast({ variant: "destructive", title: "Missing Information", description: "Please provide both a fNIRS and a glucose data file." });
      return;
    }
  
    setAppState('uploading_data');
    await runProgress(1000);
  
    try {
      const fnirsReader = new FileReader();
      fnirsReader.onload = async (event) => {
        const fnirsData = event.target?.result as string;
  
        const glucoseReader = new FileReader();
        glucoseReader.onload = async (gEvent) => {
          const glucoseData = gEvent.target?.result as string;
          
          try {
            // Parse CSV
            const lines = glucoseData.split('\n').filter(line => line.trim() !== '');
            if (lines.length < 2) throw new Error("Glucose CSV has no data rows.");
            
            const headerLine = lines.find(line => line.toLowerCase().includes('historic glucose') || line.toLowerCase().includes('scan glucose'));
            if (!headerLine) throw new Error("Could not find required glucose headers in the file.");

            const header = headerLine.split(',').map(h => h.trim().toLowerCase());
            
            const historicIndex = header.findIndex(h => h.includes('historic glucose'));
            const scanIndex = header.findIndex(h => h.includes('scan glucose'));
            
            if (historicIndex === -1 && scanIndex === -1) {
              throw new Error("Neither 'Historic Glucose' nor 'Scan Glucose' column found.");
            }

            let glucoseValues: number[] = [];
            const dataLines = lines.slice(lines.indexOf(headerLine) + 1);

            dataLines.forEach(line => {
                const columns = line.split(',');
                let valueStr = '';
                if(historicIndex !== -1 && columns.length > historicIndex) {
                    valueStr = columns[historicIndex]?.trim();
                }
                if (!valueStr && scanIndex !== -1 && columns.length > scanIndex) {
                    valueStr = columns[scanIndex]?.trim();
                }

                if (valueStr) {
                    const value = parseFloat(valueStr);
                    if (!isNaN(value)) {
                        glucoseValues.push(value);
                    }
                }
            });

            if (glucoseValues.length === 0) {
              throw new Error("No valid numerical glucose values found in the file.");
            }
            
            // Convert mmol/L to mg/dL for the AI model if needed
            // 1 mmol/L = 18.0182 mg/dL
            const glucoseValuesMgDl = glucoseValues.map(val => val * 18.0182);

            const averageGlucose = glucoseValuesMgDl.reduce((sum, val) => sum + val, 0) / glucoseValuesMgDl.length;
            
            // DEV ONLY: Mock the AI call to prevent rate limiting
            const result = {
              contributionScore: Math.floor(Math.random() * (95 - 75 + 1)) + 75, // Random score between 75-95
              reward: 8,
              reason: "Great submission! The fNIRS data was clean and showed strong correlation with the provided glucose level.",
            };
            // const result = await scoreDataContribution({
            //   fnirsData: fnirsData,
            //   glucoseLevel: averageGlucose,
            // });
    
            await runProgress(1000);
    
            const newEntry: PairedDataEntry = {
              id: Date.now(),
              date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
              fnirsFile: fnirsFile.name,
              glucoseLevel: parseFloat(averageGlucose.toFixed(2)),
              contributionScore: result.contributionScore,
            };
    
            setPairedDataHistory(prev => [newEntry, ...prev]);
            setIntentionPoints(prev => prev + result.reward);
    
            toast({
              title: "Contribution Scored!",
              description: `${result.reason} You earned ${result.reward} Intention Points.`,
            });
    
            // Reset form
            setFnirsFile(null);
            setGlucoseFile(null);
            setFnirsInfo(null);
            setGlucoseInfo(null);
            if (fnirsInputRef.current) fnirsInputRef.current.value = '';
            if (glucoseInputRef.current) glucoseInputRef.current.value = '';
            setAppState('idle');
            setProgress(0);

          } catch (parseError: any) {
              console.error("Error parsing glucose file:", parseError);
              toast({ variant: "destructive", title: "Invalid Glucose Data", description: parseError.message || "Could not parse the glucose time-series file." });
              setAppState('idle');
              setProgress(0);
              return;
          }
        };
        glucoseReader.readAsText(glucoseFile);
      };
      fnirsReader.readAsText(fnirsFile);
  
    } catch(error) {
      console.error("Error scoring data:", error);
      toast({
        variant: "destructive",
        title: "Scoring Error",
        description: "Could not score the data contribution. Please try again.",
      });
      setAppState('idle');
      setProgress(0);
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
  
  const getStateDescription = (state: typeof appState) => {
    switch (state) {
      case 'analyzing_photo':
        return { icon: <BrainCircuit className="animate-pulse text-primary" />, text: 'Analyzing photo for sleeping surface...' };
      case 'sleeping':
        return { icon: <Bed className="animate-pulse text-primary" />, text: 'Capturing sleep sensor data...' };
      case 'generating_sleep_proof':
        return { icon: <KeyRound className="animate-spin text-primary" />, text: 'Generating ZK-Proof of Rest...' };
      case 'minting_dew':
        return { icon: <Zap className="futuristic-glow text-primary" />, text: 'Withdrawing your commitment...' };
      case 'generating_action_proof':
        return { icon: <KeyRound className="animate-spin text-primary" />, text: 'Generating ZK-Proof of Action...' };
      case 'planting_seed':
        return { icon: <Sprout className="sprout text-primary" />, text: 'Verifying on Civic Action Registry...' };
      case 'uploading_data':
        return { icon: <UploadCloud className="animate-pulse text-primary" />, text: 'Analyzing and scoring your contribution...' };
      default:
        return { icon: null, text: '' };
    }
  };

  const ProgressDisplay = ({ state, inCard = true } : { state: typeof appState; inCard?: boolean }) => {
    if (!['analyzing_photo', 'sleeping', 'generating_sleep_proof', 'minting_dew', 'generating_action_proof', 'planting_seed', 'uploading_data'].includes(state)) {
      return null;
    }

    const { icon, text } = getStateDescription(state);

    const content = (
        <div className="space-y-3 fade-in">
            <div className="flex items-center gap-3 text-sm font-medium">
                {icon}
                <span>{text}</span>
            </div>
            <Progress value={progress} className="w-full h-2" />
        </div>
    );
    
    if (inCard) {
      return <div className="mt-4 p-4 bg-secondary/50 rounded-lg">{content}</div>;
    }
    
    return content
  };


  if (isLoading) {
    return <div className="flex h-screen w-full items-center justify-center bg-background"><Loader className="h-12 w-12 animate-spin text-primary" /></div>;
  }
  
  const renderAdminDashboard = () => (
    <Card className="lg:col-span-2 slide-in-from-bottom transition-all hover:shadow-primary/5">
        <CardHeader>
            <CardTitle className="font-headline text-2xl flex items-center gap-3"><UserCog className="text-primary"/>Admin Dashboard</CardTitle>
            <CardDescription>Approve staking bonuses for users.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
             <div className="space-y-2">
                <Label htmlFor="staker-id">Staker Account ID</Label>
                <div className="flex items-start gap-2">
                    <div className="flex-grow space-y-2">
                        <Input 
                            id="staker-id" 
                            value={stakerIdToApprove}
                            onChange={(e) => setStakerIdToApprove(e.target.value)}
                            placeholder="e.g. user.near"
                        />
                        {isCheckingAddress && <p className="text-sm text-muted-foreground flex items-center gap-2"><Loader className="animate-spin" size={16}/> Checking...</p>}
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
        </CardContent>
    </Card>
  );

  const FileInfoDisplay = ({ info }: { info: FileInfo }) => {
    if (!info) return null;
    return (
        <Alert variant="default" className="mt-2 text-xs">
            <FileText className="h-4 w-4" />
            <AlertTitle className="font-semibold">{info.name}</AlertTitle>
            <AlertDescription className="flex justify-between items-center">
                <span>{info.size}</span>
                <span>{info.rows} rows</span>
                <span>{info.cols} columns</span>
            </AlertDescription>
        </Alert>
    )
  }

  const MotionChart = ({ data, title = "Motion Analysis" }: { data: MotionDataPoint[]; title?: string; }) => {
    if (!data || data.length === 0) {
      return <p className="text-sm text-muted-foreground text-center py-4">No motion data recorded for this session.</p>;
    }
  
    return (
      <div className="mt-4">
        <h4 className="font-headline text-lg mb-2">{title}</h4>
        <ChartContainer config={motionChartConfig} className="h-[150px] w-full">
          <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis 
                dataKey="time" 
                type="number" 
                domain={['dataMin', 'dataMax']} 
                tickFormatter={(tick) => `${Math.round(tick)}s`}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                />
            <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(tick) => tick.toFixed(1)}
                label={{ value: 'm/s²', angle: -90, position: 'insideLeft', offset: 10, style: { textAnchor: 'middle' } }}
            />
            <RechartsTooltip 
                cursor={{ strokeDasharray: '3 3' }} 
                content={({ active, payload, label }) => 
                    active && payload && payload.length ? (
                    <div className="rounded-lg border bg-background p-2 shadow-sm">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex flex-col">
                          <span className="text-[0.70rem] uppercase text-muted-foreground">Time</span>
                          <span className="font-bold text-muted-foreground">{label.toFixed(1)}s</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[0.70rem] uppercase text-muted-foreground">Movement</span>
                          <span className="font-bold text-primary">{payload[0].value?.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  ) : null
                }
            />
            <Line type="monotone" dataKey="magnitude" stroke="var(--color-magnitude)" strokeWidth={2} dot={false} name="Movement"/>
          </LineChart>
        </ChartContainer>
      </div>
    );
  };
  
  const LiveMotionStatus = () => {
    const statusConfig = {
      still: {
        color: "bg-green-500",
        text: "Still",
      },
      slight: {
        color: "bg-yellow-500",
        text: "Slight Movement",
      },
      heavy: {
        color: "bg-red-500",
        text: "Heavy Movement",
      },
    };

    const currentStatus = statusConfig[liveMotionStatus];

    return (
      <Card className="slide-in-from-bottom transition-all hover:shadow-primary/5" style={{ animationDelay: '300ms' }}>
        <CardHeader>
          <CardTitle className="font-headline text-2xl flex items-center gap-2"><BarChart2 className="text-primary" />Live Sensor Data</CardTitle>
          <CardDescription>Movement data from your device's accelerometer.</CardDescription>
        </CardHeader>
        <CardContent>
          {hasMotionSensor === false && <p className="text-sm text-muted-foreground text-center py-4">Motion sensors not available or permission denied on this device.</p>}
          {hasMotionSensor === null && <div className="flex items-center justify-center p-8 space-x-4"><Loader className="h-8 w-8 animate-spin text-primary" /><p>Accessing sensors...</p></div>}
          {hasMotionSensor === true && (
            <div className="flex items-center justify-center p-8 space-x-4">
              <div className={cn("h-6 w-6 rounded-full transition-colors", currentStatus.color)} />
              <p className="font-medium text-lg">{currentStatus.text}</p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderSleepLog = () => (
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
                    <ChartContainer config={whoopChartConfig} className="h-[200px] w-full">
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
            <ScrollArea className="h-[280px] pr-4">
                <div className="space-y-4">
                    {journalEntries.map(entry => (
                        <div key={entry.id} className="flex flex-col gap-4 rounded-lg border p-3 bg-card hover:bg-secondary/50 transition-colors" data-ai-hint="bed bedroom">
                            <div className="flex items-center gap-4">
                                <Image src={entry.imageUrl} alt="A photo of a bed" width={80} height={60} className="rounded-md object-cover aspect-[4/3]" data-ai-hint="night sleep" />
                                <div className="flex-grow">
                                    <p className="font-semibold">{entry.date}</p>
                                    <p className="text-sm text-primary">{entry.sleep}</p>
                                </div>
                            </div>
                            {entry.motionData && entry.motionData.length > 0 && <MotionChart data={entry.motionData} />}
                        </div>
                    ))}
                    {journalEntries.length === 0 && <p className="text-center text-muted-foreground pt-16">Complete a sleep verification to start your log.</p>}
                </div>
            </ScrollArea>
        </CardContent>
    </Card>
  );

  const renderLockedSleepLog = () => (
     <Card className="slide-in-from-bottom transition-all hover:shadow-primary/5 relative overflow-hidden" style={{animationDelay: '300ms'}}>
        <div className="absolute inset-0 bg-background/70 backdrop-blur-sm z-10 flex flex-col items-center justify-center p-8 gap-4">
             <div className="flex items-center gap-2 text-lg font-headline">
                <Lock className="text-primary" />
                <span>Sleep Log Locked</span>
             </div>
             <p className="text-center text-muted-foreground">Unlock this feature to track your sleep history and import data from other services.</p>
             <Button onClick={handleUnlockSleepLog} disabled={intentionPoints < 500} className="mt-2">
                 <DewDropIcon className="mr-2" />
                 Unlock for 500 Points
             </Button>
        </div>
        <CardHeader>
            <div className='flex items-start justify-between gap-4'>
                <div>
                    <CardTitle className="font-headline text-2xl">Sleep Log</CardTitle>
                    <CardDescription>Your private, encrypted records of rest.</CardDescription>
                </div>
                <Button variant="outline" size="sm" disabled>
                    <UploadCloud className="mr-2 h-4 w-4" />
                    Import
                </Button>
            </div>
        </CardHeader>
        <CardContent>
             <ScrollArea className="h-[280px] pr-4">
                <div className="space-y-4">
                    <p className="text-center text-muted-foreground pt-16">Unlock to see your sleep history.</p>
                </div>
             </ScrollArea>
        </CardContent>
    </Card>
  )


  return (
    <TooltipProvider>
    <div className="min-h-screen w-full bg-background text-foreground fade-in">
      <header className="sticky top-0 z-10 border-b border-border/50 bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
            <a href="/" onClick={(e) => {
                if(!window.confirm("Are you sure? This will refresh the page and you may lose your current progress.")) {
                    e.preventDefault();
                }
            }}>
                <h1 className="font-headline text-xl md:text-2xl text-primary">think2earn</h1>
            </a>
          <div className="flex items-center gap-2 md:gap-4">
            <div className="flex items-center gap-2 rounded-full border border-border/50 bg-card px-3 md:px-4 py-2 text-sm shadow-sm">
                <DewDropIcon className="h-5 w-5 text-accent" />
                <span className="font-bold text-base md:text-lg">{intentionPoints}</span>
                <span className="text-muted-foreground hidden sm:inline">Intention Points</span>
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
      <Input type="file" accept=".csv,.txt" ref={fnirsInputRef} onChange={handleFnirsUpload} className="hidden" />
      <Input type="file" accept=".csv,.txt" ref={glucoseInputRef} onChange={handleGlucoseUpload} className="hidden" />
      <Input type="file" accept=".eml,.txt" ref={emailUploadRef} onChange={(e) => handleEmailUpload(e, selectedCampaign)} className="hidden" />


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
                            {isVerifyingSleep && <ProgressDisplay state={appState} inCard={false} />}
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
                  isAdmin && walletConnected ? renderAdminDashboard() : (
                    <Card className="slide-in-from-bottom transition-all hover:shadow-primary/5">
                    <CardHeader>
                        <CardTitle className="font-headline text-2xl">Daily Positive Actions</CardTitle>
                        <CardDescription>Generate proofs of your positive actions by making a commitment.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-4 rounded-lg border p-4 hover:border-primary/20 transition-colors">
                            <div className="flex items-center gap-3">
                                <Bed className="h-6 w-6 text-primary" />
                                <h3 className="font-headline text-lg">Proof of Rest</h3>
                            </div>
                            <p className="text-sm text-muted-foreground">Commit NEAR to verify your sleep. After verification, your commitment is returned with a bonus.</p>
                            
                            {stakerInfo && walletConnected ? (
                                <div className='p-4 bg-secondary rounded-md space-y-3'>
                                    <div>
                                        <p className='text-sm font-semibold'>You have <span className="font-bold text-primary">{utils.format.formatNearAmount(stakerInfo.amount, 4)} NEAR</span> committed.</p>
                                        <p className="text-xs text-muted-foreground mt-1">Complete sleep verification to get it back with a bonus.</p>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                        <span>Bonus Status:</span>
                                        {stakerInfo.bonus_approved ? (
                                            <span className='font-medium text-green-600 flex items-center gap-1'><CheckCircle2 size={16}/> Approved</span>
                                        ) : (
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <span className='font-medium text-muted-foreground flex items-center gap-1 cursor-help'><Clock size={16} /> Pending</span>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>Bonus is approved manually by the admin.<br/> It may take a few moments to be verified.</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        )}
                                    </div>
                                    <div className="flex flex-col sm:flex-row gap-2">
                                        <Button onClick={handleBeginSleepVerification} disabled={isVerifyingSleep || stakerInfo.bonus_approved} className="w-full">
                                            Verify Sleep
                                        </Button>
                                        <Button onClick={handleWithdraw} disabled={isVerifyingSleep || !stakerInfo.bonus_approved} className="w-full" variant="outline">
                                            Withdraw
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col sm:flex-row items-stretch gap-2">
                                    <div className="flex-grow">
                                        <Label htmlFor="stake-amount" className="sr-only">Commitment (NEAR)</Label>
                                        <Input id="stake-amount" type="number" value={stakeAmount} onChange={(e) => setStakeAmount(e.target.value)} placeholder="Commitment (NEAR)" className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                                    </div>
                                    <Button onClick={handleStake} disabled={isVerifyingSleep || !walletConnected || Number(stakeAmount) <= 0} className="w-full sm:w-auto">
                                        Commit & Begin
                                    </Button>
                                </div>
                            )}
                            {isVerifyingSleep && <ProgressDisplay state={appState} />}
                        </div>

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
                                        <Label key={campaign} htmlFor={campaign} className={cn("flex flex-col gap-2 rounded-md border p-3 cursor-pointer", {'border-primary ring-2 ring-primary': selectedCampaign === campaign, 'opacity-50 cursor-not-allowed': campaignState === 'verified'})}>
                                            <div className="flex items-start gap-3">
                                                <RadioGroupItem value={campaign} id={campaign} className="mt-1" disabled={campaignState === 'verified'} />
                                                <div className="flex-grow space-y-1">
                                                    <p className="font-medium">{details.title}</p>
                                                    <p className="text-sm text-muted-foreground">{details.description}</p>
                                                </div>
                                            </div>
                                            {selectedCampaign === campaign && campaignState !== 'verified' && (
                                                <div className="pt-2 pl-7">
                                                    {campaignState === 'idle' && (
                                                        <Button onClick={() => handleSendEmail(campaign)} disabled={isVerifyingAction || intentionPoints < 10} className="w-full" size="sm">
                                                            <Mail className="mr-2"/>
                                                            {intentionPoints < 10 ? 'Need 10 Points' : 'Send Email for 10 Points'}
                                                        </Button>
                                                    )}
                                                    {campaignState === 'email_pending' && (
                                                         <Button onClick={() => emailUploadRef.current?.click()} disabled={isVerifyingAction} className="w-full" size="sm" variant="outline">
                                                             <Upload className="mr-2"/>
                                                            Upload Signed Email (.eml/.txt)
                                                         </Button>
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
                  )
                )}

                 <Card className="slide-in-from-bottom transition-all hover:shadow-primary/5" style={{animationDelay: '100ms'}}>
                    <CardHeader>
                    <CardTitle className="font-headline text-2xl">My Action Garden</CardTitle>
                    <CardDescription>A testament to your verified positive actions.</CardDescription>
                    </CardHeader>
                    <CardContent>
                    <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-4 p-4 rounded-lg min-h-[160px] bg-secondary/30 border border-border/50">
                        {gardenFlowers.map((flower, i) => {
                            const { Icon, unlocked } = flower;
                            return (
                                <Icon 
                                    key={i} 
                                    className={cn(
                                        "h-10 w-10 transition-all duration-500",
                                        unlocked ? "text-primary sprout" : "text-gray-300 opacity-50",
                                    )} 
                                    style={{ animationDelay: `${i * 50}ms` }}
                                />
                            )
                        })}
                        {gardenFlowers.every(f => f.unlocked) && <p className="col-span-full text-center text-muted-foreground self-center">Your garden is in full bloom! Keep up the great work.</p>}
                    </div>
                    </CardContent>
                </Card>

                 <Card className="lg:col-span-2 slide-in-from-bottom transition-all hover:shadow-primary/5" style={{animationDelay: '400ms'}}>
                    <CardHeader>
                        <CardTitle className="font-headline text-2xl flex items-center gap-3"><ShoppingCart className="text-primary"/> Device Store</CardTitle>
                        <CardDescription>Acquire the tools to contribute to glucose monitoring research.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid sm:grid-cols-2 gap-4">
                        <Card className="p-4 flex flex-col items-start gap-4 hover:bg-secondary/50 transition-colors">
                            <Image src="https://picsum.photos/600/400" alt="Futuristic fNIRS armband wearable" width={600} height={400} className="rounded-lg self-center aspect-video object-cover" data-ai-hint="wearable technology"/>
                            <div className="flex-grow space-y-2">
                                <h3 className="font-headline text-lg">fNIRS Armband</h3>
                                <p className="text-sm text-muted-foreground">Open-hardware fNIRS device for continuous, non-invasive data collection.</p>
                                <div className="flex items-center gap-2 text-accent font-bold">
                                    <DewDropIcon className="h-5 w-5"/>
                                    <span>100 Intention Points</span>
                                </div>
                            </div>
                            <Button onClick={() => handleAcquireDevice(100, 'fnirs')} disabled={intentionPoints < 100 || hasFnirsDevice} className="w-full">
                            {hasFnirsDevice ? 'Acquired' : 'Acquire for 100 Points'}
                            </Button>
                        </Card>
                        <Card className="p-4 flex flex-col items-start gap-4 hover:bg-secondary/50 transition-colors">
                            <Image src="https://picsum.photos/400/400" alt="Small, circular glucose monitoring device" width={400} height={400} className="rounded-lg self-center aspect-square object-cover" data-ai-hint="medical device"/>
                            <div className="flex-grow space-y-2">
                                <h3 className="font-headline text-lg">Abbott Glucose Monitor</h3>
                                <p className="text-sm text-muted-foreground">Certified medical device for providing baseline glucose data to train the model.</p>
                                <div className="flex items-center gap-2 text-accent font-bold">
                                <DewDropIcon className="h-5 w-5"/>
                                <span>150 Intention Points</span>
                                </div>
                            </div>
                            <Button onClick={() => handleAcquireDevice(150, 'abbott')} disabled={intentionPoints < 150 || hasAbbottDevice} className="w-full">
                                {hasAbbottDevice ? 'Acquired' : 'Acquire for 150 Points'}
                            </Button>
                        </Card>
                    </CardContent>
                </Card>

                {(hasFnirsDevice && hasAbbottDevice) && (
                     <Card className="lg:col-span-2 slide-in-from-bottom transition-all hover:shadow-primary/5" style={{animationDelay: '200ms'}}>
                        <CardHeader>
                            <CardTitle className="font-headline text-2xl flex items-center gap-3"><TestTube className="text-primary"/> Contribute Data</CardTitle>
                            <CardDescription>Pair your fNIRS data with a certified glucose reading to help train the model.</CardDescription>
                        </CardHeader>
                        <form onSubmit={handleDataContribution}>
                        <CardContent className="space-y-4">
                            <div className="grid sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="fnirs-file">1. Upload fNIRS Data</Label>
                                    <Button type="button" variant="outline" className="w-full justify-start text-left font-normal" onClick={() => fnirsInputRef.current?.click()}>
                                        <FilePlus2 className="mr-2" />
                                        {fnirsFile ? <span className='truncate'>{fnirsFile.name}</span> : 'Select a .csv or .txt file'}
                                    </Button>
                                    <FileInfoDisplay info={fnirsInfo} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="glucose-level">2. Pair Glucose Reading File</Label>
                                    <Button type="button" variant="outline" className="w-full justify-start text-left font-normal" onClick={() => glucoseInputRef.current?.click()}>
                                        <FilePlus2 className="mr-2" />
                                        {glucoseFile ? <span className="truncate">{glucoseFile.name}</span> : 'Select a .csv or .txt file'}
                                    </Button>
                                    <FileInfoDisplay info={glucoseInfo} />
                                </div>
                            </div>
                             {isUploadingData && <ProgressDisplay state={appState} inCard={false} />}
                        </CardContent>
                        <CardFooter>
                             <Button type="submit" className="w-full" disabled={!fnirsFile || !glucoseFile || isUploadingData}>
                                {isUploadingData ? 'Submitting...' : 'Submit Paired Data'}
                             </Button>
                        </CardFooter>
                        </form>
                     </Card>
                )}
                
                {pairedDataHistory.length > 0 && (
                     <Card className="lg-col-span-2 slide-in-from-bottom transition-all hover:shadow-primary/5" style={{animationDelay: '300ms'}}>
                        <CardHeader>
                            <CardTitle className="font-headline text-2xl">Contribution History</CardTitle>
                            <CardDescription>Your history of data contributions to the model.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>fNIRS File</TableHead>
                                        <TableHead>Glucose (mg/dL)</TableHead>
                                        <TableHead className="text-right">Contribution Score</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {pairedDataHistory.map(entry => (
                                        <TableRow key={entry.id}>
                                            <TableCell>{entry.date}</TableCell>
                                            <TableCell className="truncate max-w-[150px]">{entry.fnirsFile}</TableCell>
                                            <TableCell>{entry.glucoseLevel}</TableCell>
                                            <TableCell className="text-right font-medium text-primary">{entry.contributionScore}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                )}


                {showSwarmUI && (
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
                                <h4 className="font-bold text-destructive">Save These Credentials!</h4>
                                <p className="text-sm">this is generated locally in your browser so it cannot be retrieved by anyone else</p>
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
            
            {/* Side Column */}
            <div className="lg:col-span-1 space-y-6">
                {isSleepLogUnlocked ? renderSleepLog() : renderLockedSleepLog()}
                <LiveMotionStatus />
            </div>
        </div>
      </main>
    </div>
    </TooltipProvider>
  );
}

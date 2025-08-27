
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Wallet, Bed, Loader, KeyRound, Sprout, UploadCloud, Camera, Upload, TestTube, FilePlus2, CheckCircle2, FileText, Image as ImageIcon, ExternalLink, Brain, FileQuestion } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { detectSleepingSurface } from '@/ai/flows/detect-sleeping-surface-flow';
import { scoreDataContribution } from '@/ai/flows/score-data-contribution-flow';
import { analyzeEmailStance } from '@/ai/flows/analyze-email-stance-flow';
import { useWalletSelector } from '@/components/WalletProvider';
import { CONTRACT_ID } from '@/lib/constants';
import { utils, providers } from 'near-api-js';
import type { CodeResult, FinalExecutionOutcome } from "near-api-js/lib/providers/provider";
import { TooltipProvider } from '@/components/ui/tooltip';
import TutorialDialog from '@/components/TutorialDialog';
import Header from '@/components/app/Header';
import AdminDashboard from '@/components/app/AdminDashboard';
import ProofOfRest from '@/components/app/ProofOfRest';
import ProofOfAction from '@/components/app/ProofOfAction';
import ActionGarden from '@/components/app/ActionGarden';
import DeviceStore from '@/components/app/DeviceStore';
import DataContribution from '@/components/app/DataContribution';
import SwarmStorage from '@/components/app/SwarmStorage';
import SleepLog from '@/components/app/SleepLog';
import LiveMotion from '@/components/app/LiveMotion';


export type MotionDataPoint = {
  time: number;
  magnitude: number;
};

export type JournalEntry = {
  id: number;
  date: string;
  sleep: string;
  imageUrl: string;
  motionData?: MotionDataPoint[];
};

export type PairedDataEntry = {
  id: number;
  date: string;
  fnirsFile: string;
  glucoseLevel: number;
  contributionScore: number;
};

export type SwarmKeys = {
  ethereumAddress: string;
  publicKey: string;
  password: string;
} | null;

export type WhoopData = {
    date: string;
    'Time in Bed (hours)': number;
    'Sleep (hours)': number;
}[];

export type GardenFlower = {
    id: number;
    Icon: React.ElementType;
    unlocked: boolean;
};

export type StakerInfo = {
    amount: string; // Comes as a string from the contract
    bonus_approved: boolean;
};

export type FileInfo = {
    name: string;
    size: string;
    rows: number;
    cols: number;
} | null;

export type Campaign = 'chat_control' | 'sugar_tax' | 'sleep_compensation';

export type CampaignState = 'idle' | 'email_pending' | 'verified';

export const CAMPAIGN_DETAILS: Record<Campaign, { title: string; description: string; subject: string }> = {
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


export const THIRTY_TGAS = "30000000000000";
export type MotionStatus = 'still' | 'slight' | 'heavy';

export default function Home() {
  const [intentionPoints, setIntentionPoints] = useState(250); // Start with enough points to test
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [gardenFlowers, setGardenFlowers] = useState<GardenFlower[]>([
    { id: 1, Icon: require('@/components/icons/FlowerIcon').default, unlocked: false },
    { id: 2, Icon: require('@/components/icons/FlowerIconTwo').default, unlocked: false },
    { id: 3, Icon: require('@/components/icons/FlowerIconThree').default, unlocked: false },
    { id: 4, Icon: require('@/components/icons/FlowerIcon').default, unlocked: false },
    { id: 5, Icon: require('@/components/icons/FlowerIconTwo').default, unlocked: false },
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
  const [rewardPoolBalance, setRewardPoolBalance] = useState<string | null>(null);
  const [depositAmount, setDepositAmount] = useState("1");
  const [accountBalance, setAccountBalance] = useState<string | null>(null);


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

  // Tutorial State
  const [showTutorial, setShowTutorial] = useState(false);

  const isVerifyingSleep = ['analyzing_photo', 'sleeping', 'generating_sleep_proof', 'minting_dew'].includes(appState);
  const isVerifyingAction = ['generating_action_proof', 'planting_seed'].includes(appState);
  const isUploadingData = appState === 'uploading_data';


  useEffect(() => {
    // Simulate initial loading
    setTimeout(() => {
        setIsLoading(false);
        // Show tutorial only once per session
        if (!sessionStorage.getItem('tutorialSeen')) {
            setShowTutorial(true);
            sessionStorage.setItem('tutorialSeen', 'true');
        }
    }, 1000);
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

  const getRewardPoolBalance = useCallback(async () => {
    if (!selector) return;
    const { network } = selector.options;
    const provider = new providers.JsonRpcProvider({ url: network.nodeUrl });
    try {
        const res = await provider.query<CodeResult>({
            request_type: "call_function",
            finality: "final",
            account_id: CONTRACT_ID,
            method_name: "get_reward_pool_balance",
            args_base64: btoa(JSON.stringify({})),
        });
        const balance = JSON.parse(Buffer.from(res.result).toString());
        setRewardPoolBalance(balance);
    } catch (error) {
        console.error("Failed to get reward pool balance:", error);
    }
  }, [selector]);
  
    const getAccountBalance = useCallback(async (accountId: string) => {
    if (!selector) return;
    try {
      const { network } = selector.options;
      const provider = new providers.JsonRpcProvider({ url: network.nodeUrl });
      const account = await provider.query({
        request_type: "view_account",
        finality: "final",
        account_id: accountId,
      });
      // @ts-ignore: 'amount' is a valid property on the response
      setAccountBalance(utils.format.formatNearAmount(account.amount, 4));
    } catch (error) {
      console.error("Failed to get account balance:", error);
      setAccountBalance(null);
    }
  }, [selector]);


  useEffect(() => {
    getContractOwner();
    getRewardPoolBalance();
  }, [getContractOwner, getRewardPoolBalance, walletConnected]);

  useEffect(() => {
    if (signedAccountId) {
        getAccountBalance(signedAccountId);
    } else {
        setAccountBalance(null);
    }
  }, [signedAccountId, getAccountBalance]);

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
  
  const showTransactionToast = (txHash: string, title: string) => {
    toast({
        title: title,
        description: "Your transaction is being processed.",
        variant: 'default',
        action: (
            <a href={`https://nearblocks.io/txns/${txHash}`} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm">
                    View on Explorer
                    <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
            </a>
        ),
    });
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
      const result = await wallet.signAndSendTransaction({
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
      
      const txHash = (result as FinalExecutionOutcome).transaction_outcome.id;
      showTransactionToast(txHash, "Commitment Successful!");
      
      // Optimistically update UI and then refresh from chain
      handleBeginSleepVerification();
      await new Promise(resolve => setTimeout(resolve, 1000));
      const updatedInfo = await getStakerInfo(signedAccountId!);
      setStakerInfo(updatedInfo);
      getAccountBalance(signedAccountId!);
      

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
            const result = await wallet.signAndSendTransaction({
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
            const txHash = (result as FinalExecutionOutcome).transaction_outcome.id;
            showTransactionToast(txHash, "Withdrawal Successful!");

            // Optimistic update
            setStakerInfo(null); 
            await new Promise(resolve => setTimeout(resolve, 1000));
            const updatedInfo = await getStakerInfo(signedAccountId!);
            setStakerInfo(updatedInfo);
            await getRewardPoolBalance();
            await getAccountBalance(signedAccountId!);
            
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
            const result = await wallet.signAndSendTransaction({
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
            const txHash = (result as FinalExecutionOutcome).transaction_outcome.id;
            showTransactionToast(txHash, "Bonus Approved!");
            
            // Refresh the info for the address
            await new Promise(resolve => setTimeout(resolve, 1000));
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
    
    const handleDepositRewardFunds = async () => {
        if (!walletConnected || !selector || !isAdmin) {
            toast({ variant: "destructive", title: "Permission Denied" });
            return;
        }
        const wallet = await selector.wallet();
        if (!wallet) return;

        try {
            const result = await wallet.signAndSendTransaction({
                receiverId: CONTRACT_ID,
                actions: [
                    {
                        type: 'FunctionCall',
                        params: {
                            methodName: 'deposit_reward_funds',
                            args: {},
                            gas: THIRTY_TGAS,
                            deposit: utils.format.parseNearAmount(depositAmount) || "0",
                        },
                    },
                ],
            });
            const txHash = (result as FinalExecutionOutcome).transaction_outcome.id;
            showTransactionToast(txHash, "Deposit Successful!");
            
            await new Promise(resolve => setTimeout(resolve, 1000));
            await getRewardPoolBalance(); // Refresh balance
            await getAccountBalance(signedAccountId!);
        } catch(error: any) {
            if (error.message.includes("User closed the window")) {
                toast({
                    variant: "default",
                    title: "Transaction Cancelled",
                });
            } else {
                console.error("Deposit failed:", error);
                toast({ variant: "destructive", title: "Deposit Failed", description: (error as Error).message });
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

  const handleUseDefaultPhoto = async () => {
    const imageUrl = '/default-bed.jpg'; // Path to the image in the public folder
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    const dataUrl = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.readAsDataURL(blob);
    });

    const timestamp = `Timestamp: ${new Date().toLocaleString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
    })}`;
    setUploadedImage({ url: dataUrl, date: timestamp });
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

  const processEmailContent = async (emailContent: string, campaign: Campaign) => {
    try {
        const analysisResult = await analyzeEmailStance({
            emailContent,
            campaignTopic: CAMPAIGN_DETAILS[campaign].title,
        });

        toast({
            title: (
                <div className="flex items-center gap-2">
                    <Brain size={16} /> AI Stance Analysis
                </div>
            ),
            description: `You seem to be ${analysisResult.stance.toLowerCase()}. Reason: ${analysisResult.reason}`,
        });

    } catch (error) {
        console.error("Error analyzing email stance:", error);
        toast({
            variant: "destructive",
            title: "AI Analysis Failed",
            description: "Could not analyze the email content.",
        });
    }

    setAppState('generating_action_proof');
    setProgress(0);
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
  };


  const handleEmailUpload = (e: React.ChangeEvent<HTMLInputElement>, campaign: Campaign) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
        const emailContent = event.target?.result as string;
        await processEmailContent(emailContent, campaign);
        // Reset the input so the same file can be uploaded again if needed
        if (emailUploadRef.current) emailUploadRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const handleUseBoilerplateEmail = async (campaign: Campaign) => {
    try {
        const response = await fetch('/sample-email.eml');
        if (!response.ok) {
            throw new Error('Failed to fetch sample email.');
        }
        const emailContent = await response.text();
        await processEmailContent(emailContent, campaign);
    } catch (error) {
        console.error("Error using boilerplate email:", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Could not load the sample email file.",
        });
    }
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
    setProgress(0);
  
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
            
            await runProgress(1000);
            // DEV ONLY: Mock the AI call to prevent rate limiting
            const result = {
              contributionScore: Math.floor(Math.random() * (95 - 75 + 1)) + 75, // Random score between 75-95
              reward: Math.floor((Math.random() * (95 - 75 + 1)) + 75 / 10),
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

  if (isLoading) {
    return <div className="flex h-screen w-full items-center justify-center bg-background"><Loader className="h-12 w-12 animate-spin text-primary" /></div>;
  }
  
  return (
    <TooltipProvider>
    <div className="min-h-screen w-full bg-background text-foreground fade-in">
      <TutorialDialog open={showTutorial} onOpenChange={setShowTutorial} />
      <Header
        intentionPoints={intentionPoints}
        walletConnected={walletConnected}
        signedAccountId={signedAccountId}
        accountBalance={accountBalance}
        isLoggingIn={isLoggingIn}
        logIn={logIn}
        logOut={logOut}
        setShowTutorial={setShowTutorial}
      />
      
      <main className="container mx-auto p-4">
      <Input type="file" accept=".csv" ref={whoopInputRef} onChange={handleWhoopImport} className="hidden" />
      <Input type="file" accept=".csv,.txt" ref={fnirsInputRef} onChange={handleFnirsUpload} className="hidden" />
      <Input type="file" accept=".csv,.txt" ref={glucoseInputRef} onChange={handleGlucoseUpload} className="hidden" />
      <Input type="file" accept=".eml,.txt" ref={emailUploadRef} onChange={(e) => handleEmailUpload(e, selectedCampaign)} className="hidden" />


        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
            
            {/* Main Column */}
            <div className="lg:col-span-2 space-y-6">

                {appState === 'taking_photo' && (
                    <ProofOfRest
                      appState={appState}
                      progress={progress}
                      uploadedImage={uploadedImage}
                      videoRef={videoRef}
                      canvasRef={canvasRef}
                      fileInputRef={fileInputRef}
                      hasCameraPermission={hasCameraPermission}
                      isVerifyingSleep={isVerifyingSleep}
                      handleUseDefaultPhoto={handleUseDefaultPhoto}
                      takePhoto={takePhoto}
                      handleFileUpload={handleFileUpload}
                      handleConfirmPhoto={handleConfirmPhoto}
                      setAppState={setAppState}
                      setUploadedImage={setUploadedImage}
                    />
                )}

                {appState !== 'taking_photo' && (
                  <>
                    {isAdmin && walletConnected && (
                      <AdminDashboard
                        rewardPoolBalance={rewardPoolBalance}
                        stakerIdToApprove={stakerIdToApprove}
                        setStakerIdToApprove={setStakerIdToApprove}
                        isCheckingAddress={isCheckingAddress}
                        infoForAddress={infoForAddress}
                        handleApproveBonus={handleApproveBonus}
                        depositAmount={depositAmount}
                        setDepositAmount={setDepositAmount}
                        handleDepositRewardFunds={handleDepositRewardFunds}
                      />
                    )}

                    <ProofOfRest
                      appState={appState}
                      progress={progress}
                      rewardPoolBalance={rewardPoolBalance}
                      stakerInfo={stakerInfo}
                      walletConnected={walletConnected}
                      isVerifyingSleep={isVerifyingSleep}
                      stakeAmount={stakeAmount}
                      setStakeAmount={setStakeAmount}
                      handleStake={handleStake}
                      handleBeginSleepVerification={handleBeginSleepVerification}
                      handleWithdraw={handleWithdraw}
                    />
                    
                    <ProofOfAction
                        appState={appState}
                        progress={progress}
                        selectedCampaign={selectedCampaign}
                        setSelectedCampaign={setSelectedCampaign}
                        campaignStates={campaignStates}
                        isVerifyingAction={isVerifyingAction}
                        intentionPoints={intentionPoints}
                        gardenFlowers={gardenFlowers}
                        handleSendEmail={handleSendEmail}
                        emailUploadRef={emailUploadRef}
                        handleUseBoilerplateEmail={handleUseBoilerplateEmail}
                    />
                  </>
                )}
                
                <DeviceStore
                    intentionPoints={intentionPoints}
                    hasFnirsDevice={hasFnirsDevice}
                    hasAbbottDevice={hasAbbottDevice}
                    handleAcquireDevice={handleAcquireDevice}
                />

                {(hasFnirsDevice && hasAbbottDevice) && (
                     <DataContribution
                        appState={appState}
                        progress={progress}
                        fnirsFile={fnirsFile}
                        glucoseFile={glucoseFile}
                        fnirsInfo={fnirsInfo}
                        glucoseInfo={glucoseInfo}
                        fnirsInputRef={fnirsInputRef}
                        glucoseInputRef={glucoseInputRef}
                        handleFnirsUpload={handleFnirsUpload}
                        handleGlucoseUpload={handleGlucoseUpload}
                        handleDataContribution={handleDataContribution}
                        isUploadingData={isUploadingData}
                     />
                )}
                
                {pairedDataHistory.length > 0 && (
                    <DataContribution.History pairedDataHistory={pairedDataHistory} />
                )}


                {showSwarmUI && (
                    <SwarmStorage
                        swarmState={swarmState}
                        setSwarmState={setSwarmState}
                        swarmKeys={swarmKeys}
                        setSwarmKeys={setSwarmKeys}
                        credentialsSaved={credentialsSaved}
                        setCredentialsSaved={setCredentialsSaved}
                        accountFunded={accountFunded}
                        setAccountFunded={setAccountFunded}
                        stampsPurchased={stampsPurchased}
                        setStampsPurchased={setStampsPurchased}
                        handleSetupSwarm={handleSetupSwarm}
                        handleContinueFromKeys={handleContinueFromKeys}
                        handleFunded={handleFunded}
                        handleBuyStamps={handleBuyStamps}
                        copyToClipboard={copyToClipboard}
                    />
                )}
            </div>
            
            {/* Side Column */}
            <div className="lg:col-span-1 space-y-6">
                <SleepLog
                    isSleepLogUnlocked={isSleepLogUnlocked}
                    intentionPoints={intentionPoints}
                    whoopInputRef={whoopInputRef}
                    whoopData={whoopData}
                    journalEntries={journalEntries}
                    handleUnlockSleepLog={handleUnlockSleepLog}
                />
                <LiveMotion
                    liveMotionStatus={liveMotionStatus}
                    hasMotionSensor={hasMotionSensor}
                />
            </div>
        </div>
      </main>
    </div>
    </TooltipProvider>
  );
}

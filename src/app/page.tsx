'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Wallet, Bed, Loader, KeyRound, Sprout, UploadCloud, Camera, Upload, TestTube, FilePlus2, CheckCircle2, FileText, Image as ImageIcon, ExternalLink, Brain, FileQuestion } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { useWalletSelector } from '@/components/WalletProvider';
import { CONTRACT_ID } from '@/lib/constants';
import { utils, providers } from 'near-api-js';
import type { CodeResult, FinalExecutionOutcome } from "near-api-js/lib/providers/provider";
import { TooltipProvider } from '@/components/ui/tooltip';
import TutorialDialog from '@/components/TutorialDialog';
import Header from '@/components/app/Header';
import ProofOfRest from '@/components/app/ProofOfRest';
import ProofOfAction from '@/components/app/ProofOfAction';
import DeviceStore from '@/components/app/DeviceStore';
import DataContribution from '@/components/app/DataContribution';
import SwarmStorage from '@/components/app/SwarmStorage';
import SleepLog from '@/components/app/SleepLog';
import LiveMotion from '@/components/app/LiveMotion';
import { useIsMobile } from '@/hooks/use-mobile';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

// --- Type Definitions ---
export type MotionDataPoint = { time: number; magnitude: number; };
export type JournalEntry = { id: number; date: string; sleep: string; imageUrl: string; motionData?: MotionDataPoint[]; };
export type PairedDataEntry = { id: number; date: string; fnirsFile: string; glucoseLevel: number; contributionScore: number; };
export type SwarmKeys = { ethereumAddress: string; publicKey: string; password: string; } | null;
export type WhoopData = { date: string; 'Time in Bed (hours)': number; 'Sleep (hours)': number; }[];
export type GardenFlower = { id: number; Icon: React.ElementType; unlocked: boolean; };
export type StakerInfo = { amount: string; bonus_approved: boolean; };
export type FileInfo = { name: string; size: string; rows: number; cols: number; } | null;
export type Campaign = 'chat_control' | 'sugar_tax' | 'sleep_compensation';
export type CampaignState = 'idle' | 'taking_action' | 'email_pending' | 'verified';

export const CAMPAIGN_DETAILS: Record<Campaign, { title: string; description: string; subject: string }> = {
    chat_control: { title: "Stop Chat Control", description: "The EU is working on a law that would monitor all citizens' communications. Voice your opposition to this mass surveillance proposal.", subject: "Regarding the 'Chat Control' Proposal" },
    sugar_tax: { title: "Should sugar be taxed?", description: "Contribute your opinion to the debate on whether a sugar tax is an effective public health policy for combating obesity and related diseases.", subject: "Opinion on Sugar Taxation Policy" },
    sleep_compensation: { title: "Should sleep be compensated?", description: "Argue for or against the idea that adequate sleep, which boosts productivity and reduces errors, should be recognized or compensated by employers.", subject: "The Economic Case for Sleep Compensation" }
};

export const THIRTY_TGAS = "30000000000000";
export type MotionStatus = 'still' | 'slight' | 'heavy';

export default function Home() {
  const [intentionPoints, setIntentionPoints] = useState(250);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [gardenFlowers, setGardenFlowers] = useState<GardenFlower[]>([
    { id: 1, Icon: require('@/components/icons/FlowerIcon').default, unlocked: false }, { id: 2, Icon: require('@/components/icons/FlowerIconTwo').default, unlocked: false }, { id: 3, Icon: require('@/components/icons/FlowerIconThree').default, unlocked: false }, { id: 4, Icon: require('@/components/icons/FlowerIcon').default, unlocked: false }, { id: 5, Icon: require('@/components/icons/FlowerIconTwo').default, unlocked: false },
  ]);
  const [sleepFlowers, setSleepFlowers] = useState<GardenFlower[]>([
    { id: 1, Icon: require('@/components/icons/FlowerIconThree').default, unlocked: false }, { id: 2, Icon: require('@/components/icons/FlowerIcon').default, unlocked: false }, { id: 3, Icon: require('@/components/icons/FlowerIconTwo').default, unlocked: false }, { id: 4, Icon: require('@/components/icons/FlowerIconThree').default, unlocked: false }, { id: 5, Icon: require('@/components/icons/FlowerIcon').default, unlocked: false },
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
  const [stakerInfo, setStakerInfo] = useState<StakerInfo | null>(null);
  const [stakeAmount, setStakeAmount] = useState("0.1");
  const [rewardPoolBalance, setRewardPoolBalance] = useState<string | null>(null);
  const [accountBalance, setAccountBalance] = useState<string | null>(null);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign>('chat_control');
  const [campaignStates, setCampaignStates] = useState<Record<Campaign, CampaignState>>({ chat_control: 'idle', sugar_tax: 'idle', sleep_compensation: 'idle' });
  const emailUploadRef = useRef<HTMLInputElement>(null);
  const [swarmState, setSwarmState] = useState<'idle' | 'generating_keys' | 'keys_generated' | 'funding' | 'buying_stamps' | 'ready_to_upload'>('idle');
  const [swarmKeys, setSwarmKeys] = useState<SwarmKeys>(null);
  const [credentialsSaved, setCredentialsSaved] = useState(false);
  const [accountFunded, setAccountFunded] = useState(false);
  const [stampsPurchased, setStampsPurchased] = useState(false);
  const [showSwarmUI, setShowSwarmUI] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const whoopInputRef = useRef<HTMLInputElement>(null);
  const fnirsInputRef = useRef<HTMLInputElement>(null);
  const glucoseInputRef = useRef<HTMLInputElement>(null);
  const [uploadedImage, setUploadedImage] = useState<{url: string, date: string} | null>(null);
  const [whoopData, setWhoopData] = useState<WhoopData>([]);
  const [fnirsFile, setFnirsFile] = useState<File | null>(null);
  const [glucoseFile, setGlucoseFile] = useState<File | null>(null);
  const [fnirsInfo, setFnirsInfo] = useState<FileInfo>(null);
  const [glucoseInfo, setGlucoseInfo] = useState<FileInfo>(null);
  const [pairedDataHistory, setPairedDataHistory] = useState<PairedDataEntry[]>([]);
  const [motionData, setMotionData] = useState<MotionDataPoint[]>([]);
  const motionStartTimeRef = useRef<number | null>(null);
  const [liveMotionStatus, setLiveMotionStatus] = useState<MotionStatus>('still');
  const [hasMotionSensor, setHasMotionSensor] = useState<boolean|null>(null);
  const motionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [showTutorial, setShowTutorial] = useState(false);
  const isMobile = useIsMobile();

  const isVerifyingSleep = ['analyzing_photo', 'sleeping', 'generating_sleep_proof', 'minting_dew'].includes(appState);
  const isVerifyingAction = ['generating_action_proof', 'planting_seed'].includes(appState);
  const isUploadingData = appState === 'uploading_data';

  useEffect(() => {
    setTimeout(() => {
        setIsLoading(false);
        if (!sessionStorage.getItem('tutorialSeen')) { setShowTutorial(true); sessionStorage.setItem('tutorialSeen', 'true'); }
    }, 1000);
    startLiveMotionTracking();
  }, []);

  const getStakerInfo = useCallback(async (stakerId: string) => {
    if (!selector) return null;
    const { network } = selector.options;
    const provider = new providers.JsonRpcProvider({ url: network.nodeUrl });
    try {
        const res = await provider.query<CodeResult>({ request_type: "call_function", finality: "final", account_id: CONTRACT_ID, method_name: "get_stake_info", args_base64: btoa(JSON.stringify({ staker_id: stakerId })) });
        return JSON.parse(Buffer.from(res.result).toString());
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
        const res = await provider.query<CodeResult>({ request_type: "call_function", finality: "final", account_id: CONTRACT_ID, method_name: "get_reward_pool_balance", args_base64: btoa(JSON.stringify({})) });
        setRewardPoolBalance(JSON.parse(Buffer.from(res.result).toString()));
    } catch (error) {
        console.error("Failed to get reward pool balance:", error);
    }
  }, [selector]);
  
    const getAccountBalance = useCallback(async (accountId: string) => {
    if (!selector) return;
    try {
      const { network } = selector.options;
      const provider = new providers.JsonRpcProvider({ url: network.nodeUrl });
      const account = await provider.query({ request_type: "view_account", finality: "final", account_id: accountId });
      // @ts-ignore
      setAccountBalance(utils.format.formatNearAmount(account.amount, 4));
    } catch (error) {
      console.error("Failed to get account balance:", error);
      setAccountBalance(null);
    }
  }, [selector]);

  useEffect(() => { getRewardPoolBalance(); }, [getRewardPoolBalance, walletConnected]);
  useEffect(() => { if (signedAccountId) { getAccountBalance(signedAccountId); } else { setAccountBalance(null); } }, [signedAccountId, getAccountBalance]);
  useEffect(() => {
    async function fetchUserInfo() {
        if (walletConnected && signedAccountId) { setStakerInfo(await getStakerInfo(signedAccountId)); } else { setStakerInfo(null); }
    }
    fetchUserInfo();
  }, [walletConnected, signedAccountId, getStakerInfo]);
  
  const showTransactionToast = (txHash: string, title: string) => {
    toast({
        title: title, description: "Your transaction is being processed.", variant: 'default',
        action: ( <a href={`https://nearblocks.io/txns/${txHash}`} target="_blank" rel="noopener noreferrer"><Button variant="outline" size="sm">View on Explorer<ExternalLink className="ml-2 h-4 w-4" /></Button></a> ),
    });
  };

  const runProgress = async (duration: number, onComplete?: () => void) => {
    let startTime: number | null = null;
    const animate = (time: number) => {
      if (!startTime) startTime = time;
      const elapsedTime = time - startTime;
      const newProgress = Math.min((elapsedTime / duration) * 100, 100);
      setProgress(newProgress);
      if (elapsedTime < duration) { requestAnimationFrame(animate); } else { setProgress(100); if(onComplete) onComplete(); }
    };
    requestAnimationFrame(animate);
    await new Promise(resolve => setTimeout(resolve, duration));
  };
  
  const handleStake = async () => {
    if (!walletConnected || !selector) { toast({ variant: "destructive", title: "Wallet not connected", description: "Please connect your NEAR wallet to make a commitment." }); return; }
    const wallet = await selector.wallet();
    if (!wallet) { toast({ variant: "destructive", title: "Wallet not connected" }); return; }
    try {
      const result = await wallet.signAndSendTransaction({
        receiverId: CONTRACT_ID,
        actions: [ { type: 'FunctionCall', params: { methodName: 'stake', args: {}, gas: THIRTY_TGAS, deposit: utils.format.parseNearAmount(stakeAmount) || "0" } } ],
      });
      const txHash = (result as FinalExecutionOutcome).transaction_outcome.id;
      showTransactionToast(txHash, "Commitment Successful!");
      setStakerInfo({ amount: utils.format.parseNearAmount(stakeAmount) || '0', bonus_approved: false });
      await new Promise(resolve => setTimeout(resolve, 1000));
      const updatedInfo = await getStakerInfo(signedAccountId!);
      setStakerInfo(updatedInfo);
      getAccountBalance(signedAccountId!);
    } catch (error: any) {
       if (error.message.includes("User closed the window")) { toast({ variant: "default", title: "Transaction Cancelled", description: "You cancelled the transaction in your wallet." }); } 
       else { console.error("Stake failed:", error); toast({ variant: "destructive", title: "Commitment Failed", description: error.message || "An unknown error occurred." }); }
    }
  };
  
  const handleWithdraw = async () => {
    if (!walletConnected || !selector) { toast({ variant: "destructive", title: "Wallet not connected", description: "Please connect your wallet to withdraw." }); return; }
    const wallet = await selector.wallet();
    if (!wallet) { toast({ variant: "destructive", title: "Wallet not connected" }); return; }
    try {
        const result = await wallet.signAndSendTransaction({
            receiverId: CONTRACT_ID,
            actions: [ { type: 'FunctionCall', params: { methodName: 'withdraw', args: {}, gas: THIRTY_TGAS, deposit: "0" } } ],
        });
        const txHash = (result as FinalExecutionOutcome).transaction_outcome.id;
        showTransactionToast(txHash, "Withdrawal Successful!");
        setStakerInfo(null); 
        await new Promise(resolve => setTimeout(resolve, 1000));
        const updatedInfo = await getStakerInfo(signedAccountId!);
        setStakerInfo(updatedInfo);
        await getRewardPoolBalance();
        await getAccountBalance(signedAccountId!);
    } catch (error: any) {
        if (error.message.includes("User closed the window")) { toast({ variant: "default", title: "Transaction Cancelled", description: "You cancelled the transaction in your wallet." }); } 
        else { console.error("Withdrawal failed:", error); toast({ variant: "destructive", title: "Withdrawal Failed", description: error.message || "An unknown error occurred." }); }
    }
  };

  const handleBeginSleepVerification = () => { setUploadedImage(null); setAppState('taking_photo'); };

  const getCameraPermission = useCallback(async () => {
      if(hasCameraPermission === true) return true;
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) { videoRef.current.srcObject = stream; }
        setHasCameraPermission(true);
        return true;
      } catch (error) { console.error('Error accessing camera:', error); setHasCameraPermission(false); return false; }
    },[hasCameraPermission]);

  useEffect(() => { if(appState === 'taking_photo' && !uploadedImage) { getCameraPermission(); } }, [appState, uploadedImage, getCameraPermission]);
  
  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current; const canvas = canvasRef.current; canvas.width = video.videoWidth; canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        const imageUrl = canvas.toDataURL('image/png');
        const timestamp = `Timestamp: ${new Date().toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true })}`;
        const stream = video.srcObject as MediaStream;
        if (stream) { stream.getTracks().forEach(track => track.stop()); }
        video.srcObject = null; setHasCameraPermission(null); setUploadedImage({url: imageUrl, date: timestamp}); return imageUrl;
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
        const formattedDate = lastModifiedDate.toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true });
        setUploadedImage({ url: imageUrl, date: `Timestamp: ${formattedDate}`});
        if(videoRef.current?.srcObject) { const stream = videoRef.current.srcObject as MediaStream; stream.getTracks().forEach(track => track.stop()); videoRef.current.srcObject = null; setHasCameraPermission(null); }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUseDefaultPhoto = async () => {
    const imageUrl = '/default-bed.jpg'; const response = await fetch(imageUrl); const blob = await response.blob();
    const dataUrl = await new Promise<string>((resolve) => { const reader = new FileReader(); reader.onload = (e) => resolve(e.target?.result as string); reader.readAsDataURL(blob); });
    const timestamp = `Timestamp: ${new Date().toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true })}`;
    setUploadedImage({ url: dataUrl, date: timestamp });
  };

  const handleMotion = useCallback((event: DeviceMotionEvent) => {
    if (event.acceleration?.x && event.acceleration?.y && event.acceleration?.z) {
        const { x, y, z } = event.acceleration; const magnitude = Math.sqrt(x*x + y*y + z*z);
        if (motionStartTimeRef.current === null) { motionStartTimeRef.current = Date.now(); }
        const time = (Date.now() - motionStartTimeRef.current) / 1000;
        setMotionData(prevData => [...prevData, { time, magnitude }]);
    }
  }, []);

  const startMotionTracking = useCallback(async () => {
    if (typeof (DeviceMotionEvent as any)?.requestPermission === 'function') {
        try { const permissionState = await (DeviceMotionEvent as any).requestPermission(); if (permissionState === 'granted') { window.addEventListener('devicemotion', handleMotion); } } catch(error) { console.error("DeviceMotionEvent permission request failed", error); toast({variant: "destructive", title: "Motion Sensor Error", description: "Could not get permission to access motion sensors."}) }
    } else { if ('DeviceMotionEvent' in window) { window.addEventListener('devicemotion', handleMotion); } else { toast({title: "Motion Sensors Not Supported", description: "Your device does not support motion tracking."}) } }
  }, [handleMotion, toast]);

  const stopMotionTracking = useCallback(() => { window.removeEventListener('devicemotion', handleMotion); motionStartTimeRef.current = null; }, [handleMotion]);
  
  const handleLiveMotion = useCallback((event: DeviceMotionEvent) => {
    if (event.acceleration?.x && event.acceleration?.y && event.acceleration?.z) {
        const { x, y, z } = event.acceleration; const magnitude = Math.abs(Math.sqrt(x*x + y*y + z*z) - 9.8);
        let newStatus: MotionStatus = 'still';
        if (magnitude > 1.5) { newStatus = 'heavy'; } else if (magnitude > 0.2) { newStatus = 'slight'; }
        setLiveMotionStatus(newStatus);
        if(motionTimeoutRef.current) { clearTimeout(motionTimeoutRef.current); }
        motionTimeoutRef.current = setTimeout(() => { setLiveMotionStatus('still'); }, 1000);
    }
  }, []);

  const startLiveMotionTracking = useCallback(async () => {
    if (hasMotionSensor !== null) return;
    if (typeof (DeviceMotionEvent as any)?.requestPermission === 'function') {
        try { const permissionState = await (DeviceMotionEvent as any).requestPermission(); if (permissionState === 'granted') { setHasMotionSensor(true); window.addEventListener('devicemotion', handleLiveMotion); } else { setHasMotionSensor(false); } } catch(error) { setHasMotionSensor(false); console.error("DeviceMotionEvent permission request failed", error); }
    } else if ('DeviceMotionEvent' in window) { setHasMotionSensor(true); window.addEventListener('devicemotion', handleLiveMotion); } else { setHasMotionSensor(false); }
  }, [handleLiveMotion, hasMotionSensor]);

  const handleConfirmPhoto = async () => {
    let photoUrl = uploadedImage?.url;
    if (!photoUrl) { photoUrl = takePhoto(); }
    if (!photoUrl) { toast({ variant: "destructive", title: "Photo Error", description: "Could not capture a photo." }); return; }

    setAppState('analyzing_photo');
    setProgress(0);
    await runProgress(1000);

    try {
        const agentResponse = await fetch('http://localhost:8000/verify-rest', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ photoDataUri: photoUrl, accountId: signedAccountId })
        });
        if (!agentResponse.ok) { const errorText = await agentResponse.text(); throw new Error(`Agent error: ${agentResponse.status}. ${errorText}`); }
        const result = await agentResponse.json();
        await runProgress(1000);

        if (result.isSleepingSurface) {
            setMotionData([]);
            startMotionTracking();
            setAppState('sleeping');
            await runProgress(3000);
            stopMotionTracking();
            setAppState('generating_sleep_proof');
            await runProgress(2500);
            
            setAppState('minting_dew');
            
            toast({ title: "Verification Successful!", description: "Your bonus is being approved on-chain. The withdraw button will enable shortly.", duration: 8000 });
            
            // Poll for the on-chain state change
            const pollForApproval = async () => {
              if (!signedAccountId) return;
              
              const info = await getStakerInfo(signedAccountId);
              if (info && info.bonus_approved) {
                setStakerInfo(info);
                
                const newPoints = Math.floor(Math.random() * 5) + 5;
                setIntentionPoints(prev => prev + newPoints);
                const newEntry: JournalEntry = { id: Date.now(), date: uploadedImage?.date || new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' }), sleep: `${(newPoints - 0.5).toFixed(1)} hours verified (simulation)`, imageUrl: photoUrl, motionData: [...motionData] };
                setJournalEntries(prev => [newEntry, ...prev]);
                setSleepFlowers(prev => {
                    const firstUnlockedIndex = prev.findIndex(f => !f.unlocked);
                    if (firstUnlockedIndex !== -1) { const newFlowers = [...prev]; newFlowers[firstUnlockedIndex] = { ...newFlowers[firstUnlockedIndex], unlocked: true }; return newFlowers; }
                    return prev;
                });

                setAppState('idle');
                setUploadedImage(null);
                setProgress(0);
                setMotionData([]);
              } else {
                setTimeout(pollForApproval, 2000);
              }
            };
            await runProgress(2000, pollForApproval);

        } else {
            toast({ variant: "destructive", title: "Verification Failed", description: result.reason, duration: 5000 });
            setAppState('taking_photo');
            setUploadedImage(null);
            setProgress(0);
        }
    } catch (error: any) {
        console.error("Error verifying with agent:", error);
        toast({ variant: "destructive", title: "Agent Verification Error", description: "Could not connect to the local verification agent. Is it running? " + (error.message || ""), duration: 7000 });
        setAppState('taking_photo');
        setUploadedImage(null);
        setProgress(0);
    }
  };

  // --- Other handlers (unchanged) ---
  const handleEngageCampaign = (campaign: Campaign) => { /* ... */ };
  const handleSendEmail = (campaign: Campaign) => { /* ... */ };
  const processEmailContent = async (emailContent: string, campaign: Campaign) => { /* ... */ };
  const handleEmailUpload = (e: React.ChangeEvent<HTMLInputElement>, campaign: Campaign) => { /* ... */ };
  const handleUseBoilerplateEmail = async (campaign: Campaign) => { /* ... */ };
  const handleAcquireDevice = (cost: number, device: 'fnirs' | 'abbott') => { /* ... */ };
  const handleUnlockSleepLog = () => { /* ... */ };
  const processFile = (file: File, setInfo: (info: FileInfo) => void) => { /* ... */ };
  const handleFnirsUpload = (event: React.ChangeEvent<HTMLInputElement>) => { /* ... */ };
  const handleGlucoseUpload = (event: React.ChangeEvent<HTMLInputElement>) => { /* ... */ };
  const handleWhoopImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file, null); // Process file for validation
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const csvContent = e.target?.result as string;
          const lines = csvContent.split('\n').filter(line => line.trim() !== '');
          
          if (lines.length < 2) {
            toast({ variant: "destructive", title: "Invalid CSV", description: "The CSV file appears to be empty or invalid." });
            return;
          }

          // Parse CSV headers and data
          const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
          const dateIndex = headers.findIndex(h => h.includes('date') || h.includes('day'));
          const bedTimeIndex = headers.findIndex(h => h.includes('time in bed') || h.includes('bed time'));
          const sleepTimeIndex = headers.findIndex(h => h.includes('sleep') && h.includes('hours'));

          if (dateIndex === -1 || bedTimeIndex === -1 || sleepTimeIndex === -1) {
            toast({ 
              variant: "destructive", 
              title: "Invalid Whoop CSV Format", 
              description: "Could not find required columns: Date, Time in Bed (hours), Sleep (hours)" 
            });
            return;
          }

          const whoopEntries: WhoopData = [];
          for (let i = 1; i < lines.length; i++) {
            const columns = lines[i].split(',');
            if (columns.length > Math.max(dateIndex, bedTimeIndex, sleepTimeIndex)) {
              const date = columns[dateIndex]?.trim();
              const bedTime = parseFloat(columns[bedTimeIndex]?.trim());
              const sleepTime = parseFloat(columns[sleepTimeIndex]?.trim());

              if (date && !isNaN(bedTime) && !isNaN(sleepTime)) {
                whoopEntries.push({
                  date,
                  'Time in Bed (hours)': bedTime,
                  'Sleep (hours)': sleepTime
                });
              }
            }
          }

          if (whoopEntries.length === 0) {
            toast({ variant: "destructive", title: "No Valid Data", description: "No valid sleep data found in the CSV file." });
            return;
          }

          setWhoopData(whoopEntries);
          toast({ 
            title: "Whoop Data Imported!", 
            description: `Successfully imported ${whoopEntries.length} sleep records.` 
          });

        } catch (error) {
          console.error("Error parsing Whoop CSV:", error);
          toast({ 
            variant: "destructive", 
            title: "Import Error", 
            description: "Failed to parse the Whoop CSV file. Please check the format." 
          });
        }
      };
      reader.readAsText(file);
    }
  };
  const handleDataContribution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fnirsFile || !glucoseFile) { toast({ variant: "destructive", title: "Missing Information", description: "Please provide both a fNIRS and a glucose data file." }); return; }
    setAppState('uploading_data'); setProgress(0);
    try {
      const fnirsData = await fnirsFile.text(); const glucoseData = await glucoseFile.text();
      const lines = glucoseData.split('\n').filter(line => line.trim() !== ''); if (lines.length < 2) throw new Error("Glucose CSV has no data rows.");
      const headerLine = lines.find(line => line.toLowerCase().includes('historic glucose') || line.toLowerCase().includes('scan glucose')); if (!headerLine) throw new Error("Could not find required glucose headers in the file.");
      const header = headerLine.split(',').map(h => h.trim().toLowerCase()); const historicIndex = header.findIndex(h => h.includes('historic glucose')); const scanIndex = header.findIndex(h => h.includes('scan glucose'));
      if (historicIndex === -1 && scanIndex === -1) { throw new Error("Neither 'Historic Glucose' nor 'Scan Glucose' column found."); }
      let glucoseValues: number[] = []; const dataLines = lines.slice(lines.indexOf(headerLine) + 1);
      dataLines.forEach(line => { const columns = line.split(','); let valueStr = ''; if (historicIndex !== -1 && columns.length > historicIndex) { valueStr = columns[historicIndex]?.trim(); } if (!valueStr && scanIndex !== -1 && columns.length > scanIndex) { valueStr = columns[scanIndex]?.trim(); } if (valueStr) { const value = parseFloat(valueStr); if (!isNaN(value)) { glucoseValues.push(value); } } });
      if (glucoseValues.length === 0) { throw new Error("No valid numerical glucose values found."); }
      const glucoseValuesMgDl = glucoseValues.map(val => val * 18.0182); const averageGlucose = glucoseValuesMgDl.reduce((sum, val) => sum + val, 0) / glucoseValuesMgDl.length;
      await runProgress(1000);
      const agentResponse = await fetch('http://localhost:8000/score', { 
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fnirsData: fnirsData, glucoseLevel: averageGlucose }) 
      });
      if (!agentResponse.ok) { const errorText = await agentResponse.text(); throw new Error(`Agent error: ${agentResponse.status}. ${errorText}`); }
      const result = await agentResponse.json();
      await runProgress(1000);
      const newEntry: PairedDataEntry = { id: Date.now(), date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }), fnirsFile: fnirsFile.name, glucoseLevel: parseFloat(averageGlucose.toFixed(2)), contributionScore: result.contributionScore };
      setPairedDataHistory(prev => [newEntry, ...prev]); setIntentionPoints(prev => prev + result.reward);
      toast({
        title: "Contribution Scored!",
        description: ( <div> <p>{result.reason} You earned {result.reward} Intention Points.</p> <Accordion type="single" collapsible className="w-full text-xs"> <AccordionItem value="logs"> <AccordionTrigger>View Agent Logs</AccordionTrigger> <AccordionContent> <pre className="text-xs bg-muted p-2 rounded-md max-h-40 overflow-auto"> <code>{result.logs.join('\n')}</code> </pre> </AccordionContent> </AccordionItem> </Accordion> </div> ),
      });
      setFnirsFile(null); setGlucoseFile(null); setFnirsInfo(null); setGlucoseInfo(null);
      if (fnirsInputRef.current) fnirsInputRef.current.value = ''; if (glucoseInputRef.current) glucoseInputRef.current.value = '';
      setAppState('idle'); setProgress(0);
    } catch(error: any) {
      console.error("Error scoring data:", error);
      toast({ variant: "destructive", title: "Agent Scoring Error", description: "Could not connect to local agent. Is it running? " + (error.message || ""), duration: 7000 });
      setAppState('idle'); setProgress(0);
    }
  };
  const handleSetupSwarm = () => { /* ... */ };
  const handleContinueFromKeys = () => { /* ... */ };
  const handleFunded = () => { /* ... */ };
  const handleBuyStamps = () => { /* ... */ };
  const copyToClipboard = (text: string) => { /* ... */ };

  if (isLoading) { return <div className="flex h-screen w-full items-center justify-center bg-background"><Loader className="h-12 w-12 animate-spin text-primary" /></div>; }
  
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
        <div className="grid grid-cols-1 gap-6 lg:gap-8">
            <div className="space-y-6">
                <ProofOfRest
                  appState={appState} progress={progress} rewardPoolBalance={rewardPoolBalance} stakerInfo={stakerInfo}
                  walletConnected={walletConnected} isVerifyingSleep={isVerifyingSleep} stakeAmount={stakeAmount}
                  setStakeAmount={setStakeAmount} handleStake={handleStake} handleWithdraw={handleWithdraw}
                  handleBeginSleepVerification={handleBeginSleepVerification} uploadedImage={uploadedImage} videoRef={videoRef}
                  canvasRef={canvasRef} fileInputRef={fileInputRef} hasCameraPermission={hasCameraPermission} isMobile={isMobile}
                  handleUseDefaultPhoto={handleUseDefaultPhoto} takePhoto={takePhoto} handleFileUpload={handleFileUpload}
                  handleConfirmPhoto={handleConfirmPhoto} setAppState={setAppState} setUploadedImage={setUploadedImage}
                  sleepFlowers={sleepFlowers}
                />
                <ProofOfAction
                    appState={appState} progress={progress} selectedCampaign={selectedCampaign} setSelectedCampaign={setSelectedCampaign}
                    campaignStates={campaignStates} isVerifyingAction={isVerifyingAction} intentionPoints={intentionPoints} gardenFlowers={gardenFlowers}
                    handleEngageCampaign={handleEngageCampaign} handleSendEmail={handleSendEmail} emailUploadRef={emailUploadRef} handleUseBoilerplateEmail={handleUseBoilerplateEmail}
                />
                <DeviceStore intentionPoints={intentionPoints} hasFnirsDevice={hasFnirsDevice} hasAbbottDevice={hasAbbottDevice} handleAcquireDevice={handleAcquireDevice} />
                {(hasFnirsDevice && hasAbbottDevice) && (
                     <DataContribution
                        appState={appState} progress={progress} fnirsFile={fnirsFile} glucoseFile={glucoseFile} fnirsInfo={fnirsInfo} glucoseInfo={glucoseInfo}
                        fnirsInputRef={fnirsInputRef} glucoseInputRef={glucoseInputRef} handleFnirsUpload={handleFnirsUpload} handleGlucoseUpload={handleGlucoseUpload}
                        handleDataContribution={handleDataContribution} isUploadingData={isUploadingData}
                     />
                )}
                {pairedDataHistory.length > 0 && (<DataContribution.History pairedDataHistory={pairedDataHistory} />)}
                {showSwarmUI && (
                    <SwarmStorage
                        swarmState={swarmState} setSwarmState={setSwarmState} swarmKeys={swarmKeys} setSwarmKeys={setSwarmKeys} credentialsSaved={credentialsSaved}
                        setCredentialsSaved={setCredentialsSaved} accountFunded={accountFunded} setAccountFunded={setAccountFunded} stampsPurchased={stampsPurchased}
                        setStampsPurchased={setStampsPurchased} handleSetupSwarm={handleSetupSwarm} handleContinueFromKeys={handleContinueFromKeys}
                        handleFunded={handleFunded} handleBuyStamps={handleBuyStamps} copyToClipboard={copyToClipboard}
                    />
                )}
                 <SleepLog
                    isSleepLogUnlocked={isSleepLogUnlocked} intentionPoints={intentionPoints} whoopInputRef={whoopInputRef} whoopData={whoopData}
                    journalEntries={journalEntries} handleUnlockSleepLog={handleUnlockSleepLog}
                />
                {isMobile && <LiveMotion liveMotionStatus={liveMotionStatus} hasMotionSensor={hasMotionSensor} />}
            </div>
        </div>
      </main>
    </div>
    </TooltipProvider>
  );
}
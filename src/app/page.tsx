'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Wallet, Bed, Mail, Zap, Loader, KeyRound, Sprout, Network } from 'lucide-react';
import DewDropIcon from '@/components/icons/DewDropIcon';
import FlowerIcon from '@/components/icons/FlowerIcon';
import { cn } from '@/lib/utils';

type JournalEntry = {
  id: number;
  date: string;
  sleep: string;
  imageUrl: string;
};

export default function Home() {
  const [walletConnected, setWalletConnected] = useState(false);
  const [dreamDew, setDreamDew] = useState(0);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [gardenFlowers, setGardenFlowers] = useState(0);

  const [isLoading, setIsLoading] = useState(true);
  const [appState, setAppState] = useState<'idle' | 'sleeping' | 'generating_sleep_proof' | 'minting_dew' | 'taking_action' | 'generating_action_proof' | 'planting_seed'>('idle');
  const [progress, setProgress] = useState(0);

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
  
  const runProgress = async (duration: number) => {
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
      }
    };
    requestAnimationFrame(animate);
    await new Promise(resolve => setTimeout(resolve, duration));
  };

  const handleSleepRitual = async () => {
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
      date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' }),
      sleep: `${(newDew - 0.5).toFixed(1)} hours verified`,
      imageUrl: 'https://placehold.co/400x300.png',
    };
    setJournalEntries(prev => [newEntry, ...prev]);

    setAppState('idle');
    setProgress(0);
  };

  const handleCivicAction = async () => {
    setAppState('taking_action');
    await runProgress(2000);
    
    setAppState('generating_action_proof');
    await runProgress(3000);
    
    setAppState('planting_seed');
    await runProgress(1500);

    setGardenFlowers(prev => prev + 1);
    setDreamDew(prev => Math.max(0, prev - 10));

    setAppState('idle');
    setProgress(0);
  };
  
  const getStateDescription = () => {
    switch (appState) {
      case 'sleeping':
        return { icon: <Bed className="animate-pulse" />, text: 'Capturing sleep sensor data...' };
      case 'generating_sleep_proof':
        return { icon: <KeyRound className="animate-spin" />, text: 'Generating ZK-Proof of Rest...' };
      case 'minting_dew':
        return { icon: <Zap className="futuristic-glow" />, text: 'Minting Dream Dew on NEAR...' };
      case 'taking_action':
        return { icon: <Mail />, text: 'Sending secure email...' };
      case 'generating_action_proof':
        return { icon: <KeyRound className="animate-spin" />, text: 'Generating ZK-Proof of Action...' };
      case 'planting_seed':
        return { icon: <Sprout className="sprout" />, text: 'Verifying on Civic Action Registry...' };
      default:
        return { icon: null, text: '' };
    }
  };

  if (isLoading && !walletConnected) {
    return <div className="flex h-screen w-full items-center justify-center"><Loader className="h-12 w-12 animate-spin text-primary" /></div>;
  }

  if (!walletConnected) {
    return (
      <main className="flex min-h-screen w-full items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md fade-in shadow-2xl shadow-primary/10">
          <CardHeader>
            <CardTitle className="font-headline text-3xl text-center">PolliNate: Sovereign Edition</CardTitle>
            <CardDescription className="text-center pt-2">
              The app for verifiable rest and provable action. Own your data, own your garden.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center space-y-4">
            <div className="flex items-center space-x-4 p-4 rounded-lg bg-secondary/50">
                <Network className="h-8 w-8 text-primary" />
                <p>Your garden deed requires a NEAR wallet.</p>
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full" onClick={handleConnectWallet} disabled={isLoading}>
              <Wallet className="mr-2 h-4 w-4" />
              {isLoading ? 'Connecting...' : 'Connect Your Garden Deed'}
            </Button>
          </CardFooter>
        </Card>
      </main>
    );
  }

  return (
    <div className="min-h-screen w-full bg-background text-foreground fade-in">
      <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <h1 className="font-headline text-2xl">PolliNate</h1>
          <div className="flex items-center gap-4 rounded-full border bg-card px-4 py-2 text-sm">
            <div className="flex items-center gap-2">
              <DewDropIcon className="h-5 w-5 text-accent" />
              <span className="font-bold">{dreamDew}</span>
              <span>Dream Dew</span>
            </div>
            <div className="h-6 w-px bg-border" />
            <div className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-primary" />
              <span className="font-mono">think2earn.near</span>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
          
          <Card className="lg:col-span-2 slide-in-from-bottom" style={{'--delay': '100ms'}}>
            <CardHeader>
              <CardTitle className="font-headline text-2xl">My Sovereign Garden</CardTitle>
              <CardDescription>A testament to your verified positive actions.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-4 p-4 rounded-lg min-h-[200px] bg-secondary/30">
                {Array.from({ length: gardenFlowers }).map((_, i) => (
                  <FlowerIcon key={i} className="h-10 w-10 sprout text-primary" style={{ animationDelay: `${i * 50}ms` }}/>
                ))}
                 {gardenFlowers === 0 && <p className="col-span-full text-center text-muted-foreground self-center">Your garden awaits. Plant a seed by taking civic action.</p>}
              </div>
            </CardContent>
          </Card>
          
          <Card className="lg:row-span-2 slide-in-from-bottom" style={{'--delay': '300ms'}}>
            <CardHeader>
              <CardTitle className="font-headline text-2xl">Dream Journal</CardTitle>
              <CardDescription>Your private, encrypted memories of rest.</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[460px] pr-4">
                <div className="space-y-4">
                  {journalEntries.map(entry => (
                    <div key={entry.id} className="flex items-center gap-4 rounded-lg border p-3 bg-card" data-ai-hint="bed bedroom">
                      <Image src={entry.imageUrl} alt="A photo of a bed" width={80} height={60} className="rounded-md" />
                      <div className="flex-grow">
                        <p className="font-semibold">{entry.date}</p>
                        <p className="text-sm text-accent">{entry.sleep}</p>
                      </div>
                    </div>
                  ))}
                  {journalEntries.length === 0 && <p className="text-center text-muted-foreground pt-16">Complete a Sleep Ritual to start your journal.</p>}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2 slide-in-from-bottom" style={{'--delay': '200ms'}}>
            <CardHeader>
              <CardTitle className="font-headline text-2xl">Daily Rituals</CardTitle>
              <CardDescription>Generate proofs of your positive actions.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4 rounded-lg border p-4">
                  <div className="flex items-center gap-3">
                    <Bed className="h-6 w-6 text-primary" />
                    <h3 className="font-headline text-lg">Proof of Rest</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">Commit to rest. Place your phone by your bed, and we'll generate a ZK-Proof of your sleep, minting 'Dream Dew' tokens without compromising your data.</p>
                  <Button onClick={handleSleepRitual} disabled={appState !== 'idle'} className="w-full">
                    {appState === 'idle' ? 'Begin Sleep Ritual' : 'Ritual in Progress...'}
                  </Button>
              </div>

              <div className="space-y-4 rounded-lg border p-4">
                  <div className="flex items-center gap-3">
                    <Mail className="h-6 w-6 text-accent" />
                    <h3 className="font-headline text-lg">Proof of Action</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">Spend 10 Dream Dew to plant a flower in your garden. Use ZK-Email to prove you've contacted a representative, and your anonymous action will be added to the public registry.</p>
                  <Button onClick={handleCivicAction} disabled={appState !== 'idle' || dreamDew < 10} variant="outline" className="w-full">
                    {dreamDew < 10 ? 'Need 10 Dream Dew' : 'Plant a Seed of Action'}
                  </Button>
              </div>

              {appState !== 'idle' && (
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
        </div>
      </main>
    </div>
  );
}

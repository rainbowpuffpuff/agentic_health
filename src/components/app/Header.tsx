
'use client';

import { Button } from '@/components/ui/button';
import DewDropIcon from '@/components/icons/DewDropIcon';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { GraduationCap, Wallet, Loader } from 'lucide-react';

type HeaderProps = {
    intentionPoints: number;
    walletConnected: boolean;
    signedAccountId: string | null;
    accountBalance: string | null;
    isLoggingIn: boolean;
    logIn: () => void;
    logOut: () => Promise<void>;
    setShowTutorial: (show: boolean) => void;
};

export default function Header({
    intentionPoints,
    walletConnected,
    signedAccountId,
    accountBalance,
    isLoggingIn,
    logIn,
    logOut,
    setShowTutorial,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-10 border-b border-border/50 bg-background/80 backdrop-blur-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <a href="/" onClick={(e) => {
          if (!window.confirm("Are you sure? This will refresh the page and you may lose your current progress.")) {
            e.preventDefault();
          }
        }}>
          <h1 className="font-headline text-xl md:text-2xl text-primary">think2earn</h1>
        </a>
        <div className="flex items-center gap-2 md:gap-4">
          <div className="flex items-center gap-2 rounded-full border border-border/50 bg-card px-3 md:px-4 py-1.5 text-sm shadow-sm">
            <DewDropIcon className="h-5 w-5 text-primary" />
            <span className="text-base">{intentionPoints}</span>
            <span className="text-muted-foreground hidden sm:inline">Intention Points</span>
            <Tooltip>
                <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowTutorial(true)}>
                    <GraduationCap className="h-5 w-5 text-muted-foreground hover:text-primary" />
                    <span className="sr-only">Show Tutorial</span>
                </Button>
                </TooltipTrigger>
                <TooltipContent>
                <p>Show Tutorial</p>
                </TooltipContent>
            </Tooltip>
          </div>

          {walletConnected ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 rounded-full border border-border/50 bg-card pl-3 pr-2 md:pl-4 py-1 text-sm shadow-sm">
                <div className='text-right'>
                  <p className="font-mono text-xs md:text-sm truncate max-w-[100px] sm:max-w-none">{signedAccountId}</p>
                  <p className='text-xs text-primary font-semibold'>{accountBalance !== null ? `${accountBalance} NEAR` : <Loader size={12} className="inline-block animate-spin" />}</p>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={logOut}>
                  <Wallet className="h-5 w-5 text-muted-foreground hover:text-primary" />
                  <span className='sr-only'>Logout</span>
                </Button>
              </div>
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
  );
}

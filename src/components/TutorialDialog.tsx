
'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Bed, Scale, BrainCircuit, HeartHandshake, Award, ArrowRight, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import DewDropIcon from './icons/DewDropIcon';

type TutorialDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const tutorialSteps = [
  {
    icon: HeartHandshake,
    title: 'Welcome to think2earn',
    description: "This is a platform that rewards you for actions that improve your well-being and society. Like blockchain validators get paid for securing a network, you can get paid for pro-social actions.",
  },
  {
    icon: Bed,
    title: 'Proof of Rest',
    description: "Commit a small amount of NEAR to verify your sleep using your phone's sensors. A good night's rest is a productive asset. Once verified, your commitment is returned with a bonus from the treasury.",
  },
  {
    icon: Scale,
    title: 'Proof of Action',
    description: "Participate in civic action, like emailing a representative about a new policy. Your verified action contributes to a public good and helps shape the future, earning you rewards.",
  },
  {
    icon: BrainCircuit,
    title: 'Contribute to Science',
    description: "Use your rewards to acquire research devices. By contributing health data (like fNIRS and glucose levels), you help train open-source AI models for non-invasive health monitoring.",
  },
  {
    icon: Award,
    title: 'Earn & Thrive',
    description: 'Every verified action earns you Intention Points. Use them to unlock new features and devices. Do good for yourself and your community, and get rewarded for it.',
  },
];


export default function TutorialDialog({ open, onOpenChange }: TutorialDialogProps) {
  const [step, setStep] = useState(0);
  const currentStep = tutorialSteps[step];

  const handleNext = () => {
    if (step < tutorialSteps.length - 1) {
      setStep(s => s + 1);
    } else {
      onOpenChange(false);
    }
  };

  const handlePrev = () => {
    if (step > 0) {
      setStep(s => s - 1);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-4">
               <currentStep.icon className="h-6 w-6 text-primary animate-in zoom-in-50" key={step} />
            </div>
          <DialogTitle className="text-center font-headline text-2xl">{currentStep.title}</DialogTitle>
          <DialogDescription className="text-center text-base">
            {currentStep.description}
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-center items-center gap-2 my-4">
            {tutorialSteps.map((_, i) => (
                <div key={i} className={cn("h-2 w-2 rounded-full transition-all", i === step ? "w-4 bg-primary" : "bg-muted-foreground/50")} />
            ))}
        </div>

        <DialogFooter className="sm:justify-between flex-row">
            {step > 0 ? (
                <Button variant="ghost" onClick={handlePrev}>
                    <ArrowLeft className="mr-2" />
                    Previous
                </Button>
            ) : <div />}
            
            <Button onClick={handleNext}>
                {step === tutorialSteps.length - 1 ? "Get Started" : "Next"}
                <ArrowRight className="ml-2" />
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

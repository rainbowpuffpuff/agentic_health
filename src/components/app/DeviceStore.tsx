
'use client';

import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShoppingCart } from 'lucide-react';
import DewDropIcon from '@/components/icons/DewDropIcon';

type DeviceStoreProps = {
    intentionPoints: number;
    hasFnirsDevice: boolean;
    hasAbbottDevice: boolean;
    handleAcquireDevice: (cost: number, device: 'fnirs' | 'abbott') => void;
};

export default function DeviceStore({
    intentionPoints,
    hasFnirsDevice,
    hasAbbottDevice,
    handleAcquireDevice,
}: DeviceStoreProps) {
    return (
        <Card className="lg:col-span-2 slide-in-from-bottom transition-all hover:shadow-primary/5" style={{ animationDelay: '400ms' }}>
            <CardHeader>
                <CardTitle className="font-headline text-2xl flex items-center gap-3"><ShoppingCart className="text-primary" /> Device Store</CardTitle>
                <CardDescription>Acquire the tools to contribute to glucose monitoring research.</CardDescription>
            </CardHeader>
            <CardContent className="grid sm:grid-cols-2 gap-4">
                <Card className="p-4 flex flex-col items-start gap-4 hover:bg-secondary/50 transition-colors">
                    <Image src="https://placehold.co/600x400/000000/FFFFFF/png?text=fNIRS+Device" alt="Futuristic fNIRS armband wearable" width={600} height={400} className="rounded-lg self-center aspect-video object-cover" data-ai-hint="futuristic armband" />
                    <div className="flex-grow space-y-2">
                        <h3 className="font-headline text-lg">fNIRS Armband</h3>
                        <p className="text-sm text-muted-foreground">Open-hardware fNIRS device for continuous, non-invasive data collection.</p>
                        <div className="flex items-center gap-2 text-primary font-bold">
                            <DewDropIcon className="h-5 w-5" />
                            <span>100 Intention Points</span>
                        </div>
                    </div>
                    <Button onClick={() => handleAcquireDevice(100, 'fnirs')} disabled={intentionPoints < 100 || hasFnirsDevice} className="w-full">
                        {hasFnirsDevice ? 'Acquired' : 'Acquire for 100 Points'}
                    </Button>
                </Card>
                <Card className="p-4 flex flex-col items-start gap-4 hover:bg-secondary/50 transition-colors">
                    <Image src="https://placehold.co/400x400/000000/FFFFFF/png?text=Glucose+Monitor" alt="Small, circular glucose monitoring device" width={400} height={400} className="rounded-lg self-center aspect-square object-cover" data-ai-hint="medical sensor" />
                    <div className="flex-grow space-y-2">
                        <h3 className="font-headline text-lg">Abbott Glucose Monitor</h3>
                        <p className="text-sm text-muted-foreground">Certified medical device for providing baseline glucose data to train the model.</p>
                        <div className="flex items-center gap-2 text-primary font-bold">
                            <DewDropIcon className="h-5 w-5" />
                            <span>150 Intention Points</span>
                        </div>
                    </div>
                    <Button onClick={() => handleAcquireDevice(150, 'abbott')} disabled={intentionPoints < 150 || hasAbbottDevice} className="w-full">
                        {hasAbbottDevice ? 'Acquired' : 'Acquire for 150 Points'}
                    </Button>
                </Card>
            </CardContent>
        </Card>
    );
}

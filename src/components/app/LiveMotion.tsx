
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader, BarChart2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MotionStatus } from '@/app/page';

type LiveMotionProps = {
    liveMotionStatus: MotionStatus;
    hasMotionSensor: boolean | null;
};

export default function LiveMotion({ liveMotionStatus, hasMotionSensor }: LiveMotionProps) {
    const statusConfig = {
        still: { color: "bg-green-500", text: "Still" },
        slight: { color: "bg-yellow-500", text: "Slight Movement" },
        heavy: { color: "bg-red-500", text: "Heavy Movement" },
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
}


'use client';

import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { UploadCloud, Lock } from 'lucide-react';
import DewDropIcon from '@/components/icons/DewDropIcon';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from "@/components/ui/chart"
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend } from 'recharts';
import type { WhoopData, JournalEntry, MotionDataPoint } from '@/app/page';

const whoopChartConfig = {
    timeInBed: { label: "Time in Bed", color: "hsl(var(--chart-1))" },
    sleep: { label: "Sleep", color: "hsl(var(--chart-2))" },
} satisfies ChartConfig;

const motionChartConfig = {
    magnitude: { label: "Movement", color: "hsl(var(--primary))" },
} satisfies ChartConfig;

type SleepLogProps = {
    isSleepLogUnlocked: boolean;
    intentionPoints: number;
    whoopInputRef: React.RefObject<HTMLInputElement>;
    whoopData: WhoopData;
    journalEntries: JournalEntry[];
    handleUnlockSleepLog: () => void;
};

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
                    <Line type="monotone" dataKey="magnitude" stroke="var(--color-magnitude)" strokeWidth={2} dot={false} name="Movement" />
                </LineChart>
            </ChartContainer>
        </div>
    );
};

const renderSleepLogContent = (whoopData: WhoopData, journalEntries: JournalEntry[]) => (
    <>
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
    </>
);

const LockedSleepLog = ({ handleUnlockSleepLog, intentionPoints }: { handleUnlockSleepLog: () => void; intentionPoints: number }) => (
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
);

export default function SleepLog({
    isSleepLogUnlocked,
    intentionPoints,
    whoopInputRef,
    whoopData,
    journalEntries,
    handleUnlockSleepLog,
}: SleepLogProps) {
    return (
        <Card className="slide-in-from-bottom transition-all hover:shadow-primary/5 relative overflow-hidden" style={{ animationDelay: '300ms' }}>
            {!isSleepLogUnlocked && <LockedSleepLog handleUnlockSleepLog={handleUnlockSleepLog} intentionPoints={intentionPoints} />}
            <CardHeader>
                <div className='flex items-start justify-between gap-4'>
                    <div>
                        <CardTitle className="font-headline text-2xl">Sleep Log</CardTitle>
                        <CardDescription>Your private, encrypted records of rest.</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => whoopInputRef.current?.click()} disabled={!isSleepLogUnlocked}>
                        <UploadCloud className="mr-2 h-4 w-4" />
                        Import
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {isSleepLogUnlocked ? renderSleepLogContent(whoopData, journalEntries) : (
                    <ScrollArea className="h-[280px] pr-4">
                        <div className="space-y-4">
                            <p className="text-center text-muted-foreground pt-16">Unlock to see your sleep history.</p>
                        </div>
                    </ScrollArea>
                )}
            </CardContent>
        </Card>
    );
}


'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { GardenFlower } from '@/app/page';

type ActionGardenProps = {
    gardenFlowers: GardenFlower[];
};

export default function ActionGarden({ gardenFlowers }: ActionGardenProps) {
    return (
        <Card className="slide-in-from-bottom transition-all hover:shadow-primary/5" style={{ animationDelay: '100ms' }}>
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
    );
}



'use client';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TestTube, FilePlus2, UploadCloud, FileText } from 'lucide-react';
import type { FileInfo, PairedDataEntry } from '@/app/page';

type DataContributionProps = {
    appState: string;
    progress: number;
    fnirsFile: File | null;
    glucoseFile: File | null;
    fnirsInfo: FileInfo;
    glucoseInfo: FileInfo;
    fnirsInputRef: React.RefObject<HTMLInputElement>;
    glucoseInputRef: React.RefObject<HTMLInputElement>;
    handleFnirsUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
    handleGlucoseUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
    handleDataContribution: (e: React.FormEvent) => void;
    isUploadingData: boolean;
};

const getStateDescription = (state: string) => {
    if (state === 'uploading_data') {
        return { icon: <UploadCloud className="animate-pulse text-primary" />, text: 'Analyzing and scoring your contribution...' };
    }
    return { icon: null, text: '' };
};

const ProgressDisplay = ({ state, progress }: { state: string; progress: number }) => {
    if (state !== 'uploading_data') return null;
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
    return <div className="mt-4 p-4 bg-secondary/50 rounded-lg">{content}</div>;
};

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
    );
};

const DataContributionHistory = ({ pairedDataHistory }: { pairedDataHistory: PairedDataEntry[] }) => (
    <Card className="lg-col-span-2 slide-in-from-bottom transition-all hover:shadow-primary/5" style={{ animationDelay: '300ms' }}>
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
);

export default function DataContribution({
    appState,
    progress,
    fnirsFile,
    glucoseFile,
    fnirsInfo,
    glucoseInfo,
    fnirsInputRef,
    glucoseInputRef,
    handleFnirsUpload,
    handleGlucoseUpload,
    handleDataContribution,
    isUploadingData,
}: DataContributionProps) {
    return (
        <Card className="lg:col-span-2 slide-in-from-bottom transition-all hover:shadow-primary/5" style={{ animationDelay: '200ms' }}>
            <CardHeader>
                <CardTitle className="font-headline text-2xl flex items-center gap-3"><TestTube className="text-primary" /> Contribute Data</CardTitle>
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
                    {isUploadingData && <ProgressDisplay state={appState} progress={progress} />}
                </CardContent>
                <CardFooter>
                    <Button type="submit" className="w-full" disabled={!fnirsFile || !glucoseFile || isUploadingData}>
                        {isUploadingData ? 'Submitting...' : 'Submit Paired Data'}
                    </Button>
                </CardFooter>
            </form>
        </Card>
    );
}

DataContribution.History = DataContributionHistory;

    
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UploadCloud, FileText, Loader2 } from 'lucide-react';

interface DataPairingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (fnirsFile: File, glucoseFile: File) => Promise<void>;
}

export const DataPairingModal: React.FC<DataPairingModalProps> = ({ isOpen, onClose, onUpload }) => {
  const [fnirsFile, setFnirsFile] = useState<File | null>(null);
  const [glucoseFile, setGlucoseFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFnirsFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFnirsFile(e.target.files[0]);
    }
  };

  const handleGlucoseFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setGlucoseFile(e.target.files[0]);
    }
  };

  const handleUploadClick = async () => {
    if (!fnirsFile || !glucoseFile) return;
    setIsUploading(true);
    await onUpload(fnirsFile, glucoseFile);
    setIsUploading(false);
    // Reset state after upload
    setFnirsFile(null);
    setGlucoseFile(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl">Pair & Upload Data</DialogTitle>
          <DialogDescription>
            Upload your fNIRS and glucose data files to contribute to the model. Both files are required.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="fnirs-file">fNIRS Data File (.csv)</Label>
            <div className="flex items-center gap-2">
                <Input id="fnirs-file" type="file" accept=".csv" onChange={handleFnirsFileChange} className="hidden" />
                <Button variant="outline" onClick={() => document.getElementById('fnirs-file')?.click()} className="w-full justify-start text-left font-normal">
                    <UploadCloud className="mr-2 h-4 w-4" />
                    {fnirsFile ? fnirsFile.name : 'Select fNIRS file'}
                </Button>
                {fnirsFile && <FileText className="h-5 w-5 text-green-500" />}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="glucose-file">Abbott Glucose Data File (.csv)</Label>
            <div className="flex items-center gap-2">
                <Input id="glucose-file" type="file" accept=".csv" onChange={handleGlucoseFileChange} className="hidden" />
                <Button variant="outline" onClick={() => document.getElementById('glucose-file')?.click()} className="w-full justify-start text-left font-normal">
                    <UploadCloud className="mr-2 h-4 w-4" />
                    {glucoseFile ? glucoseFile.name : 'Select Glucose file'}
                </Button>
                {glucoseFile && <FileText className="h-5 w-5 text-green-500" />}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isUploading}>Cancel</Button>
          <Button onClick={handleUploadClick} disabled={!fnirsFile || !glucoseFile || isUploading}>
            {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isUploading ? 'Uploading...' : 'Pair & Upload'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

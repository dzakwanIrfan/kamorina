'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ApprovalDecision } from '@/types/member-application.types';
import { CheckCircle2, XCircle } from 'lucide-react';

interface BulkActionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCount: number;
  onConfirm: (decision: ApprovalDecision, notes?: string) => Promise<void>;
}

export function BulkActionDialog({
  open,
  onOpenChange,
  selectedCount,
  onConfirm,
}: BulkActionDialogProps) {
  const [notes, setNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleConfirm = async (decision: ApprovalDecision) => {
    try {
      setIsProcessing(true);
      await onConfirm(decision, notes.trim() || undefined);
      setNotes('');
      onOpenChange(false);
    } catch (error) {
      // Error handling done in parent
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Proses Pengajuan Secara Massal</DialogTitle>
          <DialogDescription>
            Anda akan memproses {selectedCount} pengajuan. Pilih tindakan yang akan diambil.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="bulk-notes">Catatan (Opsional)</Label>
            <Textarea
              id="bulk-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Tambahkan catatan untuk semua pengajuan..."
              className="mt-2"
              rows={4}
            />
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isProcessing}
          >
            Batal
          </Button>
          <Button
            variant="destructive"
            onClick={() => handleConfirm(ApprovalDecision.REJECTED)}
            disabled={isProcessing}
          >
            <XCircle className="mr-2 h-4 w-4" />
            Tolak Semua
          </Button>
          <Button
            onClick={() => handleConfirm(ApprovalDecision.APPROVED)}
            disabled={isProcessing}
          >
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Setujui Semua
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
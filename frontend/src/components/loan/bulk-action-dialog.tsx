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
import { LoanApprovalDecision } from '@/types/loan.types';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

interface BulkActionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCount: number;
  onConfirm: (decision: LoanApprovalDecision, notes?: string) => Promise<void>;
}

export function BulkActionDialog({
  open,
  onOpenChange,
  selectedCount,
  onConfirm,
}: BulkActionDialogProps) {
  const [notes, setNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleConfirm = async (decision: LoanApprovalDecision) => {
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
          <DialogTitle>Proses Pinjaman Secara Massal</DialogTitle>
          <DialogDescription>
            Anda akan memproses {selectedCount} pinjaman. Pilih tindakan yang akan diambil.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="bulk-notes">Catatan (Opsional)</Label>
            <Textarea
              id="bulk-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Tambahkan catatan untuk semua pinjaman..."
              className="mt-2"
              rows={4}
              disabled={isProcessing}
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
            onClick={() => handleConfirm(LoanApprovalDecision.REJECTED)}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <XCircle className="mr-2 h-4 w-4" />
            )}
            Tolak Semua
          </Button>
          <Button
            onClick={() => handleConfirm(LoanApprovalDecision.APPROVED)}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="mr-2 h-4 w-4" />
            )}
            Setujui Semua
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
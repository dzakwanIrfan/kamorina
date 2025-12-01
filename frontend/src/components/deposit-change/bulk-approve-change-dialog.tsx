'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DepositChangeApprovalDecision } from '@/types/deposit-change.types';

interface BulkApproveChangeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCount: number;
  onConfirm: (decision: DepositChangeApprovalDecision, notes?: string) => Promise<void>;
}

export function BulkApproveChangeDialog({
  open,
  onOpenChange,
  selectedCount,
  onConfirm,
}: BulkApproveChangeDialogProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [notes, setNotes] = useState('');
  const [action, setAction] = useState<DepositChangeApprovalDecision | null>(null);

  const handleSubmit = async (selectedAction: DepositChangeApprovalDecision) => {
    try {
      setIsProcessing(true);
      setAction(selectedAction);
      await onConfirm(selectedAction, notes. trim() || undefined);
      onOpenChange(false);
      setNotes('');
      setAction(null);
    } catch (error) {
      // Error handled in parent
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Proses Massal Perubahan Deposito</DialogTitle>
          <DialogDescription>
            Anda akan memproses {selectedCount} pengajuan perubahan sekaligus
          </DialogDescription>
        </DialogHeader>

        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Pastikan Anda telah mereview semua pengajuan perubahan yang dipilih sebelum memproses. 
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div>
            <Label htmlFor="bulk-notes">Catatan (Opsional)</Label>
            <Textarea
              id="bulk-notes"
              value={notes}
              onChange={(e) => setNotes(e. target.value)}
              placeholder="Tambahkan catatan untuk semua pengajuan..."
              className="mt-2"
              rows={3}
            />
          </div>

          <div className="flex gap-3">
            <Button
              variant="destructive"
              onClick={() => handleSubmit(DepositChangeApprovalDecision.REJECTED)}
              disabled={isProcessing}
              className="flex-1"
            >
              {isProcessing && action === DepositChangeApprovalDecision.REJECTED ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <XCircle className="mr-2 h-4 w-4" />
              )}
              Tolak Semua
            </Button>
            <Button
              onClick={() => handleSubmit(DepositChangeApprovalDecision. APPROVED)}
              disabled={isProcessing}
              className="flex-1"
            >
              {isProcessing && action === DepositChangeApprovalDecision.APPROVED ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="mr-2 h-4 w-4" />
              )}
              Setujui Semua
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
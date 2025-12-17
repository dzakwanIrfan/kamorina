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

interface BulkApproveWithdrawalDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    selectedCount: number;
    onConfirm: (decision: 'APPROVED' | 'REJECTED', notes?: string) => Promise<void>;
}

export function BulkApproveWithdrawalDialog({
    open,
    onOpenChange,
    selectedCount,
    onConfirm,
}: BulkApproveWithdrawalDialogProps) {
    const [isProcessing, setIsProcessing] = useState(false);
    const [notes, setNotes] = useState('');
    const [action, setAction] = useState<'APPROVED' | 'REJECTED' | null>(null);

    const handleSubmit = async () => {
        if (!action) return;

        try {
            setIsProcessing(true);
            await onConfirm(action, notes.trim() || undefined);
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
                    <DialogTitle>Proses Massal Penarikan</DialogTitle>
                    <DialogDescription>
                        Anda akan memproses {selectedCount} penarikan sekaligus
                    </DialogDescription>
                </DialogHeader>

                <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                        Pastikan Anda telah mereview semua penarikan yang dipilih sebelum memproses.
                    </AlertDescription>
                </Alert>

                <div className="space-y-4">
                    <div>
                        <Label htmlFor="bulk-notes">Catatan (Opsional)</Label>
                        <Textarea
                            id="bulk-notes"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Tambahkan catatan untuk semua penarikan..."
                            className="mt-2"
                            rows={3}
                        />
                    </div>

                    <div className="flex gap-3">
                        <Button
                            variant="destructive"
                            onClick={() => {
                                setAction('REJECTED');
                                handleSubmit();
                            }}
                            disabled={isProcessing}
                            className="flex-1"
                        >
                            {isProcessing && action === 'REJECTED' ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <XCircle className="mr-2 h-4 w-4" />
                            )}
                            Tolak Semua
                        </Button>
                        <Button
                            onClick={() => {
                                setAction('APPROVED');
                                handleSubmit();
                            }}
                            disabled={isProcessing}
                            className="flex-1"
                        >
                            {isProcessing && action === 'APPROVED' ? (
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
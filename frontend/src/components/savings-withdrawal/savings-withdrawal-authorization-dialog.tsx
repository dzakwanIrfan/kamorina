'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Calendar as CalendarIcon, Loader2, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface SavingsWithdrawalAuthorizationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    selectedCount: number;
    onConfirm: (authorizationDate: Date | undefined, notes: string) => Promise<void>;
}

export function SavingsWithdrawalAuthorizationDialog({
    open,
    onOpenChange,
    selectedCount,
    onConfirm,
}: SavingsWithdrawalAuthorizationDialogProps) {
    const [date, setDate] = useState<Date | undefined>(new Date());
    const [notes, setNotes] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    const handleSubmit = async () => {
        try {
            setIsProcessing(true);
            await onConfirm(date, notes);
            onOpenChange(false);
            setNotes('');
            setDate(new Date());
        } catch (error) {
            // Error managed by parent
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Otorisasi Pencairan Dana</DialogTitle>
                    <DialogDescription>
                        {selectedCount > 1
                            ? `Anda akan mengotorisasi ${selectedCount} pencairan sekaligus.`
                            : 'Otorisasi pencairan dana ini untuk menyelesaikan transaksi.'}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <Alert>
                        <ShieldCheck className="h-4 w-4" />
                        <AlertDescription>
                            Tindakan ini akan memverifikasi bahwa dana telah dicairkan dan transaksi selesai. Status akan berubah menjadi COMPLETED.
                        </AlertDescription>
                    </Alert>

                    <div className="grid gap-2">
                        <Label>Tanggal Otorisasi</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={'outline'}
                                    className={cn(
                                        'w-full justify-start text-left font-normal',
                                        !date && 'text-muted-foreground'
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {date ? (
                                        format(date, 'PPP', { locale: id })
                                    ) : (
                                        <span>Pilih tanggal</span>
                                    )}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={date}
                                    onSelect={setDate}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="auth-notes">Catatan Otorisasi (Opsional)</Label>
                        <Textarea
                            id="auth-notes"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Catatan otorisasi..."
                            rows={3}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isProcessing}
                    >
                        Batal
                    </Button>
                    <Button onClick={handleSubmit} disabled={isProcessing}>
                        {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Otorisasi & Selesai
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

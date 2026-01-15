'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SavingsWithdrawal } from '@/types/savings-withdrawal.types';
import { Loader2, Calendar, Clock, Banknote, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/format';

const formSchema = z.object({
    disbursementDate: z.date({ error: 'Tanggal wajib diisi' }),
    disbursementTime: z
        .string()
        .regex(/^([0-1][0-9]|2[0-3]):([0-5][0-9])$/, 'Format jam harus HH:mm'),
    notes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface SavingsWithdrawalDisbursementDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    selectedCount: number;
    withdrawal?: SavingsWithdrawal | null;
    onConfirm: (disbursementDate: Date | undefined, disbursementTime: string, notes: string) => Promise<void>;
}

export function SavingsWithdrawalDisbursementDialog({
    open,
    onOpenChange,
    selectedCount,
    withdrawal,
    onConfirm,
}: SavingsWithdrawalDisbursementDialogProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            disbursementDate: new Date(),
            disbursementTime: format(new Date(), 'HH:mm'),
            notes: '',
        },
    });

    const onSubmit = async (data: FormData) => {
        try {
            setIsSubmitting(true);
            await onConfirm(data.disbursementDate, data.disbursementTime, data.notes || '');
            onOpenChange(false);
            form.reset();
        } catch (error) {
            // Error managed by parent
        } finally {
            setIsSubmitting(false);
        }
    };

    const isBulk = selectedCount > 1 || !withdrawal;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Konfirmasi Pencairan Dana</DialogTitle>
                    <DialogDescription>
                        {isBulk
                            ? `Anda akan memproses pencairan untuk ${selectedCount} pengajuan sekaligus.`
                            : 'Masukkan tanggal dan jam transaksi transfer yang sudah dilakukan.'}
                    </DialogDescription>
                </DialogHeader>

                {isBulk ? (
                    <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                            Pastikan transfer dana telah dilakukan sebelum mengonfirmasi.
                        </AlertDescription>
                    </Alert>
                ) : (
                    /* Withdrawal Info */
                    <div className="rounded-lg border p-4 bg-muted/50">
                        <h4 className="font-semibold mb-3">Detail Pencairan</h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-muted-foreground">Nomor Penarikan</p>
                                <p className="font-mono font-semibold">{withdrawal.withdrawalNumber}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">Penerima</p>
                                <p className="font-semibold">{withdrawal.user?.name}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">Jumlah Transfer</p>
                                <div className="flex flex-col">
                                    <p className="font-bold text-green-700">{formatCurrency(withdrawal.netAmount)}</p>
                                    {withdrawal.hasEarlyDepositPenalty && (
                                        <span className="text-xs text-orange-600 flex items-center gap-1">
                                            <AlertTriangle className="h-3 w-3" /> Termasuk Pinalti
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div>
                                <p className="text-muted-foreground">No. Rekening Tujuan</p>
                                <p className="font-mono text-lg font-medium">{withdrawal.user?.employee?.bankAccountNumber || '-'}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">Nama Bank</p>
                                <p className="font-mono text-lg font-medium">{withdrawal.user?.employee?.bankAccountName || '-'}</p>
                            </div>
                        </div>
                    </div>
                )}

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-4">
                        {/* Disbursement Date */}
                        <FormField
                            control={form.control}
                            name="disbursementDate"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>Tanggal Transaksi</FormLabel>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <FormControl>
                                                <Button
                                                    variant="outline"
                                                    className={cn(
                                                        'w-full pl-3 text-left font-normal',
                                                        !field.value && 'text-muted-foreground'
                                                    )}
                                                    disabled={isSubmitting}
                                                >
                                                    {field.value ? (
                                                        format(field.value, 'dd MMMM yyyy', { locale: id })
                                                    ) : (
                                                        <span>Pilih tanggal</span>
                                                    )}
                                                    <Calendar className="ml-auto h-4 w-4 opacity-50" />
                                                </Button>
                                            </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <CalendarComponent
                                                mode="single"
                                                selected={field.value}
                                                onSelect={field.onChange}
                                                disabled={(date) => date > new Date() || date < new Date('1900-01-01')}
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                    <FormDescription>
                                        Tanggal ketika transfer dana dilakukan
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Disbursement Time */}
                        <FormField
                            control={form.control}
                            name="disbursementTime"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Jam Transaksi</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                placeholder="14:30"
                                                className="pl-10"
                                                {...field}
                                                disabled={isSubmitting}
                                            />
                                        </div>
                                    </FormControl>
                                    <FormDescription>
                                        Format: HH:mm (contoh: 14:30)
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Notes */}
                        <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Catatan (Opsional)</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Nomor referensi transfer atau catatan lain..."
                                            rows={3}
                                            {...field}
                                            disabled={isSubmitting}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                disabled={isSubmitting}
                            >
                                Batal
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Konfirmasi Pencairan
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

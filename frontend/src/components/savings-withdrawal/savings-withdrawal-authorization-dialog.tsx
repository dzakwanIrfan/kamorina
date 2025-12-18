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
import { Loader2, Calendar, Clock, ShieldCheck, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/format';

const formSchema = z.object({
    authorizationDate: z.date({ error: 'Tanggal wajib diisi' }),
    authorizationTime: z
        .string()
        .regex(/^([0-1][0-9]|2[0-3]):([0-5][0-9])$/, 'Format jam harus HH:mm'),
    notes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface SavingsWithdrawalAuthorizationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    selectedCount: number;
    withdrawal?: SavingsWithdrawal | null;
    onConfirm: (authorizationDate: Date | undefined, authorizationTime: string, notes: string) => Promise<void>;
}

export function SavingsWithdrawalAuthorizationDialog({
    open,
    onOpenChange,
    selectedCount,
    withdrawal,
    onConfirm,
}: SavingsWithdrawalAuthorizationDialogProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            authorizationDate: new Date(),
            authorizationTime: format(new Date(), 'HH:mm'),
            notes: '',
        },
    });

    const onSubmit = async (data: FormData) => {
        try {
            setIsSubmitting(true);
            await onConfirm(data.authorizationDate, data.authorizationTime, data.notes || '');
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
                    <DialogTitle>Otorisasi Pencairan Dana</DialogTitle>
                    <DialogDescription>
                        {isBulk
                            ? `Anda akan mengotorisasi ${selectedCount} pencairan sekaligus.`
                            : 'Masukkan tanggal dan jam otorisasi untuk menyelesaikan transaksi.'}
                    </DialogDescription>
                </DialogHeader>

                {isBulk ? (
                    <Alert>
                        <ShieldCheck className="h-4 w-4" />
                        <AlertDescription>
                            Tindakan ini akan memverifikasi bahwa dana telah dicairkan dan transaksi selesai. Status akan berubah menjadi COMPLETED.
                        </AlertDescription>
                    </Alert>
                ) : (
                    <>
                        {/* Withdrawal Info */}
                        <div className="rounded-lg border p-4 bg-muted/50">
                            <h4 className="font-semibold mb-3">Detail Penarikan</h4>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-muted-foreground">Nomor Penarikan</p>
                                    <p className="font-mono font-semibold">{withdrawal.withdrawalNumber}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Pemohon</p>
                                    <p className="font-semibold">{withdrawal.user?.name}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Jumlah Transfer</p>
                                    <p className="font-bold text-green-700">{formatCurrency(withdrawal.netAmount)}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">No. Rekening</p>
                                    <p className="font-mono">{withdrawal.bankAccountNumber || withdrawal.user?.bankAccountNumber || '-'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Disbursement Info */}
                        {withdrawal.disbursement && (
                            <div className="rounded-lg border border-green-200 bg-green-50 dark:bg-green-950/30 p-4 mt-4">
                                <h4 className="font-semibold mb-3 text-green-900 dark:text-green-300">
                                    Info Pencairan (Shopkeeper)
                                </h4>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p className="text-muted-foreground">Diproses Oleh</p>
                                        <div className="flex items-center gap-2 font-medium">
                                            <User className="h-3 w-3" />
                                            {withdrawal.disbursement.processedByUser?.name || '-'}
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Waktu Transaksi</p>
                                        <p className="font-mono font-semibold">
                                            {format(new Date(withdrawal.disbursement.disbursementDate), 'dd/MM/yyyy')}
                                            {/* Note: If disbursementTime is added to API response later, display it here too */}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-4">
                        {/* Authorization Date */}
                        <FormField
                            control={form.control}
                            name="authorizationDate"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>Tanggal Otorisasi</FormLabel>
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
                                        Tanggal ketika otorisasi dilakukan
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Authorization Time */}
                        <FormField
                            control={form.control}
                            name="authorizationTime"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Jam Otorisasi</FormLabel>
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
                                            placeholder="Tambahkan catatan jika diperlukan..."
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
                                Otorisasi & Selesai
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

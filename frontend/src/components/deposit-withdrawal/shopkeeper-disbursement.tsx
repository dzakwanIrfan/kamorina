'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Banknote, Calendar as CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { id } from 'date-fns/locale';

import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { DepositWithdrawal } from '@/types/deposit-withdrawal.types';
import { depositWithdrawalService } from '@/services/deposit-withdrawal.service';
import { handleApiError } from '@/lib/axios';
import { formatCurrency } from '@/lib/format';

interface ShopkeeperDisbursementDialogProps {
    withdrawal: DepositWithdrawal | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

export function ShopkeeperDisbursementDialog({
    withdrawal,
    open,
    onOpenChange,
    onSuccess,
}: ShopkeeperDisbursementDialogProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const formSchema = z.object({
        transactionDate: z.date({
            error: 'Tanggal transaksi harus diisi',
        }),
        notes: z.string().optional(),
    });

    type FormData = z.infer<typeof formSchema>;

    const form = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            transactionDate: new Date(),
            notes: '',
        },
    });

    const onSubmit = async (data: FormData) => {
        if (!withdrawal) return;

        try {
            setIsSubmitting(true);

            await depositWithdrawalService.confirmDisbursement(withdrawal.id, {
                transactionDate: format(data.transactionDate, 'yyyy-MM-dd'),
                notes: data.notes || undefined,
            });

            toast.success('Pencairan berhasil dikonfirmasi!');
            onSuccess?.();
            onOpenChange(false);
            form.reset();
        } catch (error) {
            toast.error(handleApiError(error));
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!withdrawal) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>Konfirmasi Pencairan Dana</DialogTitle>
                    <DialogDescription>
                        Konfirmasi bahwa transaksi pencairan telah dilakukan
                    </DialogDescription>
                </DialogHeader>

                <div className="rounded-lg border p-4 space-y-2 bg-muted/50">
                    <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Nomor Penarikan:</span>
                        <span className="font-mono font-medium">{withdrawal.withdrawalNumber}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Nama:</span>
                        <span className="font-medium">{withdrawal.user?.name}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Jumlah Ditransfer:</span>
                        <span className="text-lg font-bold text-green-600">
                            {formatCurrency(withdrawal.netAmount)}
                        </span>
                    </div>
                    {withdrawal.bankAccountNumber && (
                        <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Rekening:</span>
                            <span className="font-mono font-medium">{withdrawal.bankAccountNumber}</span>
                        </div>
                    )}
                </div>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="transactionDate"
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
                                                >
                                                    {field.value ? (
                                                        format(field.value, 'dd MMMM yyyy', { locale: id })
                                                    ) : (
                                                        <span>Pilih tanggal</span>
                                                    )}
                                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                </Button>
                                            </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={field.value}
                                                onSelect={field.onChange}
                                                disabled={(date) =>
                                                    date > new Date() || date < new Date('1900-01-01')
                                                }
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                    <FormDescription>
                                        Tanggal saat transaksi dilakukan
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Catatan (Opsional)</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Tambahkan catatan transaksi..."
                                            rows={3}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="flex gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                disabled={isSubmitting}
                                className="flex-1"
                            >
                                Batal
                            </Button>
                            <Button type="submit" disabled={isSubmitting} className="flex-1">
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {!isSubmitting && <Banknote className="mr-2 h-4 w-4" />}
                                Konfirmasi Pencairan
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

// KETUA AUTHORIZATION COMPONENT

interface KetuaAuthorizationDialogProps {
    withdrawal: DepositWithdrawal | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

export function KetuaAuthorizationDialog({
    withdrawal,
    open,
    onOpenChange,
    onSuccess,
}: KetuaAuthorizationDialogProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const formSchema = z.object({
        authorizationDate: z.date({
            error: 'Tanggal otorisasi harus diisi',
        }),
        notes: z.string().optional(),
    });

    type FormData = z.infer<typeof formSchema>;

    const form = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            authorizationDate: new Date(),
            notes: '',
        },
    });

    const onSubmit = async (data: FormData) => {
        if (!withdrawal) return;

        try {
            setIsSubmitting(true);

            await depositWithdrawalService.confirmAuthorization(withdrawal.id, {
                authorizationDate: format(data.authorizationDate, 'yyyy-MM-dd'),
                notes: data.notes || undefined,
            });

            toast.success('Otorisasi berhasil dikonfirmasi! Penarikan selesai.');
            onSuccess?.();
            onOpenChange(false);
            form.reset();
        } catch (error) {
            toast.error(handleApiError(error));
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!withdrawal) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>Otorisasi Final Penarikan</DialogTitle>
                    <DialogDescription>
                        Berikan otorisasi final untuk menyelesaikan proses penarikan
                    </DialogDescription>
                </DialogHeader>

                <div className="rounded-lg border p-4 space-y-2 bg-muted/50">
                    <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Nomor Penarikan:</span>
                        <span className="font-mono font-medium">{withdrawal.withdrawalNumber}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Nama:</span>
                        <span className="font-medium">{withdrawal.user?.name}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Jumlah:</span>
                        <span className="text-lg font-bold text-green-600">
                            {formatCurrency(withdrawal.netAmount)}
                        </span>
                    </div>
                    {withdrawal.disbursement && (
                        <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Diproses oleh:</span>
                            <span className="font-medium">
                                {withdrawal.disbursement.processedByUser.name}
                            </span>
                        </div>
                    )}
                </div>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                                                >
                                                    {field.value ? (
                                                        format(field.value, 'dd MMMM yyyy', { locale: id })
                                                    ) : (
                                                        <span>Pilih tanggal</span>
                                                    )}
                                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                </Button>
                                            </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={field.value}
                                                onSelect={field.onChange}
                                                disabled={(date) =>
                                                    date > new Date() || date < new Date('1900-01-01')
                                                }
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                    <FormDescription>
                                        Tanggal otorisasi final
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Catatan (Opsional)</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Tambahkan catatan otorisasi..."
                                            rows={3}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="flex gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                disabled={isSubmitting}
                                className="flex-1"
                            >
                                Batal
                            </Button>
                            <Button type="submit" disabled={isSubmitting} className="flex-1">
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Otorisasi Selesai
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
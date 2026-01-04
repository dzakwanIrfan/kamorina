'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { Loader2, AlertTriangle, Info, TrendingDown, Wallet } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { savingsWithdrawalService } from '@/services/savings-withdrawal.service';
import { useBukuTabungan } from '@/hooks/use-buku-tabungan';
import { handleApiError } from '@/lib/axios';
import { formatCurrency } from '@/lib/format';

interface SavingsWithdrawalFormProps {
    onSuccess: () => void;
    onCancel?: () => void;
}

export function SavingsWithdrawalForm({ onSuccess, onCancel }: SavingsWithdrawalFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [penaltyCalculation, setPenaltyCalculation] = useState<{
        hasEarlyDepositPenalty: boolean;
        penaltyRate: number;
        penaltyAmount: number;
        netAmount: number;
    } | null>(null);

    const { tabungan } = useBukuTabungan({ includeTransactionSummary: true });

    const formSchema = z.object({
        withdrawalAmount: z.string().min(1, 'Jumlah penarikan harus diisi'),
        bankAccountNumber: z.string().optional(),
        notes: z.string().optional(),
    });

    type FormData = z.infer<typeof formSchema>;

    const form = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            withdrawalAmount: '',
            bankAccountNumber: '',
            notes: '',
        },
    });

    const watchAmount = form.watch('withdrawalAmount');

    const availableBalance = Number(tabungan?.summary.saldoSukarela || 0);

    // Simulate penalty calculation (will be calculated by backend, but we show preview)
    useEffect(() => {
        if (watchAmount) {
            const amount = parseFloat(watchAmount);
            if (amount > 0) {
                // This is just a preview - actual calculation done by backend
                // For now, show 3% penalty if amount is entered
                const penaltyRate = 3;
                const penaltyAmount = (amount * penaltyRate) / 100;
                const netAmount = amount - penaltyAmount;

                setPenaltyCalculation({
                    hasEarlyDepositPenalty: true, // We don't know yet, backend will check
                    penaltyRate,
                    penaltyAmount,
                    netAmount,
                });
            } else {
                setPenaltyCalculation(null);
            }
        } else {
            setPenaltyCalculation(null);
        }
    }, [watchAmount]);

    const onSubmit = async (data: FormData) => {
        try {
            setIsSubmitting(true);

            const withdrawalAmount = parseFloat(data.withdrawalAmount);

            // Validate amount
            if (withdrawalAmount <= 0) {
                toast.error('Jumlah penarikan harus lebih dari 0');
                return;
            }

            if (withdrawalAmount < 1000) {
                toast.error('Jumlah penarikan minimal Rp 1.000');
                return;
            }

            if (withdrawalAmount > availableBalance) {
                toast.error('Jumlah penarikan melebihi saldo yang tersedia');
                return;
            }

            const result = await savingsWithdrawalService.createWithdrawal({
                withdrawalAmount,
                bankAccountNumber: data.bankAccountNumber || undefined,
                notes: data.notes || undefined,
            });

            toast.success('Pengajuan penarikan tabungan berhasil disubmit!');

            // Show calculation info
            if (result.calculation.hasEarlyDepositPenalty) {
                toast.info(
                    `Pinalti ${result.calculation.penaltyRate}% diterapkan karena ada deposito yang belum jatuh tempo. Yang diterima: ${formatCurrency(result.calculation.netAmount)}`
                );
            }

            onSuccess();
        } catch (error) {
            toast.error(handleApiError(error));
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!tabungan) {
        return (
            <Card className="w-full max-w-3xl mx-auto">
                <CardContent className="pt-6">
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="w-full max-w-3xl mx-auto">
            <CardHeader>
                <CardTitle>Formulir Penarikan Tabungan</CardTitle>
                <CardDescription>
                    Isi formulir di bawah untuk mengajukan penarikan tabungan Anda
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        {/* Saldo Info */}
                        <Alert>
                            <Wallet className="h-4 w-4" />
                            <AlertTitle>Tabungan Deposito Anda</AlertTitle>
                            <AlertDescription>
                                <span className="text-lg font-bold text-primary">
                                    {formatCurrency(availableBalance)}
                                </span>
                                <p className="text-xs mt-1">
                                    Saldo yang dapat Anda tarik saat ini
                                </p>
                            </AlertDescription>
                        </Alert>

                        {/* Summary Tabungan */}
                        <div className="rounded-lg border p-4 space-y-3 bg-muted/50">
                            <h3 className="font-semibold text-sm">Ringkasan Tabungan</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                <div>
                                    <p className="text-muted-foreground">Saldo Pokok</p>
                                    <p className="font-medium">{formatCurrency(Number(tabungan.summary.saldoPokok))}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Saldo Wajib</p>
                                    <p className="font-medium">{formatCurrency(Number(tabungan.summary.saldoWajib))}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Saldo Tabungan Deposito</p>
                                    <p className="font-bold text-primary">
                                        {formatCurrency(Number(tabungan.summary.saldoSukarela))}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Bunga Deposito</p>
                                    <p className="font-medium">{formatCurrency(Number(tabungan.summary.bungaDeposito))}</p>
                                </div>
                            </div>
                        </div>

                        {/* Withdrawal Amount */}
                        <FormField
                            control={form.control}
                            name="withdrawalAmount"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Jumlah Penarikan</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            placeholder="Masukkan jumlah yang ingin ditarik"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        Minimal Rp 1.000 - Maksimal: {formatCurrency(availableBalance)}
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Penalty Warning & Calculation Preview */}
                        {penaltyCalculation && parseFloat(watchAmount) > 0 && (
                            <div className="rounded-lg border p-4 space-y-3 border-orange-500 bg-orange-50 dark:bg-orange-950/20">
                                <div className="flex items-center gap-2">
                                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                                    <h3 className="font-semibold text-orange-900 dark:text-orange-100">
                                        Informasi Penting
                                    </h3>
                                </div>
                                <p className="text-sm text-orange-800 dark:text-orange-200">
                                    Jika Anda memiliki deposito yang belum jatuh tempo, akan dikenakan pinalti 3% dari jumlah penarikan.
                                </p>
                                <Separator />
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Jumlah Penarikan:</span>
                                        <span className="font-medium">
                                            {formatCurrency(parseFloat(watchAmount))}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-orange-600">
                                        <span>Potensi Pinalti (3%):</span>
                                        <span className="font-medium flex items-center gap-1">
                                            <TrendingDown className="h-3 w-3" />
                                            - {formatCurrency(penaltyCalculation.penaltyAmount)}
                                        </span>
                                    </div>
                                    <Separator />
                                    <div className="flex justify-between text-base font-bold">
                                        <span>Estimasi Diterima:</span>
                                        <span className="text-green-600">
                                            {formatCurrency(penaltyCalculation.netAmount)}
                                        </span>
                                    </div>
                                    <p className="text-xs text-muted-foreground italic">
                                        * Jumlah pinalti akan dihitung otomatis oleh sistem saat pengajuan
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Bank Account */}
                        <FormField
                            control={form.control}
                            name="bankAccountNumber"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nomor Rekening Bank (Opsional)</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Nomor rekening tujuan transfer"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        Kosongkan jika menggunakan rekening yang terdaftar
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
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Info Alert */}
                        <Alert>
                            <Info className="h-4 w-4" />
                            <AlertTitle>Informasi Penting</AlertTitle>
                            <AlertDescription className="text-xs space-y-1.5">
                                <ul className="list-disc list-inside space-y-1">
                                    <li>Pengajuan akan melalui proses approval: DSP → Ketua → Shopkeeper → Ketua (Otorisasi)</li>
                                    <li>Jika Anda memiliki deposito yang belum jatuh tempo, akan dikenakan pinalti 3%</li>
                                    <li>Dana akan ditransfer setelah semua tahap approval selesai</li>
                                    <li>Proses approval biasanya memakan waktu 1-3 hari kerja</li>
                                </ul>
                            </AlertDescription>
                        </Alert>

                        {/* Actions */}
                        <div className="flex gap-3">
                            {onCancel && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={onCancel}
                                    disabled={isSubmitting}
                                    className="flex-1"
                                >
                                    Batal
                                </Button>
                            )}
                            <Button
                                type="submit"
                                disabled={isSubmitting || availableBalance <= 0}
                                className="flex-1"
                            >
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Submit Pengajuan
                            </Button>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
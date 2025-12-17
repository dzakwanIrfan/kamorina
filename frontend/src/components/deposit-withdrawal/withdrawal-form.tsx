'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { Loader2, AlertTriangle, Info, TrendingDown, Wallet } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { depositService } from '@/services/deposit.service';
import { depositWithdrawalService } from '@/services/deposit-withdrawal.service';
import { useBukuTabungan } from '@/hooks/use-buku-tabungan';
import { handleApiError } from '@/lib/axios';
import { DepositStatus } from '@/types/deposit.types';
import { formatCurrency } from '@/lib/format';

interface WithdrawalFormProps {
    onSuccess: () => void;
    onCancel?: () => void;
}

export function WithdrawalForm({ onSuccess, onCancel }: WithdrawalFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoadingDeposits, setIsLoadingDeposits] = useState(true);
    const [activeDeposits, setActiveDeposits] = useState<any[]>([]);
    const [selectedDeposit, setSelectedDeposit] = useState<any | null>(null);
    const [penaltyCalculation, setPenaltyCalculation] = useState<{
        isEarly: boolean;
        penaltyRate: number;
        penaltyAmount: number;
        netAmount: number;
    } | null>(null);

    const { tabungan } = useBukuTabungan({ includeTransactionSummary: true });

    const formSchema = z.object({
        depositApplicationId: z.string().min(1, 'Pilih deposito yang ingin ditarik'),
        withdrawalAmount: z.string().min(1, 'Jumlah penarikan harus diisi'),
        bankAccountNumber: z.string().optional(),
        notes: z.string().optional(),
    });

    type FormData = z.infer<typeof formSchema>;

    const form = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            depositApplicationId: '',
            withdrawalAmount: '',
            bankAccountNumber: '',
            notes: '',
        },
    });

    const watchDepositId = form.watch('depositApplicationId');
    const watchAmount = form.watch('withdrawalAmount');

    // Fetch active deposits
    useEffect(() => {
        const fetchDeposits = async () => {
            try {
                setIsLoadingDeposits(true);
                const response = await depositService.getMyDeposits({
                    status: DepositStatus.ACTIVE,
                    limit: 100,
                });

                // Filter deposits yang memiliki collected amount > 0
                const depositsWithBalance = response.data.filter(
                    (d) => d.collectedAmount > 0
                );

                setActiveDeposits(depositsWithBalance);
            } catch (error) {
                toast.error(handleApiError(error));
            } finally {
                setIsLoadingDeposits(false);
            }
        };

        fetchDeposits();
    }, []);

    // Update selected deposit info
    useEffect(() => {
        if (watchDepositId) {
            const deposit = activeDeposits.find((d) => d.id === watchDepositId);
            setSelectedDeposit(deposit || null);

            // Set max amount yang bisa ditarik
            if (deposit) {
                form.setValue('withdrawalAmount', deposit.collectedAmount.toString());
            }
        } else {
            setSelectedDeposit(null);
            setPenaltyCalculation(null);
        }
    }, [watchDepositId, activeDeposits]);

    // Calculate penalty when amount changes
    useEffect(() => {
        if (selectedDeposit && watchAmount) {
            const amount = parseFloat(watchAmount);
            if (amount > 0) {
                const now = new Date();
                const maturityDate = selectedDeposit.maturityDate
                    ? new Date(selectedDeposit.maturityDate)
                    : null;

                let isEarly = false;
                let penaltyRate = 0;
                let penaltyAmount = 0;

                if (maturityDate && now < maturityDate) {
                    isEarly = true;
                    penaltyRate = 3; // 3% penalty
                    penaltyAmount = (amount * penaltyRate) / 100;
                }

                const netAmount = amount - penaltyAmount;

                setPenaltyCalculation({
                    isEarly,
                    penaltyRate,
                    penaltyAmount,
                    netAmount,
                });
            } else {
                setPenaltyCalculation(null);
            }
        }
    }, [selectedDeposit, watchAmount]);

    const onSubmit = async (data: FormData) => {
        try {
            setIsSubmitting(true);

            const withdrawalAmount = parseFloat(data.withdrawalAmount);

            // Validate amount
            if (withdrawalAmount <= 0) {
                toast.error('Jumlah penarikan harus lebih dari 0');
                return;
            }

            if (selectedDeposit && withdrawalAmount > selectedDeposit.collectedAmount) {
                toast.error('Jumlah penarikan melebihi saldo deposito');
                return;
            }

            // Check saldo sukarela
            const saldoSukarela = Number(tabungan?.summary.saldoSukarela || 0);
            if (penaltyCalculation && penaltyCalculation.netAmount > saldoSukarela) {
                toast.error(
                    `Saldo Sukarela tidak mencukupi. Saldo tersedia: ${formatCurrency(saldoSukarela)}`
                );
                return;
            }

            await depositWithdrawalService.createWithdrawal({
                depositApplicationId: data.depositApplicationId,
                withdrawalAmount,
                bankAccountNumber: data.bankAccountNumber || undefined,
                notes: data.notes || undefined,
            });

            toast.success('Pengajuan penarikan deposito berhasil disubmit!');
            onSuccess();
        } catch (error) {
            toast.error(handleApiError(error));
        } finally {
            setIsSubmitting(false);
        }
    };

    const availableBalance = Number(tabungan?.summary.saldoSukarela || 0);

    return (
        <Card className="w-full max-w-3xl mx-auto">
            <CardHeader>
                <CardTitle>Formulir Penarikan Deposito</CardTitle>
                <CardDescription>
                    Isi formulir di bawah untuk mengajukan penarikan deposito Anda
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        {/* Saldo Info */}
                        <Alert>
                            <Wallet className="h-4 w-4" />
                            <AlertTitle>Saldo Sukarela Anda</AlertTitle>
                            <AlertDescription>
                                <span className="text-lg font-bold text-primary">
                                    {formatCurrency(availableBalance)}
                                </span>
                                <p className="text-xs mt-1">
                                    Dana akan ditransfer ke saldo ini setelah dikurangi pinalti (jika ada)
                                </p>
                            </AlertDescription>
                        </Alert>

                        {/* Deposit Selection */}
                        <FormField
                            control={form.control}
                            name="depositApplicationId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Pilih Deposito</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        value={field.value}
                                        disabled={isLoadingDeposits}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Pilih deposito yang ingin ditarik" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {activeDeposits.length === 0 ? (
                                                <SelectItem value="none" disabled>
                                                    Tidak ada deposito aktif
                                                </SelectItem>
                                            ) : (
                                                activeDeposits.map((deposit) => (
                                                    <SelectItem key={deposit.id} value={deposit.id}>
                                                        {deposit.depositNumber} - {formatCurrency(deposit.collectedAmount)}
                                                    </SelectItem>
                                                ))
                                            )}
                                        </SelectContent>
                                    </Select>
                                    <FormDescription>
                                        Pilih deposito yang ingin Anda tarik
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Deposit Info */}
                        {selectedDeposit && (
                            <div className="rounded-lg border p-4 space-y-3 bg-muted/50">
                                <h3 className="font-semibold text-sm">Informasi Deposito</h3>
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div>
                                        <p className="text-muted-foreground">Nomor Deposito</p>
                                        <p className="font-medium">{selectedDeposit.depositNumber}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Saldo Terkumpul</p>
                                        <p className="font-bold text-primary">
                                            {formatCurrency(selectedDeposit.collectedAmount)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Tenor</p>
                                        <p className="font-medium">{selectedDeposit.tenorMonths} Bulan</p>
                                    </div>
                                    {selectedDeposit.maturityDate && (
                                        <div>
                                            <p className="text-muted-foreground">Jatuh Tempo</p>
                                            <p className="font-medium">
                                                {format(new Date(selectedDeposit.maturityDate), 'dd MMM yyyy', {
                                                    locale: id,
                                                })}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

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
                                            disabled={!selectedDeposit}
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        {selectedDeposit && (
                                            <span>
                                                Maksimal: {formatCurrency(selectedDeposit.collectedAmount)}
                                            </span>
                                        )}
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Penalty Warning & Calculation */}
                        {penaltyCalculation && (
                            <div
                                className={`rounded-lg border p-4 space-y-3 ${penaltyCalculation.isEarly
                                        ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/20'
                                        : 'border-green-500 bg-green-50 dark:bg-green-950/20'
                                    }`}
                            >
                                {penaltyCalculation.isEarly ? (
                                    <>
                                        <div className="flex items-center gap-2">
                                            <AlertTriangle className="h-5 w-5 text-orange-600" />
                                            <h3 className="font-semibold text-orange-900 dark:text-orange-100">
                                                Penarikan Sebelum Jatuh Tempo
                                            </h3>
                                        </div>
                                        <p className="text-sm text-orange-800 dark:text-orange-200">
                                            Deposito belum jatuh tempo. Akan dikenakan pinalti {penaltyCalculation.penaltyRate}%
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
                                                <span>Pinalti ({penaltyCalculation.penaltyRate}%):</span>
                                                <span className="font-medium flex items-center gap-1">
                                                    <TrendingDown className="h-3 w-3" />
                                                    - {formatCurrency(penaltyCalculation.penaltyAmount)}
                                                </span>
                                            </div>
                                            <Separator />
                                            <div className="flex justify-between text-base font-bold">
                                                <span>Yang Diterima:</span>
                                                <span className="text-green-600">
                                                    {formatCurrency(penaltyCalculation.netAmount)}
                                                </span>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="flex items-center gap-2">
                                            <Info className="h-5 w-5 text-green-600" />
                                            <h3 className="font-semibold text-green-900 dark:text-green-100">
                                                Penarikan Setelah Jatuh Tempo
                                            </h3>
                                        </div>
                                        <p className="text-sm text-green-800 dark:text-green-200">
                                            Deposito sudah jatuh tempo. Tidak ada pinalti.
                                        </p>
                                        <Separator />
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between text-base font-bold">
                                                <span>Yang Diterima:</span>
                                                <span className="text-green-600">
                                                    {formatCurrency(penaltyCalculation.netAmount)}
                                                </span>
                                            </div>
                                        </div>
                                    </>
                                )}
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
                                    <li>Penarikan sebelum jatuh tempo dikenakan pinalti 3%</li>
                                    <li>Dana akan ditransfer setelah semua tahap approval selesai</li>
                                    <li>Dana akan masuk ke Saldo Sukarela Anda</li>
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
                                disabled={isSubmitting || !selectedDeposit}
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
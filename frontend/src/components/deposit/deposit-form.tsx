'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { Loader2, Calendar as CalendarIcon, CheckCircle2, Info } from 'lucide-react';
import { FaRupiahSign } from "react-icons/fa6";

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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { depositService } from '@/services/deposit.service';
import { handleApiError } from '@/lib/axios';
import { useAuthStore } from '@/store/auth.store';
import { DepositAmount, DepositTenor } from '@/types/deposit.types';

const DEPOSIT_OPTIONS = [
  { value: DepositAmount.AMOUNT_200K, label: 'Rp 200.000', amount: 200000 },
  { value: DepositAmount.AMOUNT_500K, label: 'Rp 500.000', amount: 500000 },
  { value: DepositAmount.AMOUNT_1000K, label: 'Rp 1.000.000', amount: 1000000 },
  { value: DepositAmount.AMOUNT_1500K, label: 'Rp 1.500.000', amount: 1500000 },
  { value: DepositAmount.AMOUNT_2000K, label: 'Rp 2.000.000', amount: 2000000 },
  { value: DepositAmount.AMOUNT_3000K, label: 'Rp 3.000.000', amount: 3000000 },
];

const TENOR_OPTIONS = [
  { value: DepositTenor.TENOR_3, label: '3 Bulan', months: 3 },
  { value: DepositTenor.TENOR_6, label: '6 Bulan', months: 6 },
  { value: DepositTenor.TENOR_9, label: '9 Bulan', months: 9 },
  { value: DepositTenor.TENOR_12, label: '12 Bulan', months: 12 },
];

// Default interest rate (you can fetch this from settings)
const DEFAULT_INTEREST_RATE = 6; // 6% per year

interface DepositFormProps {
  onSuccess: () => void;
  onCancel?: () => void;
}

const formSchema = z.object({
  depositAmount: z.enum(DepositAmount, {
    error: 'Pilih jumlah deposito',
  }),
  depositTenor: z.enum(DepositTenor, {
    error: 'Pilih jangka waktu',
  }),
  agreedToTerms: z.boolean().refine((val) => val === true, {
    message: 'Anda harus menyetujui syarat dan ketentuan',
  }),
});

type FormData = z.infer<typeof formSchema>;

export function DepositForm({ onSuccess, onCancel }: DepositFormProps) {
  const { user } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      agreedToTerms: false,
    },
  });

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const calculateReturn = (amount: number, months: number) => {
    const annualRate = DEFAULT_INTEREST_RATE;
    const interestRate = annualRate;

    // Calculate interest
    const projectedInterest = amount * (annualRate / 100) * (months / 12);
    const totalReturn = amount + projectedInterest;

    return {
      interestRate,
      projectedInterest: Math.round(projectedInterest),
      totalReturn: Math.round(totalReturn),
    };
  };

  // Watch form values
  const depositAmount = form.watch('depositAmount');
  const depositTenor = form.watch('depositTenor');

  // Calculate return when both amount and tenor are selected
  const calculations =
    depositAmount && depositTenor
      ? calculateReturn(
          DEPOSIT_OPTIONS.find((o) => o.value === depositAmount)?.amount || 0,
          TENOR_OPTIONS.find((o) => o.value === depositTenor)?.months || 0
        )
      : null;

  const onSubmit = async (data: FormData) => {
    try {
      setIsSubmitting(true);

      // Create draft first
      const draftResult = await depositService.createDraft(data);

      // Then submit
      await depositService.submitDeposit(draftResult.deposit.id);

      toast.success('Pengajuan deposito berhasil disubmit!');
      onSuccess();
    } catch (error) {
      toast.error(handleApiError(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Formulir Pengajuan Deposito</CardTitle>
        <CardDescription>
          Pilih jumlah deposito dan jangka waktu. Deposito akan dipotong dari gaji bulanan Anda.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Deposit Amount */}
            <FormField
              control={form.control}
              name="depositAmount"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Jumlah Deposito</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="grid grid-cols-2 md:grid-cols-3 gap-4"
                    >
                      {DEPOSIT_OPTIONS.map((option) => (
                        <div key={option.value}>
                          <RadioGroupItem
                            value={option.value}
                            id={option.value}
                            className="peer sr-only"
                          />
                          <label
                            htmlFor={option.value}
                            className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer transition-all"
                          >
                            <FaRupiahSign className="mb-2 h-6 w-6" />
                            <span className="text-lg font-bold">{option.label}</span>
                          </label>
                        </div>
                      ))}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Deposit Tenor */}
            <FormField
              control={form.control}
              name="depositTenor"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Jangka Waktu</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="grid grid-cols-2 md:grid-cols-4 gap-4"
                    >
                      {TENOR_OPTIONS.map((option) => (
                        <div key={option.value}>
                          <RadioGroupItem
                            value={option.value}
                            id={option.value}
                            className="peer sr-only"
                          />
                          <label
                            htmlFor={option.value}
                            className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer transition-all"
                          >
                            <CalendarIcon className="mb-2 h-6 w-6" />
                            <span className="text-lg font-bold">{option.label}</span>
                          </label>
                        </div>
                      ))}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Calculation Preview */}
            {calculations && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Proyeksi Return Deposito</AlertTitle>
                <AlertDescription>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Bunga ({calculations.interestRate}%)
                      </p>
                      <p className="text-lg font-bold text-green-600">
                        {formatCurrency(calculations.projectedInterest)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Return</p>
                      <p className="text-lg font-bold text-primary">
                        {formatCurrency(calculations.totalReturn)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Jatuh Tempo</p>
                      <p className="text-lg font-bold">
                        {new Date(
                          new Date().setMonth(
                            new Date().getMonth() +
                              (TENOR_OPTIONS.find((o) => o.value === depositTenor)?.months || 0)
                          )
                        ).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            <Separator />

            {/* Terms and Conditions */}
            <FormField
              control={form.control}
              name="agreedToTerms"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="font-medium">
                      DENGAN INI SAYA MENGAJUKAN PERUBAHAN TABUNGAN DEPOSITO DAN SAYA BERSEDIA
                      DIPOTONG GAJI
                    </FormLabel>
                    <FormDescription>
                      Saya menyetujui bahwa deposito akan dipotong dari gaji bulanan saya sesuai
                      jumlah yang dipilih.
                    </FormDescription>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />

            {/* Info Box */}
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertTitle>Informasi Penting</AlertTitle>
              <AlertDescription className="text-xs space-y-1 mt-2">
                <ul className="list-disc list-inside space-y-1">
                  <li>Deposito akan dipotong otomatis dari gaji bulanan</li>
                  <li>Pengajuan akan melalui 2 tahap approval: DSP → Ketua</li>
                  <li>Setelah disetujui, pemotongan akan dimulai pada periode gaji berikutnya</li>
                  <li>Bunga deposito dihitung berdasarkan suku bunga yang berlaku</li>
                  <li>Dana dapat dicairkan setelah jatuh tempo</li>
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
              <Button type="submit" disabled={isSubmitting} className="flex-1">
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
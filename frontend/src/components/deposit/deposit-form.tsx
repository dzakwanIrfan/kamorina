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
import { Skeleton } from '@/components/ui/skeleton';
import { depositService } from '@/services/deposit.service';
import { handleApiError } from '@/lib/axios';
import { useDepositConfig } from '@/hooks/use-deposit-config';

interface DepositFormProps {
  onSuccess: () => void;
  onCancel?: () => void;
}

export function DepositForm({ onSuccess, onCancel }: DepositFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { data: config, isLoading: isLoadingConfig } = useDepositConfig();

  const formSchema = z.object({
    depositAmountCode: z.string().min(1, 'Pilih jumlah deposito'),
    depositTenorCode: z.string().min(1, 'Pilih jangka waktu'),
    agreedToTerms: z.boolean().refine((val) => val === true, {
      message: 'Anda harus menyetujui syarat dan ketentuan',
    }),
  });

  type FormData = z.infer<typeof formSchema>;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      depositAmountCode: '',
      depositTenorCode: '',
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

  const calculateReturn = (amount: number, months: number, interestRate: number) => {
    const projectedInterest = amount * (interestRate / 100) * (months / 12);
    const totalReturn = Number(amount) + Number(projectedInterest);

    return {
      interestRate,
      projectedInterest: Math.round(projectedInterest),
      totalReturn: Math.round(totalReturn),
    };
  };

  // Watch form values
  const depositAmountCode = form.watch('depositAmountCode');
  const depositTenorCode = form.watch('depositTenorCode');

  // Calculate return when both amount and tenor are selected
  const calculations =
    depositAmountCode && depositTenorCode && config
      ? calculateReturn(
          config.amounts.find((o) => o.code === depositAmountCode)?.amount || 0,
          config.tenors.find((o) => o.code === depositTenorCode)?.months || 0,
          config.interestRate
        )
      : null;

  const onSubmit = async (data: FormData) => {
    try {
      setIsSubmitting(true);

      // Create draft first
      const draftResult = await depositService.createDraft({
        depositAmountCode: data.depositAmountCode,
        depositTenorCode: data.depositTenorCode,
        agreedToTerms: data.agreedToTerms,
      });

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

  if (isLoadingConfig) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <Skeleton className="h-6 w-64" />
          <Skeleton className="h-4 w-96 mt-2" />
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Skeleton className="h-4 w-32 mb-3" />
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          </div>
          <div>
            <Skeleton className="h-4 w-32 mb-3" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!config) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="py-10">
          <Alert variant="destructive">
            <AlertTitle>Gagal memuat konfigurasi</AlertTitle>
            <AlertDescription>
              Tidak dapat memuat opsi deposito. Silakan coba lagi nanti.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

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
              name="depositAmountCode"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Jumlah Deposito</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="grid grid-cols-2 md:grid-cols-3 gap-4"
                    >
                      {config.amounts.map((option) => (
                        <div key={option.code}>
                          <RadioGroupItem
                            value={option.code}
                            id={option.code}
                            className="peer sr-only"
                          />
                          <label
                            htmlFor={option.code}
                            className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-accent peer-data-[state=checked]:text-accent-foreground [&:has([data-state=checked])]:border-primary cursor-pointer transition-all"
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
              name="depositTenorCode"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Jangka Waktu</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="grid grid-cols-2 md:grid-cols-4 gap-4"
                    >
                      {config.tenors.map((option) => (
                        <div key={option.code}>
                          <RadioGroupItem
                            value={option.code}
                            id={option.code}
                            className="peer sr-only"
                          />
                          <label
                            htmlFor={option.code}
                            className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-accent peer-data-[state=checked]:text-accent-foreground [&:has([data-state=checked])]:border-primary cursor-pointer transition-all"
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
                        Bunga ({calculations.interestRate}% per tahun)
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
                              (config.tenors.find((o) => o.code === depositTenorCode)?.months || 0)
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
                  <li>Bunga deposito: {config.interestRate}% per tahun</li>
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
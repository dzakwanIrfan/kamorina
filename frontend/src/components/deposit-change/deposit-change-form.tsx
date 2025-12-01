'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { 
  Loader2, 
  Calendar as CalendarIcon, 
  CheckCircle2, 
  Info, 
  TrendingUp,
  TrendingDown,
  ArrowRight,
  AlertTriangle,
} from 'lucide-react';
import { FaRupiahSign } from 'react-icons/fa6';

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
import { Badge } from '@/components/ui/badge';
import { depositChangeService } from '@/services/deposit-change.service';
import { handleApiError } from '@/lib/axios';
import { useDepositConfig } from '@/hooks/use-deposit-config';
import { DepositApplication } from '@/types/deposit.types';
import { DepositChangePreview } from '@/types/deposit-change.types';
import { formatCurrency, formatDifference } from '@/lib/deposit-change-constants';

interface DepositChangeFormProps {
  deposit: DepositApplication;
  onSuccess: () => void;
  onCancel?: () => void;
}

export function DepositChangeForm({ deposit, onSuccess, onCancel }: DepositChangeFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [preview, setPreview] = useState<DepositChangePreview | null>(null);
  const { data: config, isLoading: isLoadingConfig } = useDepositConfig();

  const formSchema = z.object({
    newAmountCode: z.string(). min(1, 'Pilih jumlah deposito baru'),
    newTenorCode: z.string().min(1, 'Pilih jangka waktu baru'),
    agreedToTerms: z.boolean(). refine((val) => val === true, {
      message: 'Anda harus menyetujui syarat dan ketentuan',
    }),
    agreedToAdminFee: z.boolean().refine((val) => val === true, {
      message: 'Anda harus menyetujui biaya admin',
    }),
  });

  type FormData = z.infer<typeof formSchema>;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      newAmountCode: deposit.depositAmountCode,
      newTenorCode: deposit.depositTenorCode,
      agreedToTerms: false,
      agreedToAdminFee: false,
    },
  });

  const newAmountCode = form.watch('newAmountCode');
  const newTenorCode = form. watch('newTenorCode');

  // Fetch preview calculation when options change
  useEffect(() => {
    const fetchPreview = async () => {
      if (!newAmountCode || !newTenorCode) {
        setPreview(null);
        return;
      }

      // Check if there's any change
      if (
        newAmountCode === deposit.depositAmountCode &&
        newTenorCode === deposit.depositTenorCode
      ) {
        setPreview(null);
        return;
      }

      try {
        setIsCalculating(true);
        const result = await depositChangeService.previewChange(
          deposit.id,
          newAmountCode,
          newTenorCode
        );
        setPreview(result);
      } catch (error) {
        console.error('Failed to fetch preview:', error);
        setPreview(null);
      } finally {
        setIsCalculating(false);
      }
    };

    fetchPreview();
  }, [newAmountCode, newTenorCode, deposit.id, deposit.depositAmountCode, deposit.depositTenorCode]);

  const onSubmit = async (data: FormData) => {
    if (! preview?. hasChanges) {
      toast. error('Tidak ada perubahan yang diajukan');
      return;
    }

    try {
      setIsSubmitting(true);

      // Create draft first
      const draftResult = await depositChangeService.createDraft({
        depositApplicationId: deposit.id,
        newAmountCode: data. newAmountCode,
        newTenorCode: data.newTenorCode,
        agreedToTerms: data.agreedToTerms,
        agreedToAdminFee: data.agreedToAdminFee,
      });

      // Then submit
      await depositChangeService.submitChangeRequest(draftResult.changeRequest.id);

      toast.success('Pengajuan perubahan deposito berhasil disubmit! ');
      onSuccess();
    } catch (error) {
      toast.error(handleApiError(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingConfig) {
    return (
      <Card className="w-full">
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
        </CardContent>
      </Card>
    );
  }

  if (! config) {
    return (
      <Card className="w-full">
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
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Formulir Perubahan Tabungan Deposito</CardTitle>
        <CardDescription>
          Ubah jumlah atau jangka waktu deposito Anda.  Biaya admin akan dikenakan untuk setiap perubahan. 
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Current Deposit Info */}
        <Alert className="mb-6">
          <Info className="h-4 w-4" />
          <AlertTitle>Deposito Saat Ini</AlertTitle>
          <AlertDescription>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
              <div>
                <p className="text-xs text-muted-foreground">No. Deposito</p>
                <p className="font-mono font-medium">{deposit.depositNumber}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Jumlah</p>
                <p className="font-semibold">{formatCurrency(deposit.amountValue)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Tenor</p>
                <p className="font-semibold">{deposit.tenorMonths} Bulan</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Return</p>
                <p className="font-semibold text-green-600">
                  {deposit.totalReturn ?  formatCurrency(deposit.totalReturn) : '-'}
                </p>
              </div>
            </div>
          </AlertDescription>
        </Alert>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* New Deposit Amount */}
            <FormField
              control={form.control}
              name="newAmountCode"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Jumlah Deposito Baru</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="grid grid-cols-2 md:grid-cols-3 gap-4"
                    >
                      {config.amounts.map((option) => {
                        const isCurrent = option.code === deposit.depositAmountCode;
                        return (
                          <div key={option.code}>
                            <RadioGroupItem
                              value={option.code}
                              id={`amount-${option.code}`}
                              className="peer sr-only"
                            />
                            <label
                              htmlFor={`amount-${option.code}`}
                              className={`flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer relative ${
                                isCurrent ?  'ring-2 ring-blue-200 dark:ring-blue-800' : ''
                              }`}
                            >
                              {isCurrent && (
                                <Badge 
                                  variant="secondary" 
                                  className="absolute -top-2 -right-2 text-xs"
                                >
                                  Saat Ini
                                </Badge>
                              )}
                              <FaRupiahSign className="mb-2 h-6 w-6" />
                              <span className="text-lg font-bold">{option.label}</span>
                            </label>
                          </div>
                        );
                      })}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* New Deposit Tenor */}
            <FormField
              control={form.control}
              name="newTenorCode"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Jangka Waktu Baru</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="grid grid-cols-2 md:grid-cols-4 gap-4"
                    >
                      {config.tenors.map((option) => {
                        const isCurrent = option.code === deposit.depositTenorCode;
                        return (
                          <div key={option.code}>
                            <RadioGroupItem
                              value={option.code}
                              id={`tenor-${option.code}`}
                              className="peer sr-only"
                            />
                            <label
                              htmlFor={`tenor-${option.code}`}
                              className={`flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer relative ${
                                isCurrent ? 'ring-2 ring-blue-200 dark:ring-blue-800' : ''
                              }`}
                            >
                              {isCurrent && (
                                <Badge 
                                  variant="secondary" 
                                  className="absolute -top-2 -right-2 text-xs"
                                >
                                  Saat Ini
                                </Badge>
                              )}
                              <CalendarIcon className="mb-2 h-6 w-6" />
                              <span className="text-lg font-bold">{option.label}</span>
                            </label>
                          </div>
                        );
                      })}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Calculation Preview */}
            {isCalculating && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                <span className="text-muted-foreground">Menghitung perubahan...</span>
              </div>
            )}

            {preview && preview.hasChanges && ! isCalculating && (
              <div className="space-y-4">
                <Alert className="bg-primary/5 border-primary/20">
                  <TrendingUp className="h-4 w-4" />
                  <AlertTitle>Perbandingan Perubahan</AlertTitle>
                  <AlertDescription>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
                      {/* Before */}
                      <div className="bg-background rounded-lg p-4 border">
                        <p className="text-sm font-medium text-muted-foreground mb-3">Sebelum</p>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm">Jumlah:</span>
                            <span className="font-medium">{formatCurrency(preview. current.principal)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">Tenor:</span>
                            <span className="font-medium">{preview.current.tenorMonths} Bulan</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">Bunga:</span>
                            <span className="font-medium text-green-600">
                              {formatCurrency(preview.current.projectedInterest)}
                            </span>
                          </div>
                          <Separator />
                          <div className="flex justify-between">
                            <span className="text-sm font-medium">Total Return:</span>
                            <span className="font-bold">{formatCurrency(preview.current.totalReturn)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Arrow */}
                      <div className="hidden lg:flex items-center justify-center">
                        <ArrowRight className="h-8 w-8 text-muted-foreground" />
                      </div>

                      {/* After */}
                      <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
                        <p className="text-sm font-medium text-primary mb-3">Sesudah</p>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm">Jumlah:</span>
                            <span className="font-medium">{formatCurrency(preview.new.principal)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">Tenor:</span>
                            <span className="font-medium">{preview.new. tenorMonths} Bulan</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">Bunga:</span>
                            <span className="font-medium text-green-600">
                              {formatCurrency(preview. new.projectedInterest)}
                            </span>
                          </div>
                          <Separator />
                          <div className="flex justify-between">
                            <span className="text-sm font-medium">Total Return:</span>
                            <span className="font-bold text-primary">
                              {formatCurrency(preview.new.totalReturn)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Difference Summary */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                      <div className="bg-background rounded-lg p-3 border">
                        <p className="text-xs text-muted-foreground mb-1">Selisih Jumlah</p>
                        <p className={`text-lg font-bold ${
                          preview.difference. amount >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {formatDifference(preview.difference.amount)}
                        </p>
                      </div>
                      <div className="bg-background rounded-lg p-3 border">
                        <p className="text-xs text-muted-foreground mb-1">Selisih Tenor</p>
                        <p className={`text-lg font-bold ${
                          preview.difference.tenor >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {preview.difference.tenor > 0 ? '+' : ''}{preview.difference.tenor} Bulan
                        </p>
                      </div>
                      <div className="bg-background rounded-lg p-3 border">
                        <p className="text-xs text-muted-foreground mb-1">Selisih Bunga</p>
                        <p className={`text-lg font-bold ${
                          preview.difference.projectedInterest >= 0 ?  'text-green-600' : 'text-red-600'
                        }`}>
                          {formatDifference(preview.difference.projectedInterest)}
                        </p>
                      </div>
                      <div className="bg-background rounded-lg p-3 border">
                        <p className="text-xs text-muted-foreground mb-1">Selisih Total</p>
                        <p className={`text-lg font-bold ${
                          preview.difference. totalReturn >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {formatDifference(preview.difference.totalReturn)}
                        </p>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>

                {/* Admin Fee Warning */}
                <Alert variant="destructive" className="bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  <AlertTitle className="text-orange-800 dark:text-orange-200">Biaya Admin</AlertTitle>
                  <AlertDescription className="text-orange-700 dark:text-orange-300">
                    <p className="text-2xl font-bold mt-2">
                      {formatCurrency(preview.adminFee)}
                    </p>
                    <p className="text-sm mt-1">
                      Biaya admin akan dipotong dari gaji Anda pada periode berikutnya.
                    </p>
                  </AlertDescription>
                </Alert>
              </div>
            )}

            {! preview?. hasChanges && ! isCalculating && newAmountCode && newTenorCode && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Tidak Ada Perubahan</AlertTitle>
                <AlertDescription>
                  Pilihan Anda sama dengan deposito saat ini. Silakan pilih jumlah atau tenor yang berbeda.
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
                      DENGAN INI SAYA MENGAJUKAN PERUBAHAN TABUNGAN DEPOSITO DAN SAYA BERSEDIA DIPOTONG GAJI
                    </FormLabel>
                    <FormDescription>
                      Saya menyetujui bahwa perubahan deposito akan berlaku setelah disetujui dan pemotongan gaji akan disesuaikan. 
                    </FormDescription>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="agreedToAdminFee"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field. onChange} />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="font-medium">
                      SAYA SETUJU UNTUK MEMBAYAR BIAYA ADMIN SEBESAR {preview ?  formatCurrency(preview.adminFee) : 'Rp 15.000'}
                    </FormLabel>
                    <FormDescription>
                      Biaya admin akan dipotong langsung dari tabungan/gaji saya pada periode berikutnya. 
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
                  <li>Pengajuan perubahan akan melalui 2 tahap approval: DSP → Ketua</li>
                  <li>Biaya admin {preview ? formatCurrency(preview. adminFee) : 'Rp 15.000'} akan dipotong setelah perubahan disetujui</li>
                  <li>Perubahan akan berlaku efektif setelah mendapat persetujuan akhir</li>
                  <li>Pemotongan gaji akan disesuaikan mulai periode berikutnya</li>
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
                disabled={isSubmitting || isCalculating || !preview?.hasChanges} 
                className="flex-1"
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit Pengajuan Perubahan
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { Loader2, Calendar as CalendarIcon, CheckCircle2, Info, TrendingUp } from 'lucide-react';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { depositService } from '@/services/deposit.service';
import { depositOptionService } from '@/services/deposit-option.service';
import { handleApiError } from '@/lib/axios';
import { useDepositConfig } from '@/hooks/use-deposit-config';
import { DepositCalculation } from '@/types/deposit-option.types';

interface DepositFormProps {
  onSuccess: () => void;
  onCancel?: () => void;
}

export function DepositForm({ onSuccess, onCancel }: DepositFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [calculation, setCalculation] = useState<DepositCalculation | null>(null);
  const [showBreakdown, setShowBreakdown] = useState(false);
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

  // Watch form values
  const depositAmountCode = form.watch('depositAmountCode');
  const depositTenorCode = form.watch('depositTenorCode');

  // Fetch calculation when both amount and tenor are selected
  useEffect(() => {
    const fetchCalculation = async () => {
      if (!depositAmountCode || !depositTenorCode) {
        setCalculation(null);
        return;
      }

      try {
        setIsCalculating(true);
        const result = await depositOptionService.previewCalculation(
          depositAmountCode,
          depositTenorCode
        );
        setCalculation(result);
      } catch (error) {
        console.error('Failed to fetch calculation:', error);
        setCalculation(null);
      } finally {
        setIsCalculating(false);
      }
    };

    fetchCalculation();
  }, [depositAmountCode, depositTenorCode]);

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

  const selectedTenor = config.tenors.find((t) => t.code === depositTenorCode);
  const maturityDate = selectedTenor
    ? new Date(new Date().setMonth(new Date().getMonth() + selectedTenor.months))
    : null;

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
            {isCalculating && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                <span className="text-muted-foreground">Menghitung proyeksi...</span>
              </div>
            )}

            {calculation && !isCalculating && (
              <div className="space-y-4">
                <Alert className="bg-primary/5 border-primary/20">
                  <TrendingUp className="h-4 w-4" />
                  <AlertTitle className="flex items-center gap-2">
                    Proyeksi Return Deposito
                    <Badge variant="outline" className="text-xs">
                      {calculation.calculationMethod === 'SIMPLE' ? 'Bunga Sederhana' : 'Bunga Majemuk'}
                    </Badge>
                  </AlertTitle>
                  <AlertDescription>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                      <div className="bg-background rounded-lg p-3 border">
                        <p className="text-xs text-muted-foreground mb-1">Pokok Deposito</p>
                        <p className="text-lg font-bold">{formatCurrency(calculation.principal)}</p>
                      </div>
                      <div className="bg-background rounded-lg p-3 border">
                        <p className="text-xs text-muted-foreground mb-1">
                          Suku Bunga ({calculation.annualInterestRate}% p.a.)
                        </p>
                        <p className="text-lg font-bold text-green-600">
                          +{formatCurrency(calculation.projectedInterest)}
                        </p>
                      </div>
                      <div className="bg-background rounded-lg p-3 border">
                        <p className="text-xs text-muted-foreground mb-1">Total Return</p>
                        <p className="text-xl font-bold text-primary">
                          {formatCurrency(calculation.totalReturn)}
                        </p>
                      </div>
                      <div className="bg-background rounded-lg p-3 border">
                        <p className="text-xs text-muted-foreground mb-1">Jatuh Tempo</p>
                        <p className="text-lg font-bold">
                          {maturityDate?.toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>

                    {/* Monthly Breakdown Collapsible */}
                    <Collapsible open={showBreakdown} onOpenChange={setShowBreakdown} className="mt-4">
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm" className="w-full">
                          {showBreakdown ? 'Sembunyikan' : 'Lihat'} Rincian Bulanan
                          <Info className="ml-2 h-4 w-4" />
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="mt-2">
                        <div className="rounded-md border overflow-hidden">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="w-16">Bulan</TableHead>
                                <TableHead className="text-right">Saldo Awal</TableHead>
                                <TableHead className="text-right">Bunga</TableHead>
                                <TableHead className="text-right">Saldo Akhir</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {calculation.monthlyInterestBreakdown.map((row) => (
                                <TableRow key={row.month}>
                                  <TableCell className="font-medium">{row.month}</TableCell>
                                  <TableCell className="text-right">
                                    {formatCurrency(row.openingBalance)}
                                  </TableCell>
                                  <TableCell className="text-right text-green-600">
                                    +{formatCurrency(row.interest)}
                                  </TableCell>
                                  <TableCell className="text-right font-medium">
                                    {formatCurrency(row.closingBalance)}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2 text-center">
                          * Perhitungan menggunakan metode{' '}
                          <strong>
                            {calculation.calculationMethod === 'SIMPLE'
                              ? 'Bunga Sederhana (Simple Interest)'
                              : 'Bunga Majemuk (Compound Interest)'}
                          </strong>
                          {calculation.calculationMethod === 'SIMPLE'
                            ? '. Bunga dihitung dari pokok awal dan dibagi rata setiap bulan.'
                            : '. Bunga dihitung dari saldo akhir bulan sebelumnya.'}
                        </p>
                      </CollapsibleContent>
                    </Collapsible>
                  </AlertDescription>
                </Alert>
              </div>
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
                  <li>
                    Suku bunga: <strong>{config.interestRate}% per tahun</strong> (
                    {config.calculationMethod === 'SIMPLE' ? 'Bunga Sederhana' : 'Bunga Majemuk'})
                  </li>
                  <li>Dana beserta bunga dapat dicairkan setelah jatuh tempo</li>
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
              <Button type="submit" disabled={isSubmitting || isCalculating} className="flex-1">
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
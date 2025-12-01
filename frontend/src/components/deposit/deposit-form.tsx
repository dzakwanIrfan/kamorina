'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { Loader2, Calendar as CalendarIcon, CheckCircle2, Info, TrendingUp, Wallet, ChevronDown, ChevronUp } from 'lucide-react';
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
import { ScrollArea } from '@/components/ui/scroll-area';
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
    depositAmountCode: z.string().min(1, 'Pilih jumlah setoran bulanan'),
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
  const depositTenorCode = form. watch('depositTenorCode');

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
      await depositService.submitDeposit(draftResult.deposit. id);

      toast.success('Pengajuan tabungan deposito berhasil disubmit! ');
      onSuccess();
    } catch (error) {
      toast.error(handleApiError(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingConfig) {
    return (
      <Card className="w-full max-w-5xl mx-auto">
        <CardHeader className="space-y-1 px-4 sm:px-6">
          <Skeleton className="h-7 w-48 sm:w-64" />
          <Skeleton className="h-4 w-64 sm:w-96 mt-2" />
        </CardHeader>
        <CardContent className="space-y-6 px-4 sm:px-6">
          <div>
            <Skeleton className="h-4 w-32 mb-3" />
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-20 sm:h-24 w-full" />
              ))}
            </div>
          </div>
          <div>
            <Skeleton className="h-4 w-32 mb-3" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              {[1, 2, 3, 4]. map((i) => (
                <Skeleton key={i} className="h-20 sm:h-24 w-full" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (! config) {
    return (
      <Card className="w-full max-w-5xl mx-auto">
        <CardContent className="py-10 px-4 sm:px-6">
          <Alert variant="destructive">
            <AlertTitle>Gagal memuat konfigurasi</AlertTitle>
            <AlertDescription>
              Tidak dapat memuat opsi tabungan deposito. Silakan coba lagi nanti.
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
    <Card className="w-full max-w-5xl mx-auto">
      <CardHeader className="space-y-1 px-4 sm:px-6">
        <CardTitle className="text-xl sm:text-2xl">Formulir Pengajuan Tabungan Deposito</CardTitle>
        <CardDescription className="text-sm">
          Pilih jumlah setoran bulanan dan jangka waktu menabung.  Setoran akan dipotong otomatis dari gaji bulanan Anda.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-4 sm:px-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Deposit Amount */}
            <FormField
              control={form.control}
              name="depositAmountCode"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <div className="flex flex-col">
                    <FormLabel className="text-base font-semibold">Setoran Bulanan</FormLabel>
                    <FormDescription className="text-xs sm:text-sm">
                      Jumlah uang yang akan dipotong dari gaji setiap bulan
                    </FormDescription>
                  </div>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4"
                    >
                      {config.amounts.map((option) => (
                        <div key={option.code}>
                          <RadioGroupItem
                            value={option.code}
                            id={option.code}
                            className="peer sr-only"
                          />
                          <label
                            htmlFor={option. code}
                            className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-card hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 dark:peer-data-[state=checked]:bg-primary/10 cursor-pointer transition-all p-3 sm:p-4 h-20 sm:h-24"
                          >
                            <FaRupiahSign className="mb-1 sm:mb-2 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground peer-data-[state=checked]:text-primary" />
                            <span className="text-sm sm:text-base font-bold text-center leading-tight">{option.label}</span>
                            <span className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">/bulan</span>
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
                  <div className="flex flex-col">
                    <FormLabel className="text-base font-semibold">Jangka Waktu Menabung</FormLabel>
                    <FormDescription className="text-xs sm:text-sm">
                      Berapa bulan Anda akan menabung dengan setoran bulanan
                    </FormDescription>
                  </div>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4"
                    >
                      {config.tenors. map((option) => (
                        <div key={option.code}>
                          <RadioGroupItem
                            value={option.code}
                            id={option. code}
                            className="peer sr-only"
                          />
                          <label
                            htmlFor={option.code}
                            className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-card hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 dark:peer-data-[state=checked]:bg-primary/10 cursor-pointer transition-all p-3 sm:p-4 h-20 sm:h-24"
                          >
                            <CalendarIcon className="mb-1 sm:mb-2 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                            <span className="text-sm sm:text-base font-bold">{option.label}</span>
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
                <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin mr-2" />
                <span className="text-sm sm:text-base text-muted-foreground">Menghitung proyeksi... </span>
              </div>
            )}

            {calculation && ! isCalculating && (
              <div className="space-y-4">
                <Alert className="bg-primary/5 dark:bg-primary/10 border-primary/20">
                  <TrendingUp className="h-4 w-4" />
                  <AlertTitle className="flex flex-wrap items-center gap-2 text-base sm:text-lg">
                    Proyeksi Tabungan Deposito
                  </AlertTitle>
                  <AlertDescription>
                    {/* Mobile: Stacked Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mt-4">
                      {/* Setoran Bulanan */}
                      <div className="bg-background dark:bg-card rounded-lg p-3 sm:p-4 border shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                          <Wallet className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600 dark:text-blue-400" />
                          <p className="text-[10px] sm:text-xs text-muted-foreground font-medium">Setoran per Bulan</p>
                        </div>
                        <p className="text-lg sm:text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {formatCurrency(calculation.monthlyDeposit)}
                        </p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                          Dipotong dari gaji setiap bulan
                        </p>
                      </div>

                      {/* Total Setoran */}
                      <div className="bg-background dark:bg-card rounded-lg p-3 sm:p-4 border shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                          <FaRupiahSign className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                          <p className="text-[10px] sm:text-xs text-muted-foreground font-medium">
                            Total Setoran ({calculation.tenorMonths} bulan)
                          </p>
                        </div>
                        <p className="text-lg sm:text-2xl font-bold">
                          {formatCurrency(calculation.totalPrincipal)}
                        </p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                          {formatCurrency(calculation.monthlyDeposit)} × {calculation.tenorMonths} bulan
                        </p>
                      </div>

                      {/* Proyeksi Bunga */}
                      <div className="bg-background dark:bg-card rounded-lg p-3 sm:p-4 border shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 dark:text-green-400" />
                          <p className="text-[10px] sm:text-xs text-muted-foreground font-medium">
                            Proyeksi Bunga ({calculation.annualInterestRate}% p.a.)
                          </p>
                        </div>
                        <p className="text-lg sm:text-2xl font-bold text-green-600 dark:text-green-400">
                          +{formatCurrency(calculation.projectedInterest)}
                        </p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                          {((calculation.projectedInterest / calculation.totalPrincipal) * 100).toFixed(2)}% dari total setoran
                        </p>
                      </div>

                      {/* Total Penerimaan */}
                      <div className="bg-linear-to-br from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 rounded-lg p-3 sm:p-4 border-2 border-primary/30 shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                          <p className="text-[10px] sm:text-xs text-muted-foreground font-semibold">
                            Total yang Diterima
                          </p>
                        </div>
                        <p className="text-xl sm:text-3xl font-bold text-primary">
                          {formatCurrency(calculation.totalReturn)}
                        </p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                          Saat jatuh tempo:{' '}
                          <span className="font-medium">
                            {maturityDate?. toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                        </p>
                      </div>
                    </div>

                    {/* Monthly Breakdown Collapsible */}
                    <Collapsible open={showBreakdown} onOpenChange={setShowBreakdown} className="mt-4">
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm" className="w-full text-xs sm:text-sm">
                          {showBreakdown ? (
                            <>
                              <ChevronUp className="mr-2 h-4 w-4" />
                              Sembunyikan
                            </>
                          ) : (
                            <>
                              <ChevronDown className="mr-2 h-4 w-4" />
                              Lihat
                            </>
                          )}{' '}
                          Rincian Akumulasi per Bulan
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="mt-2">
                        <div className="rounded-md border overflow-hidden">
                          {/* Desktop: Table */}
                          <div className="hidden sm:block">
                            <ScrollArea className="h-[400px]">
                              <Table>
                                <TableHeader className="sticky top-0 bg-background dark:bg-card z-10">
                                  <TableRow>
                                    <TableHead className="w-16">Bulan</TableHead>
                                    <TableHead className="text-right">Setor</TableHead>
                                    <TableHead className="text-right">Akum. Setoran</TableHead>
                                    <TableHead className="text-right">Akum. Bunga</TableHead>
                                    <TableHead className="text-right font-semibold">Total Saldo</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {calculation.monthlyInterestBreakdown.map((row) => (
                                    <TableRow key={row.month}>
                                      <TableCell className="font-medium">{row.month}</TableCell>
                                      <TableCell className="text-right text-blue-600 dark:text-blue-400 text-sm">
                                        {formatCurrency(row.monthlyDeposit)}
                                      </TableCell>
                                      <TableCell className="text-right text-sm">
                                        {formatCurrency(row.depositAccumulation)}
                                      </TableCell>
                                      <TableCell className="text-right text-green-600 dark:text-green-400 text-sm">
                                        +{formatCurrency(row.interestAccumulation)}
                                      </TableCell>
                                      <TableCell className="text-right font-semibold text-sm">
                                        {formatCurrency(row.totalBalance)}
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </ScrollArea>
                          </div>

                          {/* Mobile: Cards */}
                          <ScrollArea className="h-[400px] sm:hidden">
                            <div className="p-3 space-y-3">
                              {calculation.monthlyInterestBreakdown.map((row) => (
                                <div
                                  key={row.month}
                                  className="bg-card dark:bg-background p-3 rounded-lg border space-y-2"
                                >
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-semibold text-muted-foreground">
                                      Bulan {row.month}
                                    </span>
                                    <Badge variant="outline" className="text-[10px]">
                                      {formatCurrency(row.totalBalance)}
                                    </Badge>
                                  </div>
                                  <div className="grid grid-cols-3 gap-2 text-xs">
                                    <div>
                                      <p className="text-[10px] text-muted-foreground mb-1">Setor</p>
                                      <p className="font-medium text-blue-600 dark:text-blue-400">
                                        {formatCurrency(row.monthlyDeposit)}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-[10px] text-muted-foreground mb-1">Akum.  Setoran</p>
                                      <p className="font-medium">{formatCurrency(row.depositAccumulation)}</p>
                                    </div>
                                    <div>
                                      <p className="text-[10px] text-muted-foreground mb-1">Akum. Bunga</p>
                                      <p className="font-medium text-green-600 dark:text-green-400">
                                        +{formatCurrency(row.interestAccumulation)}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                        </div>
                        <div className="mt-3 p-3 bg-muted/50 dark:bg-muted/20 rounded-lg">
                          <p className="text-xs font-semibold text-muted-foreground mb-2">
                            Cara Baca Tabel:
                          </p>
                          <ul className="text-[10px] sm:text-xs text-muted-foreground space-y-1 ml-4 list-disc">
                            <li>
                              <strong>Setor:</strong> Jumlah yang dipotong dari gaji di bulan tersebut
                            </li>
                            <li>
                              <strong>Akum.  Setoran:</strong> Total uang yang sudah disetor dari bulan 1 sampai bulan ini
                            </li>
                            <li>
                              <strong>Akum. Bunga:</strong> Total bunga yang sudah dihitung sampai bulan ini
                            </li>
                            <li>
                              <strong>Total Saldo:</strong> Akumulasi Setoran + Akumulasi Bunga
                            </li>
                          </ul>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </AlertDescription>
                </Alert>
              </div>
            )}

            <Separator />

            {/* Terms and Conditions */}
            <FormField
              control={form. control}
              name="agreedToTerms"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3 sm:p-4">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field. onChange} />
                  </FormControl>
                  <div className="space-y-1 leading-none flex-1">
                    <FormLabel className="text-xs sm:text-sm font-semibold">
                      DENGAN INI SAYA MENGAJUKAN TABUNGAN DEPOSITO DAN BERSEDIA DIPOTONG GAJI
                    </FormLabel>
                    <FormDescription className="text-xs">
                      Saya menyetujui bahwa setoran deposito akan dipotong otomatis dari gaji bulanan saya
                      sesuai jumlah dan jangka waktu yang dipilih.
                    </FormDescription>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />

            {/* Info Box */}
            <Alert className="bg-muted/50 dark:bg-muted/20">
              <CheckCircle2 className="h-4 w-4" />
              <AlertTitle className="text-sm sm:text-base">Informasi Penting</AlertTitle>
              <AlertDescription className="text-xs sm:text-sm space-y-2 mt-2">
                <ul className="list-disc list-inside space-y-1. 5">
                  <li>
                    <strong>Setoran bulanan</strong> akan dipotong otomatis dari gaji setiap bulan
                  </li>
                  <li>Pengajuan akan melalui 2 tahap approval: DSP → Ketua</li>
                  <li>Setelah disetujui, pemotongan akan dimulai pada periode gaji berikutnya</li>
                  <li>
                    Suku bunga: <strong>{config.interestRate}% per tahun</strong> (
                    {config.calculationMethod === 'SIMPLE' ? 'Bunga Sederhana' : 'Bunga Majemuk'})
                  </li>
                  <li>
                    Dana beserta bunga dapat dicairkan setelah <strong>jatuh tempo</strong>
                  </li>
                  <li>
                    Perubahan setoran atau tenor hanya bisa dilakukan dengan mengajukan{' '}
                    <strong>Perubahan Deposito</strong> (dikenakan biaya admin)
                  </li>
                </ul>
              </AlertDescription>
            </Alert>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              {onCancel && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  disabled={isSubmitting}
                  className="w-full sm:flex-1 text-sm sm:text-base"
                >
                  Batal
                </Button>
              )}
              <Button 
                type="submit" 
                disabled={isSubmitting || isCalculating} 
                className="w-full sm:flex-1 text-sm sm:text-base"
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
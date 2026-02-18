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
import { formatCurrency } from '@/lib/deposit-change-constants';
import { settingsService } from '@/services/setting.service';

interface DepositChangeFormProps {
  deposit: DepositApplication;
  onSuccess: () => void;
  onCancel?: () => void;
}

export function DepositChangeForm({ deposit, onSuccess, onCancel }: DepositChangeFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [adminFee, setAdminFee] = useState<number>(0);
  const { data: config, isLoading: isLoadingConfig } = useDepositConfig();

  const formSchema = z.object({
    newAmountCode: z.string().min(1, 'Pilih jumlah deposito baru'),
    newTenorCode: z.string().min(1, 'Pilih jangka waktu baru'),
    agreedToTerms: z.boolean().refine((val) => val === true, {
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

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setIsLoadingSettings(true);
        const [adminFee] = await Promise.all([
          settingsService.getByKey('deposit_change_admin_fee'),
        ]);

        setAdminFee(parseFloat(adminFee.value));
      } catch (error) {
        console.error('Failed to fetch settings:', error);
        toast.error('Gagal memuat data pengaturan koperasi');
      } finally {
        setIsLoadingSettings(false);
      }
    };

    fetchSettings();
  }, []);

  const onSubmit = async (data: FormData) => {
    try {
      setIsSubmitting(true);

      // Create draft first
      const draftResult = await depositChangeService.createDraft({
        depositApplicationId: deposit.id,
        newAmountCode: data.newAmountCode,
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

  if (isLoadingSettings) {
    return (
      <Card className="w-full max-w-3xl mx-auto">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (!config) {
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
                <p className="font-semibold text-green-600">{formatCurrency(deposit.amountValue)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Tenor</p>
                <p className="font-semibold">{deposit.tenorMonths} Bulan</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Setoran</p>
                <p className="font-semibold">
                  {deposit.installmentCount}/{deposit.tenorMonths}
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
                        const isCurrent = option.amount === deposit.amountValue;
                        return (
                          <div key={option.code}>
                            <RadioGroupItem
                              value={option.code}
                              id={`amount-${option.code}`}
                              className="peer sr-only"
                            />
                            <label
                              htmlFor={`amount-${option.code}`}
                              className={`flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-accent [&:has([data-state=checked])]:border-primary cursor-pointer relative ${isCurrent ? 'ring-2 ring-blue-200 dark:ring-blue-800' : ''
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
                  <div className="flex flex-col space-y-2">
                    <FormLabel>Jangka Waktu Baru</FormLabel>
                    <FormDescription>
                      Jangka waktu baru harus lebih besar dari jumlah setoran yang sudah dilakukan ({deposit.installmentCount} bulan)
                    </FormDescription>
                  </div>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="grid grid-cols-2 md:grid-cols-4 gap-4"
                    >
                      {config.tenors.map((option) => {
                        const isCurrent = option.months === deposit.tenorMonths;
                        // Disable if tenor months is less than or equal to installmentCount
                        const isDisabled = option.months <= deposit.installmentCount;
                        return (
                          <div key={option.code}>
                            <RadioGroupItem
                              value={option.code}
                              id={`tenor-${option.code}`}
                              className="peer sr-only"
                              disabled={isDisabled}
                            />
                            <label
                              htmlFor={`tenor-${option.code}`}
                              className={`flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 relative ${isCurrent ? 'ring-2 ring-blue-200 dark:ring-blue-800' : ''
                                } ${isDisabled
                                  ? 'opacity-50 cursor-not-allowed bg-muted'
                                  : 'hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-accent [&:has([data-state=checked])]:border-primary cursor-pointer'
                                }`}
                              title={isDisabled ? `Tidak dapat dipilih karena sudah ada ${deposit.installmentCount} setoran` : undefined}
                            >
                              {isCurrent && (
                                <Badge
                                  variant="secondary"
                                  className="absolute -top-2 -right-2 text-xs"
                                >
                                  Saat Ini
                                </Badge>
                              )}
                              {isDisabled && !isCurrent && (
                                <Badge
                                  variant="outline"
                                  className="absolute -top-2 -right-2 text-xs bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 border-orange-300"
                                >
                                  Tidak Tersedia
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
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="font-medium">
                      SAYA SETUJU UNTUK MEMBAYAR BIAYA ADMIN SEBESAR {formatCurrency(adminFee)}
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
                  <li>Pengajuan akan melalui persetujuan Ketua</li>
                  <li>Biaya admin  akan dipotong setelah perubahan disetujui</li>
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
                disabled={isSubmitting}
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
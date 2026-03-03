'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { Loader2, AlertTriangle, Info, StopCircle } from 'lucide-react';

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
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { depositChangeService } from '@/services/deposit-change.service';
import { handleApiError } from '@/lib/axios';
import { DepositApplication } from '@/types/deposit.types';
import { formatCurrency } from '@/lib/deposit-change-constants';
import { settingsService } from '@/services/setting.service';

interface DepositStopFormProps {
  deposit: DepositApplication;
  onSuccess: () => void;
  onCancel?: () => void;
}

const formSchema = z.object({
  agreedToTerms: z.boolean().refine((val) => val === true, {
    message: 'Anda harus menyetujui syarat dan ketentuan',
  }),
  agreedToAdminFee: z.boolean().refine((val) => val === true, {
    message: 'Anda harus menyetujui biaya penalti',
  }),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export function DepositStopForm({ deposit, onSuccess, onCancel }: DepositStopFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [penaltyFee, setPenaltyFee] = useState<number>(0);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      agreedToTerms: false,
      agreedToAdminFee: false,
      notes: '',
    },
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setIsLoadingSettings(true);
        try {
          const setting = await settingsService.getByKey('deposit_change_admin_fee');
          setPenaltyFee(parseFloat(setting.value));
        } catch {
          setPenaltyFee(0);
        }
      } finally {
        setIsLoadingSettings(false);
      }
    };

    fetchSettings();
  }, []);

  const onSubmit = async (data: FormData) => {
    try {
      setIsSubmitting(true);
      await depositChangeService.createStopRequest({
        depositApplicationId: deposit.id,
        agreedToTerms: data.agreedToTerms,
        agreedToAdminFee: data.agreedToAdminFee,
        notes: data.notes,
      });

      toast.success('Pengajuan berhenti tabungan deposito berhasil disubmit!');
      onSuccess();
    } catch (error) {
      toast.error(handleApiError(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingSettings) {
    return (
      <Card className="w-full max-w-3xl mx-auto">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <StopCircle className="h-5 w-5 text-red-600" />
          <CardTitle className="text-red-600">Berhenti Tabungan Deposito</CardTitle>
        </div>
        <CardDescription>
          Ajukan permohonan penghentian deposito. Setelah disetujui, pemotongan gaji untuk
          setoran deposito akan dihentikan.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Deposit Info */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Informasi Deposito</AlertTitle>
          <AlertDescription>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
              <div>
                <p className="text-xs text-muted-foreground">No. Deposito</p>
                <p className="font-mono font-medium">{deposit.depositNumber}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Jumlah Setoran / Bulan</p>
                <p className="font-semibold text-green-600">{formatCurrency(deposit.amountValue)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Tenor</p>
                <p className="font-semibold">{deposit.tenorMonths} Bulan</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Setoran Berjalan</p>
                <p className="font-semibold">
                  {deposit.installmentCount}/{deposit.tenorMonths} Bulan
                </p>
              </div>
            </div>
          </AlertDescription>
        </Alert>

        {/* Penalty Fee */}
        <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900 p-4 space-y-3">
          <h3 className="font-semibold text-sm">Biaya Penalti</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Biaya Penalti Penghentian</span>
              <span className="text-lg font-bold text-red-600">{formatCurrency(penaltyFee)}</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Biaya penalti akan dipotong dari saldo tabungan Anda saat pengajuan disetujui.
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Catatan (Opsional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Contoh: Ingin berhenti karena kebutuhan pribadi"
                      className="min-h-20"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator />
            {/* Terms Agreement */}
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
                      DENGAN INI SAYA MENGAJUKAN PENGHENTIAN TABUNGAN DEPOSITO
                    </FormLabel>
                    <FormDescription>
                      Saya memahami bahwa pemotongan gaji untuk setoran deposito akan dihentikan
                      dan dana yang sudah terkumpul tetap tersimpan di tabungan saya.
                    </FormDescription>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />

            {/* Penalty Fee Agreement */}
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
                      SAYA MENYETUJUI BIAYA PENALTI PENGHENTIAN DEPOSITO
                    </FormLabel>
                    <FormDescription>
                      Saya menyetujui biaya penalti sebesar{' '}
                      <span className="font-semibold text-red-600">
                        {formatCurrency(penaltyFee)}
                      </span>{' '}
                      yang akan dipotong dari saldo sukarela saya.
                    </FormDescription>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              {onCancel && (
                <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
                  Batal
                </Button>
              )}
              <Button
                type="submit"
                variant="destructive"
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  <>
                    <StopCircle className="mr-2 h-4 w-4" />
                    Ajukan Penghentian Deposito
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

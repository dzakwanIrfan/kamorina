'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { LoanApplication } from '@/types/loan.types';
import { loanService } from '@/services/loan.service';
import { toast } from 'sonner';
import { Loader2, Calendar, Clock } from 'lucide-react';
import { handleApiError } from '@/lib/axios';
import { cn } from '@/lib/utils';

const formSchema = z.object({
  disbursementDate: z.date({ error: 'Tanggal wajib diisi' }),
  disbursementTime: z
    .string()
    .regex(/^([0-1][0-9]|2[0-3]):([0-5][0-9])$/, 'Format jam harus HH:mm'),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface ProcessDisbursementDialogProps {
  loan: LoanApplication | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function ProcessDisbursementDialog({
  loan,
  open,
  onOpenChange,
  onSuccess,
}: ProcessDisbursementDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      disbursementDate: new Date(),
      disbursementTime: format(new Date(), 'HH:mm'),
      notes: '',
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

  const onSubmit = async (data: FormData) => {
    if (!loan) return;

    try {
      setIsSubmitting(true);
      await loanService.processDisbursement(loan.id, {
        disbursementDate: format(data.disbursementDate, 'yyyy-MM-dd'),
        disbursementTime: data.disbursementTime,
        notes: data.notes || undefined,
      });
      toast.success('Transaksi pencairan berhasil dicatat');
      onSuccess?.();
      onOpenChange(false);
      form.reset();
    } catch (error: any) {
      toast.error(handleApiError(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!loan) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Konfirmasi Transaksi Pencairan</DialogTitle>
          <DialogDescription>
            Masukkan tanggal dan jam transaksi BCA yang sudah dilakukan
          </DialogDescription>
        </DialogHeader>

        {/* Loan Info */}
        <div className="rounded-lg border p-4 bg-muted/50">
          <h4 className="font-semibold mb-3">Detail Pinjaman</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Nomor Pinjaman</p>
              <p className="font-mono font-semibold">{loan.loanNumber}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Pemohon</p>
              <p className="font-semibold">{loan.user?.name}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Jumlah</p>
              <p className="font-bold text-primary">{formatCurrency(loan.loanAmount)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">No. Rekening</p>
              <p className="font-mono">{loan.user?.employee?.bankAccountNumber}</p>
            </div>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Disbursement Date */}
            <FormField
              control={form.control}
              name="disbursementDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Tanggal Transaksi BCA</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full pl-3 text-left font-normal',
                            !field.value && 'text-muted-foreground'
                          )}
                          disabled={isSubmitting}
                        >
                          {field.value ? (
                            format(field.value, 'dd MMMM yyyy', { locale: id })
                          ) : (
                            <span>Pilih tanggal</span>
                          )}
                          <Calendar className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date > new Date() || date < new Date('1900-01-01')}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormDescription>
                    Tanggal ketika transaksi BCA dilakukan
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Disbursement Time */}
            <FormField
              control={form.control}
              name="disbursementTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Jam Transaksi</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="14:30"
                        className="pl-10"
                        {...field}
                        disabled={isSubmitting}
                      />
                    </div>
                  </FormControl>
                  <FormDescription>
                    Format: HH:mm (contoh: 14:30)
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
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Batal
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Konfirmasi Pencairan
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
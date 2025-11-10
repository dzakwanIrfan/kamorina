'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
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
import { Label } from '@/components/ui/label';
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
import { Loader2, DollarSign, Calendar as CalendarIcon } from 'lucide-react';
import { handleApiError } from '@/lib/axios';

const formSchema = z.object({
  loanAmount: z.number().positive('Jumlah pinjaman harus lebih dari 0'),
  loanTenor: z.number().positive('Tenor harus lebih dari 0').min(1, 'Minimal tenor 1 bulan'),
  revisionNotes: z.string().min(10, 'Catatan revisi minimal 10 karakter'),
});

type FormData = z.infer<typeof formSchema>;

interface ReviseLoanDialogProps {
  loan: LoanApplication | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function ReviseLoanDialog({
  loan,
  open,
  onOpenChange,
  onSuccess,
}: ReviseLoanDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      loanAmount: loan?.loanAmount || 0,
      loanTenor: loan?.loanTenor || 12,
      revisionNotes: '',
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
      await loanService.reviseLoan(loan.id, data);
      toast.success('Pinjaman berhasil direvisi');
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
          <DialogTitle>Revisi Pengajuan Pinjaman</DialogTitle>
          <DialogDescription>
            Ubah jumlah pinjaman atau tenor yang diajukan oleh pemohon.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Original Data */}
            <div className="rounded-lg border p-4 bg-muted/50">
              <h4 className="font-semibold mb-3">Data Pengajuan Asli</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Jumlah Pinjaman</p>
                  <p className="font-semibold">{formatCurrency(loan.loanAmount)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Tenor</p>
                  <p className="font-semibold">{loan.loanTenor} Bulan</p>
                </div>
              </div>
            </div>

            {/* Loan Amount */}
            <FormField
              control={form.control}
              name="loanAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Jumlah Pinjaman yang Direvisi</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="number"
                        placeholder="5000000"
                        className="pl-10"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        disabled={isSubmitting}
                      />
                    </div>
                  </FormControl>
                  <FormDescription>
                    Masukkan jumlah pinjaman yang sesuai
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Loan Tenor */}
            <FormField
              control={form.control}
              name="loanTenor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tenor yang Direvisi (Bulan)</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <CalendarIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="number"
                        placeholder="12"
                        className="pl-10"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        disabled={isSubmitting}
                      />
                    </div>
                  </FormControl>
                  <FormDescription>
                    Masukkan tenor yang sesuai
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Revision Notes */}
            <FormField
              control={form.control}
              name="revisionNotes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Catatan Revisi</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Jelaskan alasan revisi..."
                      rows={4}
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormDescription>
                    Catatan ini akan dikirimkan ke pemohon
                  </FormDescription>
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
                Simpan Revisi
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
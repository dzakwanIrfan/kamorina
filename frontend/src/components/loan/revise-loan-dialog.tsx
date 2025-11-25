'use client';

import { useState, useEffect } from 'react';
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
import { LoanApplication, LoanType } from '@/types/loan.types';
import { loanService } from '@/services/loan.service';
import { toast } from 'sonner';
import { Loader2, DollarSign, Calendar as CalendarIcon } from 'lucide-react';
import { handleApiError } from '@/lib/axios';
import { formatCurrency } from '@/lib/loan-utils';

interface ReviseLoanDialogProps {
  loan: LoanApplication | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

function createReviseSchema(loanType: LoanType) {
  const baseSchema = {
    loanTenor: z.number().positive('Tenor harus lebih dari 0').min(1, 'Minimal tenor 1 bulan'),
    revisionNotes: z.string().min(10, 'Catatan revisi minimal 10 karakter'),
  };

  switch (loanType) {
    case LoanType.CASH_LOAN:
      return z.object({
        ...baseSchema,
        loanAmount: z.number().positive('Jumlah pinjaman harus lebih dari 0'),
      });

    case LoanType.GOODS_REIMBURSE:
    case LoanType.GOODS_ONLINE:
      return z.object({
        ...baseSchema,
        itemPrice: z.number().positive('Harga barang harus lebih dari 0'),
      });

    case LoanType.GOODS_PHONE:
      return z.object({
        ...baseSchema,
        retailPrice: z.number().positive('Harga retail harus lebih dari 0'),
        cooperativePrice: z.number().positive('Harga koperasi harus lebih dari 0'),
      });

    default:
      return z.object(baseSchema);
  }
}

export function ReviseLoanDialog({
  loan,
  open,
  onOpenChange,
  onSuccess,
}: ReviseLoanDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formSchema = loan ? createReviseSchema(loan.loanType) : z.object({});

  const form = useForm<any>({
    resolver: zodResolver(formSchema),
  });

  useEffect(() => {
    if (loan && open) {
      const defaultValues: any = {
        loanTenor: loan.loanTenor,
        revisionNotes: '',
      };

      switch (loan.loanType) {
        case LoanType.CASH_LOAN:
          defaultValues.loanAmount = loan.loanAmount;
          break;
        case LoanType.GOODS_REIMBURSE:
          defaultValues.itemPrice = loan.goodsReimburseDetails?.itemPrice || loan.loanAmount;
          break;
        case LoanType.GOODS_ONLINE:
          defaultValues.itemPrice = loan.goodsOnlineDetails?.itemPrice || loan.loanAmount;
          break;
        case LoanType.GOODS_PHONE:
          defaultValues.retailPrice = loan.goodsPhoneDetails?.retailPrice || 0;
          defaultValues.cooperativePrice = loan.goodsPhoneDetails?.cooperativePrice || 0;
          break;
      }

      form.reset(defaultValues);
    }
  }, [loan, open]);

  const onSubmit = async (data: any) => {
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

  const renderOriginalData = () => {
    switch (loan.loanType) {
      case LoanType.CASH_LOAN:
        return (
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
        );

      case LoanType.GOODS_REIMBURSE:
        return (
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Nama Barang</p>
              <p className="font-semibold">{loan.goodsReimburseDetails?.itemName}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Harga Barang</p>
              <p className="font-semibold">
                {formatCurrency(loan.goodsReimburseDetails?.itemPrice || 0)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Tenor</p>
              <p className="font-semibold">{loan.loanTenor} Bulan</p>
            </div>
          </div>
        );

      case LoanType.GOODS_ONLINE:
        return (
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Nama Barang</p>
              <p className="font-semibold">{loan.goodsOnlineDetails?.itemName}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Harga Barang</p>
              <p className="font-semibold">
                {formatCurrency(loan.goodsOnlineDetails?.itemPrice || 0)}
              </p>
            </div>
            <div className="col-span-2">
              <p className="text-muted-foreground">Link Barang</p>
              <a 
                href={loan.goodsOnlineDetails?.itemUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline truncate block"
              >
                {loan.goodsOnlineDetails?.itemUrl}
              </a>
            </div>
            <div>
              <p className="text-muted-foreground">Tenor</p>
              <p className="font-semibold">{loan.loanTenor} Bulan</p>
            </div>
          </div>
        );

      case LoanType.GOODS_PHONE:
        return (
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Nama Handphone</p>
              <p className="font-semibold">{loan.goodsPhoneDetails?.itemName}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Tenor</p>
              <p className="font-semibold">{loan.loanTenor} Bulan</p>
            </div>
            {loan.goodsPhoneDetails?.retailPrice ? (
              <>
                <div>
                  <p className="text-muted-foreground">Harga Retail</p>
                  <p className="font-semibold">
                    {formatCurrency(loan.goodsPhoneDetails.retailPrice)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Harga Koperasi</p>
                  <p className="font-semibold">
                    {formatCurrency(loan.goodsPhoneDetails.cooperativePrice)}
                  </p>
                </div>
              </>
            ) : null}
          </div>
        );
    }
  };

  const renderReviseFields = () => {
    switch (loan.loanType) {
      case LoanType.CASH_LOAN:
        return (
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
                <FormDescription>Masukkan jumlah pinjaman yang sesuai</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        );

      case LoanType.GOODS_REIMBURSE:
      case LoanType.GOODS_ONLINE:
        return (
          <FormField
            control={form.control}
            name="itemPrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Harga Barang yang Direvisi</FormLabel>
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
                <FormDescription>Masukkan harga barang yang sesuai</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        );

      case LoanType.GOODS_PHONE:
        return (
          <>
            <FormField
              control={form.control}
              name="retailPrice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Harga Retail</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="number"
                        placeholder="10000000"
                        className="pl-10"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        disabled={isSubmitting}
                      />
                    </div>
                  </FormControl>
                  <FormDescription>Harga retail dari toko</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cooperativePrice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Harga Koperasi Rekanan</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="number"
                        placeholder="9000000"
                        className="pl-10"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        disabled={isSubmitting}
                      />
                    </div>
                  </FormControl>
                  <FormDescription>
                    Harga dari rekanan koperasi (ini yang akan menjadi jumlah pinjaman)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        );
    }
  };

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
            <div className="rounded-lg border p-4 bg-muted/50">
              <h4 className="font-semibold mb-3">Data Pengajuan Asli</h4>
              {renderOriginalData()}
            </div>

            {renderReviseFields()}

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
                  <FormDescription>Masukkan tenor yang sesuai</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                  <FormDescription>Catatan ini akan dikirimkan ke pemohon</FormDescription>
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
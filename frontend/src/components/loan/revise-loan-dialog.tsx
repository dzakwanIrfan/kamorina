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
import { Loader2, Calendar as CalendarIcon, Percent } from 'lucide-react';
import { FaRupiahSign } from "react-icons/fa6";
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
        partnerMarginPercent: z.number()
          .min(0, 'Margin tidak boleh negatif')
          .max(100, 'Margin maksimal 100%'),
        cooperativePrice: z.number().positive('Harga koperasi harus lebih dari 0'),
      }). refine(
        (data) => data.cooperativePrice <= data.retailPrice,
        {
          message: 'Harga koperasi tidak boleh lebih besar dari harga retail',
          path: ['cooperativePrice'],
        }
      );

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

  // Watch retail price and margin for GOODS_PHONE
  const retailPrice = form.watch('retailPrice');
  const partnerMarginPercent = form.watch('partnerMarginPercent');

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
          const currentRetail = loan.goodsPhoneDetails?.retailPrice || 0;
          const currentCoop = loan.goodsPhoneDetails?.cooperativePrice || 0;
          
          // Calculate existing margin percentage if prices exist
          let existingMargin = 3; // default 3%
          if (currentRetail > 0 && currentCoop > 0 && currentCoop < currentRetail) {
            existingMargin = ((currentRetail - currentCoop) / currentRetail) * 100;
          }
          
          defaultValues.retailPrice = currentRetail;
          defaultValues.cooperativePrice = currentCoop;
          defaultValues.partnerMarginPercent = Math.round(existingMargin * 100) / 100; // round to 2 decimals
          break;
      }

      form.reset(defaultValues);
    }
  }, [loan, open, form]);

  // Auto-calculate cooperativePrice when retailPrice or margin changes (GOODS_PHONE only)
  useEffect(() => {
    if (loan?.loanType === LoanType.GOODS_PHONE && retailPrice > 0 && partnerMarginPercent >= 0) {
      const calculatedCoopPrice = retailPrice - (retailPrice * (partnerMarginPercent / 100));
      form.setValue('cooperativePrice', Math.round(calculatedCoopPrice), { 
        shouldValidate: true 
      });
    }
  }, [retailPrice, partnerMarginPercent, loan?.loanType, form]);

  const onSubmit = async (data: any) => {
    if (!loan) return;

    try {
      setIsSubmitting(true);
      
      // For GOODS_PHONE, ensure cooperativePrice is calculated correctly
      if (loan.loanType === LoanType.GOODS_PHONE) {
        const finalCoopPrice = data.retailPrice - (data.retailPrice * (data.partnerMarginPercent / 100));
        data.cooperativePrice = Math.round(finalCoopPrice);
      }
      
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
        const currentRetail = loan.goodsPhoneDetails?.retailPrice || 0;
        const currentCoop = loan.goodsPhoneDetails?.cooperativePrice || 0;
        let currentMargin = 0;
        
        if (currentRetail > 0 && currentCoop > 0 && currentCoop < currentRetail) {
          currentMargin = ((currentRetail - currentCoop) / currentRetail) * 100;
        }
        
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
                  <p className="text-muted-foreground">Margin Rekanan</p>
                  <p className="font-semibold">
                    {currentMargin > 0 ? `${currentMargin.toFixed(2)}%` : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Harga Koperasi</p>
                  <p className="font-semibold">
                    {formatCurrency(loan.goodsPhoneDetails.cooperativePrice)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Selisih</p>
                  <p className="font-semibold text-green-600">
                    {formatCurrency(currentRetail - currentCoop)}
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
                    <FaRupiahSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
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
                    <FaRupiahSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
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
        const watchedRetail = form.watch('retailPrice') || 0;
        const watchedMargin = form.watch('partnerMarginPercent') || 0;
        const watchedCoop = form.watch('cooperativePrice') || 0;
        const discount = watchedRetail - watchedCoop;
        
        return (
          <>
            <FormField
              control={form.control}
              name="retailPrice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Harga Retail dari Toko</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <FaRupiahSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
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
                  <FormDescription>Harga retail yang diberikan oleh toko</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="partnerMarginPercent"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Persentase Margin Rekanan (%)</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Percent className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="number"
                        placeholder="10"
                        step="0.01"
                        min="0"
                        max="100"
                        className="pl-10"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        disabled={isSubmitting}
                      />
                    </div>
                  </FormControl>
                  <FormDescription>
                    Persentase potongan yang diberikan rekanan (contoh: 10 untuk 10%)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form. control}
              name="cooperativePrice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Harga Koperasi Rekanan</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <FaRupiahSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="number"
                        placeholder="9000000"
                        className="pl-10 bg-muted"
                        {...field}
                        value={field.value || 0}
                        disabled={true}
                        readOnly
                      />
                    </div>
                  </FormControl>
                  <FormDescription>
                    Otomatis terhitung: Retail - (Retail × Margin%)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Display calculation summary */}
            {watchedRetail > 0 && (
              <div className="rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/30 p-4 space-y-2">
                <h4 className="font-semibold mb-3">
                  Ringkasan Perhitungan
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className='text-muted-foreground'>Harga Retail</p>
                    <p className="font-bold">
                      {formatCurrency(watchedRetail)}
                    </p>
                  </div>
                  <div>
                    <p className='text-muted-foreground'>Margin Rekanan</p>
                    <p className="font-bold">
                      {watchedMargin.toFixed(2)}%
                    </p>
                  </div>
                  <div>
                    <p className='text-muted-foreground'>Potongan</p>
                    <p className="font-bold">
                      {formatCurrency(discount)}
                    </p>
                  </div>
                  <div>
                    <p className='text-muted-foreground'>Harga Koperasi</p>
                    <p className="font-bold">
                      {formatCurrency(watchedCoop)}
                    </p>
                  </div>
                </div>
                <div className="pt-2 border-t border-green-200 dark:border-green-800">
                  <p className="text-xs text-green-600">
                    <strong>Jumlah Pinjaman</strong> yang akan diberikan:{' '}
                    <strong>{formatCurrency(watchedCoop)}</strong>
                  </p>
                </div>
              </div>
            )}
          </>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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
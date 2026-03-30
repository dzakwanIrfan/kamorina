'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2 } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { CurrencyInput } from '@/components/ui/currency-input';
import { SocialFundTransaction } from '@/types/social-fund.types';

const formSchema = z.object({
  amount: z
    .string()
    .min(1, 'Jumlah saldo harus diisi')
    .refine((val) => {
      const num = Number(val);
      return !isNaN(num) && num > 0;
    }, 'Jumlah saldo harus lebih dari 0'),
  description: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface InitialBalanceFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: SocialFundTransaction | null;
  onSubmit: (data: { amount: number; description?: string }) => Promise<void>;
  isLoading?: boolean;
}

export function InitialBalanceFormDialog({
  open,
  onOpenChange,
  item,
  onSubmit,
  isLoading = false,
}: InitialBalanceFormDialogProps) {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: '',
      description: '',
    },
  });

  useEffect(() => {
    if (item) {
      form.reset({
        amount: String(item.amount),
        description: item.description || '',
      });
    } else {
      form.reset({
        amount: '',
        description: '',
      });
    }
  }, [item, form]);

  const handleSubmit = async (data: FormData) => {
    await onSubmit({
      amount: Number(data.amount),
      description: data.description || undefined,
    });
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {item ? 'Edit Saldo Awal' : 'Tambah Saldo Awal'}
          </DialogTitle>
          <DialogDescription>
            {item
              ? 'Update jumlah saldo awal dana sosial'
              : 'Tambahkan saldo awal untuk dana sosial'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Jumlah (Rupiah)</FormLabel>
                  <FormControl>
                    <CurrencyInput
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Masukkan jumlah saldo"
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Keterangan (Opsional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Contoh: Saldo Awal Dana Sosial Tahun 2026"
                      {...field}
                      disabled={isLoading}
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
                disabled={isLoading}
              >
                Batal
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : item ? (
                  'Update'
                ) : (
                  'Tambah'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

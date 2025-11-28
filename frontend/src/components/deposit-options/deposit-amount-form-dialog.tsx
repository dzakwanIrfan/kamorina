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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { DepositAmountOption } from '@/types/deposit-option.types';

const formSchema = z.object({
  code: z
    .string()
    .min(1, 'Kode tidak boleh kosong')
    .max(50, 'Kode maksimal 50 karakter')
    .regex(/^[A-Z0-9_]+$/, 'Kode hanya boleh huruf kapital, angka, dan underscore'),
  label: z
    .string()
    .min(1, 'Label tidak boleh kosong')
    .max(100, 'Label maksimal 100 karakter'),
  amount: z
    .number({ error: 'Jumlah harus berupa angka' })
    .min(0, 'Jumlah minimal 0'),
  isActive: z.boolean(),
  sortOrder: z
    .number({ error: 'Urutan harus berupa angka' })
    .min(0, 'Urutan minimal 0'),
});

type FormData = z.infer<typeof formSchema>;

interface DepositAmountFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: DepositAmountOption | null;
  onSubmit: (data: FormData) => Promise<void>;
  isLoading?: boolean;
}

export function DepositAmountFormDialog({
  open,
  onOpenChange,
  item,
  onSubmit,
  isLoading = false,
}: DepositAmountFormDialogProps) {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: '',
      label: '',
      amount: 0,
      isActive: true,
      sortOrder: 0,
    },
  });

  useEffect(() => {
    if (item) {
      form.reset({
        code: item.code,
        label: item.label,
        amount: item.amount,
        isActive: item.isActive,
        sortOrder: item.sortOrder,
      });
    } else {
      form.reset({
        code: '',
        label: '',
        amount: 0,
        isActive: true,
        sortOrder: 0,
      });
    }
  }, [item, form]);

  const handleSubmit = async (data: FormData) => {
    await onSubmit(data);
    form.reset();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {item ? 'Edit Opsi Jumlah Deposito' : 'Tambah Opsi Jumlah Deposito'}
          </DialogTitle>
          <DialogDescription>
            {item
              ? 'Update informasi opsi jumlah deposito'
              : 'Buat opsi jumlah deposito baru'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kode</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Contoh: AMOUNT_500K"
                      {...field}
                      onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormDescription>
                    Kode unik untuk identifikasi (huruf kapital, angka, underscore)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="label"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Label</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Contoh: Rp 500.000"
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormDescription>
                    Label yang ditampilkan ke pengguna
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Jumlah (Rupiah)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="500000"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormDescription>
                    {field.value > 0 && `Preview: ${formatCurrency(field.value)}`}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="sortOrder"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Urutan</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Status Aktif</FormLabel>
                      <FormDescription className="text-xs">
                        Tampilkan di form deposito
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isLoading}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

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
'use client';

import { UseFormReturn } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { DollarSign, ShoppingCart, Link as LinkIcon } from 'lucide-react';
import { formatCurrency } from '@/lib/loan-utils';

interface GoodsOnlineFieldsProps {
  form: UseFormReturn<any>;
  maxAmount: number;
  isSubmitting: boolean;
}

export function GoodsOnlineFields({ form, maxAmount, isSubmitting }: GoodsOnlineFieldsProps) {
  return (
    <>
      <FormField
        control={form.control}
        name="itemName"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Nama Barang</FormLabel>
            <FormControl>
              <div className="relative">
                <ShoppingCart className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Laptop, Smartphone, dll"
                  className="pl-10"
                  {...field}
                  disabled={isSubmitting}
                />
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="itemPrice"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Harga Barang</FormLabel>
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
              Maksimal {formatCurrency(maxAmount)}
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="itemUrl"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Link Barang</FormLabel>
            <FormControl>
              <div className="relative">
                <LinkIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  type="url"
                  placeholder="https://tokopedia.com/..."
                  className="pl-10"
                  {...field}
                  disabled={isSubmitting}
                />
              </div>
            </FormControl>
            <FormDescription>
              URL lengkap produk dari toko online (Tokopedia, Shopee, dll)
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="notes"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Catatan Tambahan (Opsional)</FormLabel>
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
    </>
  );
}
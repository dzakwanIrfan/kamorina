'use client';

import { UseFormReturn } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Calendar, DollarSign, ShoppingBag } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/loan-utils';

interface GoodsReimburseFieldsProps {
  form: UseFormReturn<any>;
  maxAmount: number;
  isSubmitting: boolean;
}

export function GoodsReimburseFields({ form, maxAmount, isSubmitting }: GoodsReimburseFieldsProps) {
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
                <ShoppingBag className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Laptop, Kulkas, dll"
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
        name="purchaseDate"
        render={({ field }) => (
          <FormItem className="flex flex-col">
            <FormLabel>Tanggal Pembelian</FormLabel>
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
                      format(new Date(field.value), 'dd MMMM yyyy', { locale: id })
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
                  selected={field.value ? new Date(field.value) : undefined}
                  onSelect={(date) => field.onChange(date ? format(date, 'yyyy-MM-dd') : '')}
                  disabled={(date) => date > new Date() || date < new Date('1900-01-01')}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <FormDescription>
              Tanggal ketika barang dibeli
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
'use client';

import { UseFormReturn } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Smartphone, Info } from 'lucide-react';

interface GoodsPhoneFieldsProps {
  form: UseFormReturn<any>;
  isSubmitting: boolean;
}

export function GoodsPhoneFields({ form, isSubmitting }: GoodsPhoneFieldsProps) {
  return (
    <>
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Untuk kredit handphone, harga retail dan harga koperasi akan diisi oleh Divisi Simpan Pinjam 
          setelah mengecek harga dengan rekanan koperasi.
        </AlertDescription>
      </Alert>

      <FormField
        control={form.control}
        name="itemName"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Nama / Tipe Handphone</FormLabel>
            <FormControl>
              <div className="relative">
                <Smartphone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="iPhone 15 Pro, Samsung Galaxy S24, dll"
                  className="pl-10"
                  {...field}
                  disabled={isSubmitting}
                />
              </div>
            </FormControl>
            <FormDescription>
              Sebutkan merek, tipe, dan spesifikasi handphone yang diinginkan
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
            <FormLabel>Spesifikasi & Catatan</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Contoh: RAM 8GB, Storage 256GB, Warna Hitam, dll..."
                rows={4}
                {...field}
                disabled={isSubmitting}
              />
            </FormControl>
            <FormDescription>
              Jelaskan spesifikasi detail handphone yang Anda inginkan
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
}
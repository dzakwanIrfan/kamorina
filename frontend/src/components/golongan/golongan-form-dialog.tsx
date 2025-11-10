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
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Golongan } from '@/types/golongan.types';

const golonganSchema = z.object({
  golonganName: z
    .string()
    .min(1, 'Nama golongan minimal 1 karakter')
    .max(10, 'Nama golongan maksimal 10 karakter'),
  description: z.string().max(255, 'Deskripsi maksimal 255 karakter').optional(),
});

type GolonganFormValues = z.infer<typeof golonganSchema>;

interface GolonganFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  golongan?: Golongan | null;
  onSubmit: (data: GolonganFormValues) => Promise<void>;
  isLoading?: boolean;
}

export function GolonganFormDialog({
  open,
  onOpenChange,
  golongan,
  onSubmit,
  isLoading = false,
}: GolonganFormDialogProps) {
  const form = useForm<GolonganFormValues>({
    resolver: zodResolver(golonganSchema),
    defaultValues: {
      golonganName: '',
      description: '',
    },
  });

  useEffect(() => {
    if (golongan) {
      form.reset({
        golonganName: golongan.golonganName,
        description: golongan.description || '',
      });
    } else {
      form.reset({
        golonganName: '',
        description: '',
      });
    }
  }, [golongan, form]);

  const handleSubmit = async (data: GolonganFormValues) => {
    await onSubmit(data);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{golongan ? 'Edit Golongan' : 'Tambah Golongan'}</DialogTitle>
          <DialogDescription>
            {golongan
              ? 'Update informasi golongan karyawan'
              : 'Buat golongan baru untuk klasifikasi karyawan'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="golonganName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama Golongan</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Contoh: I, II, III, IV"
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    Nama golongan untuk klasifikasi karyawan
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deskripsi (Opsional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Contoh: Golongan I - Staff Junior"
                      {...field}
                      disabled={isLoading}
                      rows={3}
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
                ) : golongan ? (
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
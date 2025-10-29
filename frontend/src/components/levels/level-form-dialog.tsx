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
import { Level } from '@/types/level.types';

const levelSchema = z.object({
  levelName: z
    .string()
    .min(2, 'Nama level minimal 2 karakter')
    .max(50, 'Nama level maksimal 50 karakter')
    .transform((val) => val.toLowerCase()),
  description: z.string().max(255, 'Deskripsi maksimal 255 karakter').optional(),
});

type LevelFormValues = z.infer<typeof levelSchema>;

interface LevelFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  level?: Level | null;
  onSubmit: (data: LevelFormValues) => Promise<void>;
  isLoading?: boolean;
}

export function LevelFormDialog({
  open,
  onOpenChange,
  level,
  onSubmit,
  isLoading = false,
}: LevelFormDialogProps) {
  const form = useForm<LevelFormValues>({
    resolver: zodResolver(levelSchema),
    defaultValues: {
      levelName: '',
      description: '',
    },
  });

  useEffect(() => {
    if (level) {
      form.reset({
        levelName: level.levelName,
        description: level.description || '',
      });
    } else {
      form.reset({
        levelName: '',
        description: '',
      });
    }
  }, [level, form]);

  const handleSubmit = async (data: LevelFormValues) => {
    await onSubmit(data);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{level ? 'Edit Level' : 'Tambah Level'}</DialogTitle>
          <DialogDescription>
            {level
              ? 'Update informasi level/role'
              : 'Buat level/role baru untuk sistem'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="levelName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama Level</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Contoh: ketua, bendahara, pengawas"
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    Nama level akan otomatis diubah ke lowercase
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
                      placeholder="Deskripsi singkat tentang level ini"
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
                ) : level ? (
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
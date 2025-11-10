'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
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
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { loanService } from '@/services/loan.service';
import { toast } from 'sonner';
import { Loader2, Calendar, Clock } from 'lucide-react';
import { handleApiError } from '@/lib/axios';
import { cn } from '@/lib/utils';

const formSchema = z.object({
  authorizationDate: z.date({ error: 'Tanggal wajib diisi' }),
  authorizationTime: z
    .string()
    .regex(/^([0-1][0-9]|2[0-3]):([0-5][0-9])$/, 'Format jam harus HH:mm'),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface BulkProcessAuthorizationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedIds: string[];
  onSuccess?: () => void;
}

export function BulkProcessAuthorizationDialog({
  open,
  onOpenChange,
  selectedIds,
  onSuccess,
}: BulkProcessAuthorizationDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      authorizationDate: new Date(),
      authorizationTime: format(new Date(), 'HH:mm'),
      notes: '',
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      setIsSubmitting(true);
      const result = await loanService.bulkProcessAuthorization({
        loanIds: selectedIds,
        authorizationDate: format(data.authorizationDate, 'yyyy-MM-dd'),
        authorizationTime: data.authorizationTime,
        notes: data.notes || undefined,
      });

      toast.success(result.message);

      if (result.results.failed.length > 0) {
        toast.warning(`${result.results.failed.length} pinjaman gagal diproses`);
      }

      onSuccess?.();
      onOpenChange(false);
      form.reset();
    } catch (error: any) {
      toast.error(handleApiError(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Otorisasi Massal</DialogTitle>
          <DialogDescription>
            Konfirmasi otorisasi untuk {selectedIds.length} pinjaman sekaligus
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Authorization Date */}
            <FormField
              control={form.control}
              name="authorizationDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Tanggal Otorisasi</FormLabel>
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
                            format(field.value, 'dd MMMM yyyy', { locale: id })
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
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date > new Date() || date < new Date('1900-01-01')}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormDescription>
                    Tanggal ketika otorisasi dilakukan
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Authorization Time */}
            <FormField
              control={form.control}
              name="authorizationTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Jam Otorisasi</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="14:30"
                        className="pl-10"
                        {...field}
                        disabled={isSubmitting}
                      />
                    </div>
                  </FormControl>
                  <FormDescription>
                    Format: HH:mm (contoh: 14:30)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Catatan (Opsional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Tambahkan catatan untuk semua otorisasi..."
                      rows={3}
                      {...field}
                      disabled={isSubmitting}
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
                disabled={isSubmitting}
              >
                Batal
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Konfirmasi {selectedIds.length} Otorisasi
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
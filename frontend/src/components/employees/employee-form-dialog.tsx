'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';

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
import { employeeService } from '@/services/employee.service';
import { Employee } from '@/types/employee.types';

const formSchema = z.object({
  employeeNumber: z
    .string()
    .length(9, 'Nomor karyawan harus 9 digit')
    .regex(/^[0-9]+$/, 'Nomor karyawan harus berupa angka'),
  fullName: z.string().min(1, 'Nama lengkap wajib diisi'),
  isActive: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

interface EmployeeFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee?: Employee | null;
  onSuccess?: () => void;
}

export function EmployeeFormDialog({
  open,
  onOpenChange,
  employee,
  onSuccess,
}: EmployeeFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEdit = !!employee;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      employeeNumber: '',
      fullName: '',
      isActive: true,
    },
  });

  useEffect(() => {
    if (employee) {
      form.reset({
        employeeNumber: employee.employeeNumber,
        fullName: employee.fullName,
        isActive: employee.isActive,
      });
    } else {
      form.reset({
        employeeNumber: '',
        fullName: '',
        isActive: true,
      });
    }
  }, [employee, form]);

  const onSubmit = async (data: FormValues) => {
    try {
      setIsSubmitting(true);

      if (isEdit && employee) {
        const result = await employeeService.update(employee.id, data);
        toast.success(result.message);
      } else {
        const result = await employeeService.create(data);
        toast.success(result.message);
      }

      onSuccess?.();
      onOpenChange(false);
      form.reset();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Terjadi kesalahan');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Karyawan' : 'Tambah Karyawan'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Perbarui informasi karyawan'
              : 'Tambahkan karyawan baru ke sistem'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="employeeNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nomor Karyawan</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="100000001"
                      maxLength={9}
                      {...field}
                      disabled={isEdit}
                    />
                  </FormControl>
                  <FormDescription>9 digit angka</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama Lengkap</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Status Aktif</FormLabel>
                    <FormDescription>
                      Karyawan yang aktif dapat digunakan dalam sistem
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
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
                {isSubmitting ? 'Menyimpan...' : isEdit ? 'Simpan' : 'Tambah'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
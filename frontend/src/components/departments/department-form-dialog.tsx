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
import { Department } from '@/types/department.types';

const departmentSchema = z.object({
  departmentName: z
    .string()
    .min(2, 'Nama department minimal 2 karakter')
    .max(100, 'Nama department maksimal 100 karakter'),
});

type DepartmentFormValues = z.infer<typeof departmentSchema>;

interface DepartmentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  department?: Department | null;
  onSubmit: (data: DepartmentFormValues) => Promise<void>;
  isLoading?: boolean;
}

export function DepartmentFormDialog({
  open,
  onOpenChange,
  department,
  onSubmit,
  isLoading = false,
}: DepartmentFormDialogProps) {
  const form = useForm<DepartmentFormValues>({
    resolver: zodResolver(departmentSchema),
    defaultValues: {
      departmentName: '',
    },
  });

  useEffect(() => {
    if (department) {
      form.reset({
        departmentName: department.departmentName,
      });
    } else {
      form.reset({
        departmentName: '',
      });
    }
  }, [department, form]);

  const handleSubmit = async (data: DepartmentFormValues) => {
    await onSubmit(data);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {department ? 'Edit Department' : 'Tambah Department'}
          </DialogTitle>
          <DialogDescription>
            {department
              ? 'Update informasi department'
              : 'Buat department baru untuk organisasi'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="departmentName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama Department</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Contoh: IT, Finance, HR"
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
                ) : department ? (
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
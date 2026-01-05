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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { employeeService } from '@/services/employee.service';
import { departmentService } from '@/services/department.service';
import { golonganService } from '@/services/golongan.service';
import { Employee, EmployeeType } from '@/types/employee.types';
import { Department } from '@/types/department.types';
import { Golongan } from '@/types/golongan.types';

const formSchema = z.object({
  employeeNumber: z
    .string()
    .max(10, 'Nomor Induk karyawan maksimal 10 digit')
    .regex(/^[K]?[0-9]+$/, 'Nomor Induk Karyawan harus berupa angka'),
  fullName: z.string().min(1, 'Nama lengkap wajib diisi'),
  departmentId: z.string().min(1, 'Department wajib dipilih'),
  golonganId: z.string().min(1, 'Golongan wajib dipilih'),
  employeeType: z.enum(EmployeeType, {
    error: () => ({ message: 'Tipe karyawan wajib dipilih' }),
  }),
  permanentEmployeeDate: z.string().optional(),
  bankAccountNumber: z.string().min(1, 'Nomor Rekening Bank wajib diisi'),
});

type FormValues = z.infer<typeof formSchema>;

interface EmployeeFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee?: Employee | null;
  onSuccess?: () => void;
}

const employeeTypeLabels: Record<EmployeeType, string> = {
  [EmployeeType.TETAP]: 'Pegawai Tetap',
  [EmployeeType.KONTRAK]: 'Kontrak',
};

export function EmployeeFormDialog({
  open,
  onOpenChange,
  employee,
  onSuccess,
}: EmployeeFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [golongans, setGolongans] = useState<Golongan[]>([]);
  const [isLoadingDepts, setIsLoadingDepts] = useState(true);
  const [isLoadingGolongans, setIsLoadingGolongans] = useState(true);
  const isEdit = !!employee;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      employeeNumber: '',
      fullName: '',
      departmentId: '',
      golonganId: '',
      employeeType: EmployeeType.TETAP,
      permanentEmployeeDate: '',
      bankAccountNumber: '',
    },
  });

  useEffect(() => {
    if (open) {
      fetchDepartments();
      fetchGolongans();
    }
  }, [open]);

  useEffect(() => {
    if (employee) {
      form.reset({
        employeeNumber: employee.employeeNumber,
        fullName: employee.fullName,
        departmentId: employee.departmentId,
        golonganId: employee.golonganId,
        employeeType: employee.employeeType,
        permanentEmployeeDate: employee.permanentEmployeeDate 
          ? new Date(employee.permanentEmployeeDate).toISOString().split('T')[0]
          : '',
        bankAccountNumber: employee.bankAccountNumber,
      });
    } else {
      form.reset({
        employeeNumber: '',
        fullName: '',
        departmentId: '',
        golonganId: '',
        employeeType: EmployeeType.TETAP,
        permanentEmployeeDate: '',
        bankAccountNumber: '',
      });
    }
  }, [employee, form]);

  const fetchDepartments = async () => {
    try {
      setIsLoadingDepts(true);
      const response = await departmentService.getAll({ limit: 100 });
      setDepartments(response.data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal memuat data department');
    } finally {
      setIsLoadingDepts(false);
    }
  };

  const fetchGolongans = async () => {
    try {
      setIsLoadingGolongans(true);
      const response = await golonganService.getAll({ limit: 100 });
      setGolongans(response.data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal memuat data golongan');
    } finally {
      setIsLoadingGolongans(false);
    }
  };

  const onSubmit = async (data: FormValues) => {
    try {
      setIsSubmitting(true);

      const payload = {
        ...data,
        permanentEmployeeDate: data.permanentEmployeeDate 
          ? new Date(data.permanentEmployeeDate) 
          : null,
      };

      if (isEdit && employee) {
        const result = await employeeService.update(employee.id, payload);
        toast.success(result.message);
      } else {
        const result = await employeeService.create(payload);
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
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
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
                  <FormLabel>Nomor Induk Karyawan</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="100000001"
                      maxLength={10}
                      {...field}
                      // disabled={isEdit || isSubmitting}
                    />
                  </FormControl>
                  <FormDescription>9/10 digit angka</FormDescription>
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
                    <Input placeholder="John Doe" {...field} disabled={isSubmitting} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bankAccountNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nomor Rekening Bank</FormLabel>
                  <FormControl>
                    <Input placeholder="1234567890" {...field} disabled={isSubmitting} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="departmentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Department</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isLoadingDepts || isSubmitting}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih department" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id}>
                          {dept.departmentName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="golonganId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Golongan</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isLoadingGolongans || isSubmitting}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih golongan" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {golongans.map((gol) => (
                        <SelectItem key={gol.id} value={gol.id}>
                          {gol.golonganName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="employeeType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipe Karyawan</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isSubmitting}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih tipe karyawan" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(employeeTypeLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="permanentEmployeeDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tanggal Karyawan Permanen</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
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
                {isSubmitting ? 'Menyimpan...' : isEdit ? 'Simpan' : 'Tambah'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
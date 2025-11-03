'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { memberApplicationService } from '@/services/member-application.service';
import { handleApiError } from '@/lib/axios';

const formSchema = z.object({
  nik: z
    .string()
    .length(16, 'NIK harus 16 digit')
    .regex(/^[0-9]+$/, 'NIK harus berupa angka'),
  npwp: z
    .string()
    .length(16, 'NPWP harus 16 digit')
    .regex(/^[0-9]+$/, 'NPWP harus berupa angka'),
  dateOfBirth: z.date({
    error: 'Tanggal lahir wajib diisi',
  }),
  birthPlace: z.string().min(1, 'Tempat lahir wajib diisi'),
  permanentEmployeeDate: z.date({
    error: 'Tanggal pegawai tetap wajib diisi',
  }),
  installmentPlan: z.number().min(1).max(2),
});

type FormData = z.infer<typeof formSchema>;

interface MemberApplicationFormProps {
  onSuccess: () => void;
}

export function MemberApplicationForm({ onSuccess }: MemberApplicationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nik: '',
      npwp: '',
      birthPlace: '',
      installmentPlan: 1,
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      setIsSubmitting(true);

      const payload = {
        ...data,
        dateOfBirth: format(data.dateOfBirth, 'yyyy-MM-dd'),
        permanentEmployeeDate: format(data.permanentEmployeeDate, 'yyyy-MM-dd'),
      };

      const response = await memberApplicationService.submitApplication(payload);
      toast.success(response.message);
      onSuccess();
    } catch (error) {
      const errorMessage = handleApiError(error);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Formulir Pendaftaran Anggota Koperasi</CardTitle>
        <CardDescription>
          Lengkapi data berikut untuk mendaftar sebagai anggota koperasi. Data Anda akan
          diverifikasi oleh Divisi Simpan Pinjam dan Ketua Koperasi.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* NIK */}
            <FormField
              control={form.control}
              name="nik"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>NIK (Nomor Induk Kependudukan)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="1234567890123456"
                      maxLength={16}
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormDescription>16 digit angka sesuai KTP</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* NPWP */}
            <FormField
              control={form.control}
              name="npwp"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>NPWP</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="1234567890123456"
                      maxLength={16}
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormDescription>16 digit angka NPWP</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Date of Birth */}
            <FormField
              control={form.control}
              name="dateOfBirth"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Tanggal Lahir</FormLabel>
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
                            format(field.value, 'dd MMMM yyyy')
                          ) : (
                            <span>Pilih tanggal</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date > new Date() || date < new Date('1900-01-01')
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormDescription>Tanggal lahir sesuai KTP</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Birth Place */}
            <FormField
              control={form.control}
              name="birthPlace"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tempat Lahir</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Jakarta"
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormDescription>Tempat lahir sesuai KTP</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Permanent Employee Date */}
            <FormField
              control={form.control}
              name="permanentEmployeeDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Tanggal Pegawai Tetap</FormLabel>
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
                            format(field.value, 'dd MMMM yyyy')
                          ) : (
                            <span>Pilih tanggal</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date > new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormDescription>
                    Tanggal Anda diangkat sebagai pegawai tetap
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Installment Plan */}
            <FormField
              control={form.control}
              name="installmentPlan"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rencana Cicilan</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(parseInt(value))}
                    defaultValue={field.value?.toString()}
                    disabled={isSubmitting}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih rencana cicilan" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="1">1x dalam sebulan</SelectItem>
                      <SelectItem value="2">2x dalam sebulan</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Pilih frekuensi cicilan simpanan per bulan
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Pendaftaran
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
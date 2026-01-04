'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { CalendarIcon, Loader2, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { memberApplicationService } from '@/services/member-application.service';
import { settingsService } from '@/services/setting.service';
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
  installmentPlan: z.number().min(1).max(2),
  agreeToTerms: z.boolean().refine((val) => val === true, {
    message: 'Anda harus menyetujui syarat dan ketentuan',
  }),
});

type FormData = z.infer<typeof formSchema>;

interface MemberApplicationFormProps {
  onSuccess: () => void;
}

// Custom Calendar with Year and Month Selector
function DatePickerWithYearMonth({
  date,
  onSelect,
  disabled,
}: {
  date?: Date;
  onSelect: (date: Date | undefined) => void;
  disabled?: boolean;
}) {
  const [currentMonth, setCurrentMonth] = useState(date || new Date());
  const currentYear = currentMonth.getFullYear();
  const currentMonthIndex = currentMonth.getMonth();

  const years = Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i);
  const months = [
    'Januari',
    'Februari',
    'Maret',
    'April',
    'Mei',
    'Juni',
    'Juli',
    'Agustus',
    'September',
    'Oktober',
    'November',
    'Desember',
  ];

  const handleYearChange = (year: string) => {
    const newDate = new Date(currentMonth);
    newDate.setFullYear(parseInt(year));
    setCurrentMonth(newDate);
  };

  const handleMonthChange = (monthIndex: string) => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(parseInt(monthIndex));
    setCurrentMonth(newDate);
  };

  return (
    <div className="p-3">
      {/* Year and Month Selectors */}
      <div className="flex gap-2 mb-3">
        <Select value={currentMonthIndex.toString()} onValueChange={handleMonthChange}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {months.map((month, index) => (
              <SelectItem key={index} value={index.toString()}>
                {month}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={currentYear.toString()} onValueChange={handleYearChange}>
          <SelectTrigger className="w-[110px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="max-h-[200px]">
            {years.map((year) => (
              <SelectItem key={year} value={year.toString()}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Calendar */}
      <Calendar
        mode="single"
        selected={date}
        onSelect={onSelect}
        month={currentMonth}
        onMonthChange={setCurrentMonth}
        disabled={(date) => date > new Date() || date < new Date('1900-01-01')}
        initialFocus
      />
    </div>
  );
}

// Custom Calendar for Permanent Employee Date
function DatePickerForEmployeeDate({
  date,
  onSelect,
  disabled,
}: {
  date?: Date;
  onSelect: (date: Date | undefined) => void;
  disabled?: boolean;
}) {
  const [currentMonth, setCurrentMonth] = useState(date || new Date());
  const currentYear = currentMonth.getFullYear();
  const currentMonthIndex = currentMonth.getMonth();

  const years = Array.from({ length: 50 }, (_, i) => new Date().getFullYear() - i);
  const months = [
    'Januari',
    'Februari',
    'Maret',
    'April',
    'Mei',
    'Juni',
    'Juli',
    'Agustus',
    'September',
    'Oktober',
    'November',
    'Desember',
  ];

  const handleYearChange = (year: string) => {
    const newDate = new Date(currentMonth);
    newDate.setFullYear(parseInt(year));
    setCurrentMonth(newDate);
  };

  const handleMonthChange = (monthIndex: string) => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(parseInt(monthIndex));
    setCurrentMonth(newDate);
  };

  return (
    <div className="p-3">
      {/* Year and Month Selectors */}
      <div className="flex gap-2 mb-3">
        <Select value={currentMonthIndex.toString()} onValueChange={handleMonthChange}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {months.map((month, index) => (
              <SelectItem key={index} value={index.toString()}>
                {month}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={currentYear.toString()} onValueChange={handleYearChange}>
          <SelectTrigger className="w-[110px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="max-h-[200px]">
            {years.map((year) => (
              <SelectItem key={year} value={year.toString()}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Calendar */}
      <Calendar
        mode="single"
        selected={date}
        onSelect={onSelect}
        month={currentMonth}
        onMonthChange={setCurrentMonth}
        disabled={(date) => date > new Date()}
        initialFocus
      />
    </div>
  );
}

export function MemberApplicationForm({ onSuccess }: MemberApplicationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [initialMembershipFee, setInitialMembershipFee] = useState<number>(0);
  const [monthlyMembershipFee, setMonthlyMembershipFee] = useState<number>(0);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nik: '',
      npwp: '',
      birthPlace: '',
      installmentPlan: 1,
      agreeToTerms: false,
    },
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setIsLoadingSettings(true);
        const [initialFeeSetting, monthlyFeeSetting] = await Promise.all([
          settingsService.getByKey('initial_membership_fee'),
          settingsService.getByKey('monthly_membership_fee'),
        ]);

        setInitialMembershipFee(parseFloat(initialFeeSetting.value));
        setMonthlyMembershipFee(parseFloat(monthlyFeeSetting.value));
      } catch (error) {
        console.error('Failed to fetch settings:', error);
        toast.error('Gagal memuat data pengaturan koperasi');
      } finally {
        setIsLoadingSettings(false);
      }
    };

    fetchSettings();
  }, []);

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getPaymentAmount = (installmentPlan: number): string => {
    if (installmentPlan === 1) {
      return formatCurrency(initialMembershipFee);
    } else {
      const perMonth = initialMembershipFee / 2;
      return `${formatCurrency(perMonth)} x 2 bulan`;
    }
  };

  const onSubmit = async (data: FormData) => {
    try {
      setIsSubmitting(true);

      // Destructure to remove agreeToTerms before sending to backend
      const { agreeToTerms, ...payloadData } = data;

      const payload = {
        ...payloadData,
        dateOfBirth: format(payloadData.dateOfBirth, 'yyyy-MM-dd'),
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

  if (isLoadingSettings) {
    return (
      <Card className="w-full max-w-3xl mx-auto">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

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
                  <FormDescription>
                    16 digit angka sesuai KTP. <strong>Diperlukan untuk keperluan legalitas koperasi.</strong>
                  </FormDescription>
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
                  <FormDescription>
                    16 digit angka NPWP. <strong>Diperlukan untuk keperluan legalitas koperasi.</strong>
                  </FormDescription>
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
                      <DatePickerWithYearMonth
                        date={field.value}
                        onSelect={field.onChange}
                        disabled={isSubmitting}
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

            {/* Installment Plan - Now "Uang Pendaftaran" */}
            <FormField
              control={form.control}
              name="installmentPlan"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Uang Pendaftaran</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(parseInt(value))}
                    defaultValue={field.value?.toString()}
                    disabled={isSubmitting}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih metode pembayaran" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="1">
                        <div className="flex flex-col items-start">
                          <span className="font-semibold">Angsuran I - Lunas Langsung</span>
                          <span className="text-sm text-muted-foreground">
                            {getPaymentAmount(1)} (dipotong 1x dari gaji)
                          </span>
                        </div>
                      </SelectItem>
                      <SelectItem value="2">
                        <div className="flex flex-col items-start">
                          <span className="font-semibold">Angsuran II - Bayar 2x</span>
                          <span className="text-sm text-muted-foreground">
                            {getPaymentAmount(2)} (dipotong dari gaji)
                          </span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Pilih metode pembayaran uang pendaftaran (akan dipotong langsung dari gaji)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Terms and Conditions */}
            <div className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Syarat Menjadi Anggota Koperasi</AlertTitle>
                <AlertDescription>
                  <ol className="list-decimal list-inside space-y-2 mt-2">
                    <li>Karyawan tetap PT. Kalbe Morinaga Indonesia.</li>
                    <li>
                      Kesanggupan untuk melunasi uang pendaftaran seperti tertera di atas
                      dan akan dipotong langsung dari gaji.
                    </li>
                    <li>
                      Membayar iuran anggota setiap bulan sesuai ketentuan dan akan
                      dipotong langsung dari gaji.
                    </li>
                    <li>
                      Menyetujui dan mematuhi isi arahan & aturan kebijakan koperasi.
                    </li>
                    <li>
                      Berpartisipasi dalam kegiatan koperasi, ikut mengembangkan dan
                      memelihara kebersamaan.
                    </li>
                  </ol>
                  <p className="mt-4 font-semibold text-center">
                    DENGAN INI SAYA MENGAJUKAN DIRI MENJADI ANGGOTA KOPERASI DAN MEMENUHI SEMUA SYARAT YANG DITETAPKAN
                  </p>
                </AlertDescription>
              </Alert>

              <FormField
                control={form.control}
                name="agreeToTerms"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="font-semibold">
                        Saya menyetujui syarat dan ketentuan di atas
                      </FormLabel>
                      <FormDescription>
                        Anda harus menyetujui syarat dan ketentuan untuk melanjutkan pendaftaran
                      </FormDescription>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />
            </div>

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
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { Loader2, Upload, X, FileText, DollarSign, Calendar as CalendarIcon } from 'lucide-react';

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
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { loanService } from '@/services/loan.service';
import { settingsService } from '@/services/setting.service';
import { handleApiError } from '@/lib/axios';
import { useAuthStore } from '@/store/auth.store';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/jpeg',
  'image/jpg',
  'image/png',
];

interface LoanFormProps {
  onSuccess: () => void;
  onCancel?: () => void;
}

export function LoanForm({ onSuccess, onCancel }: LoanFormProps) {
  const { user } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  
  // Settings
  const [minLoanAmount, setMinLoanAmount] = useState(1000000);
  const [maxLoanAmount, setMaxLoanAmount] = useState(50000000);
  const [maxLoanTenor, setMaxLoanTenor] = useState(36);
  const [loanInterestRate, setLoanInterestRate] = useState(12);

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formSchema = z.object({
    bankAccountNumber: z
        .string()
        .min(10, 'Nomor rekening minimal 10 digit')
        .max(20, 'Nomor rekening maksimal 20 digit')
        .regex(/^[0-9]+$/, 'Nomor rekening harus berupa angka')
        .optional()
        .or(z.literal('')),
    loanAmount: z
        .number()
        .positive('Jumlah pinjaman harus lebih dari 0')
        .min(minLoanAmount, `Jumlah pinjaman minimal ${formatCurrency(minLoanAmount)}`)
        .max(maxLoanAmount, `Jumlah pinjaman maksimal ${formatCurrency(maxLoanAmount)}`),
    loanTenor: z
        .number()
        .positive('Tenor harus lebih dari 0')
        .min(1, 'Minimal tenor 1 bulan')
        .max(maxLoanTenor, `Maksimal tenor ${maxLoanTenor} bulan`),
    loanPurpose: z.string().min(10, 'Alasan peminjaman minimal 10 karakter'),
    });

    type FormData = z.infer<typeof formSchema>;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      bankAccountNumber: user?.bankAccountNumber || '',
      loanAmount: 0,
      loanTenor: 12,
      loanPurpose: '',
    },
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setIsLoadingSettings(true);
      const [minLoan, maxLoan, maxTenor, interestRate] = await Promise.all([
        settingsService.getByKey('min_loan_amount').catch(() => ({ value: '1000000' })),
        settingsService.getByKey('max_loan_amount').catch(() => ({ value: '50000000' })),
        settingsService.getByKey('max_loan_tenor').catch(() => ({ value: '36' })),
        settingsService.getByKey('loan_interest_rate').catch(() => ({ value: '12' })),
      ]);

      setMinLoanAmount(parseFloat(minLoan.value));
      setMaxLoanAmount(parseFloat(maxLoan.value));
      setMaxLoanTenor(parseInt(maxTenor.value));
      setLoanInterestRate(parseFloat(interestRate.value));
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setIsLoadingSettings(false);
    }
  };

  const calculateLoan = (amount: number, tenor: number) => {
    const annualRate = loanInterestRate / 100;
    const totalInterest = amount * annualRate * (tenor / 12);
    const totalRepayment = amount + totalInterest;
    const monthlyInstallment = totalRepayment / tenor;

    return {
      totalInterest,
      totalRepayment,
      monthlyInstallment,
    };
  };

  const loanAmount = form.watch('loanAmount');
  const loanTenor = form.watch('loanTenor');
  const calculations = loanAmount && loanTenor ? calculateLoan(loanAmount, loanTenor) : null;

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    if (files.length === 0) return;
    if (uploadedFiles.length + files.length > 5) {
      toast.error('Maksimal 5 file');
      return;
    }

    // Validate files
    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`File ${file.name} terlalu besar. Maksimal 10MB per file.`);
        return;
      }
      if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
        toast.error(`File ${file.name} format tidak didukung.`);
        return;
      }
    }

    try {
      setIsUploading(true);
      const result = await loanService.uploadAttachments(files);
      setUploadedFiles([...uploadedFiles, ...result.files]);
      toast.success('File berhasil diupload');
      event.target.value = ''; // Reset input
    } catch (error) {
      toast.error(handleApiError(error));
    } finally {
      setIsUploading(false);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(uploadedFiles.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: FormData) => {
    try {
      setIsSubmitting(true);

      const payload = {
        ...data,
        bankAccountNumber: data.bankAccountNumber || undefined,
        attachments: uploadedFiles.length > 0 ? uploadedFiles : undefined,
      };

      // Create draft first
      const draftResult = await loanService.createDraft(payload);
      
      // Then submit
      await loanService.submitLoan(draftResult.loan.id);

      toast.success('Pengajuan pinjaman berhasil disubmit!');
      onSuccess();
    } catch (error) {
      toast.error(handleApiError(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingSettings) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Formulir Pengajuan Pinjaman</CardTitle>
        <CardDescription>
          Lengkapi data berikut untuk mengajukan pinjaman. Pengajuan Anda akan diverifikasi melalui 3 tahap approval.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Bank Account Number */}
            <FormField
              control={form.control}
              name="bankAccountNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nomor Rekening BCA</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="1234567890"
                      maxLength={20}
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormDescription>
                    {user?.bankAccountNumber
                      ? 'Gunakan nomor rekening yang sudah tersimpan atau masukkan yang baru'
                      : 'Masukkan nomor rekening BCA untuk pencairan pinjaman'}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Loan Amount */}
            <FormField
              control={form.control}
              name="loanAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Jumlah Pinjaman</FormLabel>
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
                    Minimal {formatCurrency(minLoanAmount)} - Maksimal {formatCurrency(maxLoanAmount)}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Loan Tenor */}
            <FormField
              control={form.control}
              name="loanTenor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lama Pinjaman (Tenor)</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <CalendarIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="number"
                        placeholder="12"
                        className="pl-10"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        disabled={isSubmitting}
                      />
                    </div>
                  </FormControl>
                  <FormDescription>
                    Dalam bulan. Maksimal {maxLoanTenor} bulan
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Calculation Preview */}
            {calculations && (
              <Alert>
                <DollarSign className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-semibold">Perhitungan Pinjaman:</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Bunga ({loanInterestRate}% per tahun)</p>
                        <p className="font-bold text-primary">{formatCurrency(calculations.totalInterest)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Total Pembayaran</p>
                        <p className="font-bold">{formatCurrency(calculations.totalRepayment)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Cicilan per Bulan</p>
                        <p className="font-bold text-orange-600">{formatCurrency(calculations.monthlyInstallment)}</p>
                      </div>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Loan Purpose */}
            <FormField
              control={form.control}
              name="loanPurpose"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Alasan Peminjaman</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Jelaskan alasan dan tujuan peminjaman Anda..."
                      rows={4}
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormDescription>
                    Minimal 10 karakter. Jelaskan secara detail.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* File Attachments */}
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Lampiran Dokumen (Opsional)</label>
                <p className="text-sm text-muted-foreground">
                  Upload maksimal 5 file (PDF, DOC, XLS, JPG, PNG). Maksimal 10MB per file.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={isUploading || uploadedFiles.length >= 5}
                  onClick={() => document.getElementById('file-upload')?.click()}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload File
                    </>
                  )}
                </Button>
                <Badge variant="secondary">
                  {uploadedFiles.length} / 5 file
                </Badge>
              </div>

              <input
                id="file-upload"
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                onChange={handleFileUpload}
                className="hidden"
              />

              {/* Uploaded Files List */}
              {uploadedFiles.length > 0 && (
                <div className="space-y-2">
                  {uploadedFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-primary" />
                        <span className="text-sm truncate max-w-[300px]">
                          {file.split('/').pop()}
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              {onCancel && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  Batal
                </Button>
              )}
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit Pengajuan
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
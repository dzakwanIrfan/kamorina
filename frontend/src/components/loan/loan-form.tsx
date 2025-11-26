// frontend/src/components/loan/loan-form.tsx
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Loader2, AlertCircle, CheckCircle2, Info } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';

import { loanService } from '@/services/loan.service';
import { handleApiError } from '@/lib/axios';
import { useAuthStore } from '@/store/auth.store';
import { LoanEligibility, LoanType, CreateLoanDto } from '@/types/loan.types';
import { createLoanFormSchema, getDefaultFormValues } from '@/lib/loan-form-schemas';
import { formatCurrency } from '@/lib/loan-utils';
import { useSetting, getSettingValue } from '@/hooks/use-settings';

import { LoanTypeSelector } from './loan-type-selector';
import { CommonLoanFields } from './form-fields/common-loan-fields';
import { CashLoanFields } from './form-fields/cash-loan-fields';
import { GoodsReimburseFields } from './form-fields/goods-reimburse-fields';
import { GoodsOnlineFields } from './form-fields/goods-online-fields';
import { GoodsPhoneFields } from './form-fields/goods-phone-fields';
import { LoanCalculationPreview } from './loan-calculation-preview';
import { FileUploadSection } from './file-upload-section';

interface LoanFormProps {
  onSuccess: () => void;
  onCancel?: () => void;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024;
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

export function LoanForm({ onSuccess, onCancel }: LoanFormProps) {
  const { user } = useAuthStore();
  const [selectedType, setSelectedType] = useState<LoanType | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingEligibility, setIsLoadingEligibility] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [eligibility, setEligibility] = useState<LoanEligibility | null>(null);
  const [eligibilityError, setEligibilityError] = useState<string | null>(null);

  // Fetch dynamic settings
  const { data: shopMarginData } = useSetting('shop_margin_rate');
  const { data: maxGoodsLoanData } = useSetting('max_goods_loan_amount');

  const shopMarginRate = shopMarginData ? getSettingValue(shopMarginData) : 5;
  const maxGoodsLoanAmount = maxGoodsLoanData ? getSettingValue(maxGoodsLoanData) : 15000000;

  const formSchema = eligibility && selectedType 
    ? createLoanFormSchema(selectedType, eligibility)
    : null;

  const form = useForm<any>({
    resolver: formSchema ? zodResolver(formSchema) : undefined,
    defaultValues: selectedType ? getDefaultFormValues(selectedType, user?.bankAccountNumber) : {},
  });

  useEffect(() => {
    if (selectedType) {
      checkEligibility(selectedType);
      form.reset(getDefaultFormValues(selectedType, user?.bankAccountNumber));
    }
  }, [selectedType]);

  const checkEligibility = async (loanType: LoanType) => {
    try {
      setIsLoadingEligibility(true);
      setEligibilityError(null);
      const result = await loanService.checkEligibility(loanType);
      setEligibility(result);
    } catch (error) {
      const errorMsg = handleApiError(error);
      setEligibilityError(errorMsg);
      toast.error('Gagal memeriksa kelayakan', { description: errorMsg });
    } finally {
      setIsLoadingEligibility(false);
    }
  };

  const calculateLoan = (amount: number, tenor: number, loanType: LoanType) => {
    if (!eligibility || !amount || !tenor) return null;

    const annualRate = eligibility.loanLimit.interestRate / 100;
    const totalInterest = amount * annualRate * (tenor / 12);
    
    let shopMargin = 0;
    let totalRepayment = 0;

    switch (loanType) {
      case LoanType.CASH_LOAN:
      case LoanType.GOODS_REIMBURSE:
      case LoanType.GOODS_PHONE:
        totalRepayment = amount + totalInterest;
        break;

      case LoanType.GOODS_ONLINE:
        shopMargin = amount * (shopMarginRate / 100);
        totalRepayment = amount + shopMargin + totalInterest;
        break;

      default:
        totalRepayment = amount + totalInterest;
    }

    const monthlyInstallment = totalRepayment / tenor;

    return {
      totalInterest,
      shopMargin: loanType === LoanType.GOODS_ONLINE ? shopMargin : undefined,
      totalRepayment,
      monthlyInstallment,
    };
  };

  const getLoanAmount = (formData: any): number => {
    switch (selectedType) {
      case LoanType.CASH_LOAN:
        return formData.loanAmount || 0;
      case LoanType.GOODS_REIMBURSE:
      case LoanType.GOODS_ONLINE:
        return formData.itemPrice || 0;
      case LoanType.GOODS_PHONE:
        return 0;
      default:
        return 0;
    }
  };

  const loanAmount = getLoanAmount(form.watch());
  const loanTenor = form.watch('loanTenor');
  const calculations = loanAmount && loanTenor && selectedType
    ? calculateLoan(loanAmount, loanTenor, selectedType) 
    : null;

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);

    if (files.length === 0) return;
    if (uploadedFiles.length + files.length > 5) {
      toast.error('Maksimal 5 file');
      return;
    }

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
      event.target.value = '';
    } catch (error) {
      toast.error(handleApiError(error));
    } finally {
      setIsUploading(false);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(uploadedFiles.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: any) => {
    if (!selectedType) return;

    try {
      setIsSubmitting(true);

      const payload: CreateLoanDto = {
        loanType: selectedType,
        ...data,
        bankAccountNumber: data.bankAccountNumber || undefined,
        attachments: uploadedFiles.length > 0 ? uploadedFiles : undefined,
      } as CreateLoanDto;

      const draftResult = await loanService.createDraft(payload);
      await loanService.submitLoan(draftResult.loan.id);

      toast.success('Pengajuan pinjaman berhasil disubmit!');
      onSuccess();
    } catch (error) {
      toast.error(handleApiError(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!selectedType) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Pilih Jenis Pinjaman</CardTitle>
          <CardDescription>
            Pilih jenis pinjaman yang sesuai dengan kebutuhan Anda
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LoanTypeSelector
            selectedType={selectedType}
            onSelect={setSelectedType}
            disabled={false}
          />
        </CardContent>
      </Card>
    );
  }

  if (isLoadingEligibility) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Memeriksa kelayakan pinjaman...</p>
        </CardContent>
      </Card>
    );
  }

  if (eligibilityError || !eligibility) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            Tidak Memenuhi Syarat
          </CardTitle>
          <CardDescription>Anda belum memenuhi syarat untuk mengajukan pinjaman</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Alasan:</AlertTitle>
            <AlertDescription>{eligibilityError}</AlertDescription>
          </Alert>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setSelectedType(null)} className="flex-1">
              Pilih Jenis Lain
            </Button>
            {onCancel && (
              <Button variant="outline" onClick={onCancel} className="flex-1">
                Kembali
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  const displayMaxAmount = selectedType === LoanType.CASH_LOAN 
    ? eligibility.loanLimit.maxLoanAmount 
    : maxGoodsLoanAmount;

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Formulir Pengajuan Pinjaman</CardTitle>
            <CardDescription>
              Lengkapi data berikut untuk mengajukan pinjaman
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedType(null)}
            disabled={isSubmitting}
          >
            Ganti Jenis
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Alert className="mb-6 border-green-200 bg-green-50 dark:bg-green-950/30">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-900 dark:text-green-300">
            Anda Memenuhi Syarat!
          </AlertTitle>
          <AlertDescription>
            <div className="mt-2 space-y-3">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="text-muted-foreground">Plafond Minimum</p>
                  <p className="font-bold text-green-700">
                    {formatCurrency(eligibility.loanLimit.minLoanAmount)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Plafond Maksimum</p>
                  <p className="font-bold text-green-700">
                    {formatCurrency(displayMaxAmount)}
                  </p>
                </div>
              </div>
            </div>
          </AlertDescription>
        </Alert>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <CommonLoanFields
              form={form}
              eligibility={eligibility}
              userBankAccount={user?.bankAccountNumber}
              isSubmitting={isSubmitting}
            />

            <Separator />

            {selectedType === LoanType.CASH_LOAN && (
              <CashLoanFields
                form={form}
                eligibility={eligibility}
                isSubmitting={isSubmitting}
              />
            )}

            {selectedType === LoanType.GOODS_REIMBURSE && (
              <GoodsReimburseFields
                form={form}
                maxAmount={maxGoodsLoanAmount}
                isSubmitting={isSubmitting}
              />
            )}

            {selectedType === LoanType.GOODS_ONLINE && (
              <GoodsOnlineFields
                form={form}
                maxAmount={maxGoodsLoanAmount}
                isSubmitting={isSubmitting}
              />
            )}

            {selectedType === LoanType.GOODS_PHONE && (
              <GoodsPhoneFields form={form} isSubmitting={isSubmitting} />
            )}

            {calculations && selectedType !== LoanType.GOODS_PHONE && (
              <>
                <Separator />
                <LoanCalculationPreview
                  calculations={calculations}
                  interestRate={eligibility.loanLimit.interestRate}
                  shopMarginRate={selectedType === LoanType.GOODS_ONLINE ? shopMarginRate : undefined}
                  loanType={selectedType}
                />
              </>
            )}

            <Separator />

            <FileUploadSection
              uploadedFiles={uploadedFiles}
              isUploading={isUploading}
              onFileUpload={handleFileUpload}
              onRemoveFile={removeFile}
              disabled={isSubmitting}
            />

            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Informasi Penting</AlertTitle>
              <AlertDescription className="text-xs space-y-1">
                <ul className="list-disc list-inside space-y-1">
                  <li>Pengajuan akan melalui 3 tahap approval: DSP → Ketua → Pengawas</li>
                  <li>Pencairan dilakukan setelah semua approval selesai</li>
                  {selectedType === LoanType.GOODS_PHONE && (
                    <li>Harga handphone akan ditentukan oleh DSP berdasarkan harga rekanan</li>
                  )}
                  {selectedType === LoanType.GOODS_ONLINE && (
                    <li>Total pembayaran sudah termasuk margin toko {shopMarginRate}%</li>
                  )}
                </ul>
              </AlertDescription>
            </Alert>

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
              <Button type="submit" disabled={isSubmitting} className="flex-1">
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
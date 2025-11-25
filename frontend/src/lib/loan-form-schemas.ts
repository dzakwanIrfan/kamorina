import * as z from 'zod';
import { LoanType, LoanEligibility } from '@/types/loan.types';

export function createLoanFormSchema(loanType: LoanType, eligibility: LoanEligibility) {
  const baseSchema = {
    bankAccountNumber: z
      .string()
      .min(10, 'Nomor rekening minimal 10 digit')
      .max(20, 'Nomor rekening maksimal 20 digit')
      .regex(/^[0-9]+$/, 'Nomor rekening harus berupa angka')
      .optional()
      .or(z.literal('')),
    loanTenor: z
      .number()
      .positive('Tenor harus lebih dari 0')
      .min(1, 'Minimal tenor 1 bulan')
      .max(eligibility.loanLimit.maxTenor, `Maksimal tenor ${eligibility.loanLimit.maxTenor} bulan`),
    loanPurpose: z.string().min(10, 'Alasan peminjaman minimal 10 karakter'),
  };

  switch (loanType) {
    case LoanType.CASH_LOAN:
      return z.object({
        ...baseSchema,
        loanAmount: z
          .number()
          .positive('Jumlah pinjaman harus lebih dari 0')
          .min(
            eligibility.loanLimit.minLoanAmount,
            `Minimal ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(eligibility.loanLimit.minLoanAmount)}`
          )
          .max(
            eligibility.loanLimit.maxLoanAmount,
            `Maksimal ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(eligibility.loanLimit.maxLoanAmount)}`
          ),
        notes: z.string().optional(),
      });

    case LoanType.GOODS_REIMBURSE:
      return z.object({
        ...baseSchema,
        itemName: z.string().min(3, 'Nama barang minimal 3 karakter'),
        itemPrice: z
          .number()
          .positive('Harga barang harus lebih dari 0')
          .max(15000000, 'Maksimal Rp 15.000.000'),
        purchaseDate: z.string().min(1, 'Tanggal pembelian wajib diisi'),
        notes: z.string().optional(),
      });

    case LoanType.GOODS_ONLINE:
      return z.object({
        ...baseSchema,
        itemName: z.string().min(3, 'Nama barang minimal 3 karakter'),
        itemPrice: z
          .number()
          .positive('Harga barang harus lebih dari 0')
          .max(15000000, 'Maksimal Rp 15.000.000'),
        itemUrl: z.string().url('URL tidak valid').min(1, 'Link barang wajib diisi'),
        notes: z.string().optional(),
      });

    case LoanType.GOODS_PHONE:
      return z.object({
        ...baseSchema,
        itemName: z.string().min(5, 'Nama handphone minimal 5 karakter'),
        notes: z.string().optional(),
      });

    default:
      return z.object(baseSchema);
  }
}

export function getDefaultFormValues(loanType: LoanType, userBankAccount?: string) {
  const baseValues = {
    bankAccountNumber: userBankAccount || '',
    loanTenor: 12,
    loanPurpose: '',
  };

  switch (loanType) {
    case LoanType.CASH_LOAN:
      return {
        ...baseValues,
        loanAmount: 0,
        notes: '',
      };

    case LoanType.GOODS_REIMBURSE:
      return {
        ...baseValues,
        itemName: '',
        itemPrice: 0,
        purchaseDate: '',
        notes: '',
      };

    case LoanType.GOODS_ONLINE:
      return {
        ...baseValues,
        itemName: '',
        itemPrice: 0,
        itemUrl: '',
        notes: '',
      };

    case LoanType.GOODS_PHONE:
      return {
        ...baseValues,
        itemName: '',
        notes: '',
      };

    default:
      return baseValues;
  }
}
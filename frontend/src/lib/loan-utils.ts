import { LoanType, LoanApplication } from '@/types/loan.types';

export const loanTypeLabels: Record<LoanType, string> = {
  [LoanType.CASH_LOAN]: 'Peminjaman Uang',
  [LoanType.GOODS_REIMBURSE]: 'Kredit Barang (Reimburse)',
  [LoanType.GOODS_ONLINE]: 'Kredit Barang (Online)',
  [LoanType.GOODS_PHONE]: 'Kredit Barang (Handphone)',
};

export const loanTypeDescriptions: Record<LoanType, string> = {
  [LoanType.CASH_LOAN]: 'Pinjaman dalam bentuk uang tunai sesuai plafond',
  [LoanType.GOODS_REIMBURSE]: 'Reimburse pembelian barang yang sudah dilakukan',
  [LoanType.GOODS_ONLINE]: 'Pembelian barang melalui toko online',
  [LoanType.GOODS_PHONE]: 'Pembelian handphone dengan harga koperasi rekanan',
};

export function getLoanTypeLabel(loanType: LoanType): string {
  return loanTypeLabels[loanType] || loanType;
}

export function getLoanTypeDescription(loanType: LoanType): string {
  return loanTypeDescriptions[loanType] || '';
}

export function getTypeSpecificDetails(loan: LoanApplication) {
  switch (loan.loanType) {
    case LoanType.CASH_LOAN:
      return loan.cashLoanDetails;
    case LoanType.GOODS_REIMBURSE:
      return loan.goodsReimburseDetails;
    case LoanType.GOODS_ONLINE:
      return loan.goodsOnlineDetails;
    case LoanType.GOODS_PHONE:
      return loan.goodsPhoneDetails;
    default:
      return null;
  }
}

export function getDisplayLoanAmount(loan: LoanApplication): number {
  switch (loan.loanType) {
    case LoanType.CASH_LOAN:
      return loan.loanAmount;
    case LoanType.GOODS_REIMBURSE:
      return loan.goodsReimburseDetails?.itemPrice || loan.loanAmount;
    case LoanType.GOODS_ONLINE:
      return loan.goodsOnlineDetails?.itemPrice || loan.loanAmount;
    case LoanType.GOODS_PHONE:
      return loan.goodsPhoneDetails?.cooperativePrice || loan.loanAmount;
    default:
      return loan.loanAmount;
  }
}

export function canRevise(loan: LoanApplication, userRoles: string[]): boolean {
  const isDSP = userRoles.includes('divisi_simpan_pinjam');
  const isAtDSPStep = loan.currentStep === 'DIVISI_SIMPAN_PINJAM';
  const isInReview = ['SUBMITTED', 'UNDER_REVIEW_DSP'].includes(loan.status);
  
  return isDSP && isAtDSPStep && isInReview;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
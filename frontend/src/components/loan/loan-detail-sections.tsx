'use client';

import { LoanApplication, LoanType } from '@/types/loan.types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';
import { formatCurrency } from '@/lib/loan-utils';

interface LoanRevisionsDisplayProps {
  loan: LoanApplication;
}

export function LoanRevisionsDisplay({ loan }: LoanRevisionsDisplayProps) {
  if (loan.revisionCount === 0) return null;

  return (
    <Alert className="border-orange-200 bg-orange-50 dark:bg-orange-950/30">
      <Info className="h-4 w-4 text-orange-600" />
      <AlertDescription>
        <div className="space-y-2">
          <p className="font-semibold text-orange-900 dark:text-orange-300">
            Pinjaman ini telah direvisi {loan.revisionCount}x
          </p>
          {loan.revisionNotes && (
            <>
              <Separator className="bg-orange-200" />
              <div>
                <p className="text-sm font-medium text-orange-800 dark:text-orange-400">
                  Catatan Revisi Terakhir:
                </p>
                <p className="text-sm mt-1 whitespace-pre-wrap">{loan.revisionNotes}</p>
              </div>
            </>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}

interface CalculationBreakdownProps {
  loan: LoanApplication;
}

export function CalculationBreakdown({ loan }: CalculationBreakdownProps) {
  if (!loan.interestRate || !loan.monthlyInstallment || !loan.totalRepayment) {
    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Perhitungan pinjaman akan tersedia setelah diproses oleh Divisi Simpan Pinjam
        </AlertDescription>
      </Alert>
    );
  }

  const totalInterest = loan.totalRepayment - loan.loanAmount;
  
  // Calculate shop margin for GOODS_ONLINE
  let shopMargin = 0;
  let shopMarginRate = 0;
  if (loan.loanType === LoanType.GOODS_ONLINE && loan.goodsOnlineDetails?.shopMarginRate) {
    shopMarginRate = loan.goodsOnlineDetails.shopMarginRate;
    shopMargin = loan.loanAmount * (shopMarginRate / 100);
  }

  // Calculate pure interest (without shop margin)
  const pureInterest = loan.loanType === LoanType.GOODS_ONLINE 
    ? totalInterest - shopMargin 
    : totalInterest;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rincian Perhitungan Pinjaman</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex justify-between items-center py-2">
            <span className="text-muted-foreground">Jumlah Pinjaman</span>
            <span className="text-lg font-bold">{formatCurrency(loan.loanAmount)}</span>
          </div>

          <div className="flex justify-between items-center py-2">
            <span className="text-muted-foreground">Tenor</span>
            <span className="font-medium">{loan.loanTenor} Bulan</span>
          </div>

          <div className="flex justify-between items-center py-2">
            <span className="text-muted-foreground">Suku Bunga</span>
            <span className="font-medium">{loan.interestRate}% per tahun</span>
          </div>

          <Separator />

          {/* Shop Margin (only for GOODS_ONLINE) */}
          {loan.loanType === LoanType.GOODS_ONLINE && shopMargin > 0 && (
            <div className="flex justify-between items-center py-2 bg-purple-50 dark:bg-purple-950/30 rounded-lg px-4">
              <span className="text-muted-foreground">
                Margin Toko ({shopMarginRate}%)
              </span>
              <span className="font-medium text-purple-600">
                {formatCurrency(shopMargin)}
              </span>
            </div>
          )}

          <div className="flex justify-between items-center py-2">
            <span className="text-muted-foreground">
              {loan.loanType === LoanType.GOODS_ONLINE ? 'Bunga Pinjaman' : 'Total Bunga'}
            </span>
            <span className="font-medium text-orange-600">
              {formatCurrency(pureInterest)}
            </span>
          </div>

          {loan.loanType === LoanType.GOODS_ONLINE && shopMargin > 0 && (
            <div className="flex justify-between items-center py-2">
              <span className="text-muted-foreground">Total Biaya (Margin + Bunga)</span>
              <span className="font-medium text-orange-600">
                {formatCurrency(totalInterest)}
              </span>
            </div>
          )}

          <div className="flex justify-between items-center py-2 bg-muted rounded-lg px-4">
            <span className="font-semibold">Total Pembayaran</span>
            <span className="text-lg font-bold">
              {formatCurrency(loan.totalRepayment)}
            </span>
          </div>

          <Separator />

          <div className="flex justify-between items-center py-2 bg-primary/5 rounded-lg px-4">
            <span className="font-semibold text-primary">Cicilan per Bulan</span>
            <span className="text-2xl font-bold text-primary">
              {formatCurrency(loan.monthlyInstallment)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
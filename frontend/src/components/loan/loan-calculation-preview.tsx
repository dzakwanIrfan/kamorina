'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Info } from 'lucide-react';
import { FaRupiahSign } from "react-icons/fa6";
import { formatCurrency } from '@/lib/loan-utils';
import { LoanType } from '@/types/loan.types';

interface LoanCalculationPreviewProps {
  calculations: {
    totalInterest: number;
    shopMargin?: number;
    totalRepayment: number;
    monthlyInstallment: number;
  };
  interestRate: number;
  shopMarginRate?: number;
  loanType: LoanType;
}

export function LoanCalculationPreview({ 
  calculations, 
  interestRate, 
  shopMarginRate,
  loanType 
}: LoanCalculationPreviewProps) {
  return (
    <Alert>
      <FaRupiahSign className="h-4 w-4" />
      <AlertDescription>
        <div className="space-y-3">
          <p className="font-semibold">Perhitungan Pinjaman:</p>
          
          <div className="space-y-2 text-sm">
            {/* Interest */}
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">
                Bunga ({interestRate}% per tahun)
              </span>
              <span className="font-bold text-primary">
                {formatCurrency(calculations.totalInterest)}
              </span>
            </div>

            {/* Shop Margin (only for GOODS_ONLINE) */}
            {loanType === LoanType.GOODS_ONLINE && calculations.shopMargin && shopMarginRate && (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">
                    Margin Toko ({shopMarginRate}%)
                  </span>
                  <span className="font-bold text-purple-600">
                    {formatCurrency(calculations.shopMargin)}
                  </span>
                </div>
                <Separator />
              </>
            )}

            {/* Total Repayment */}
            <div className="flex justify-between items-center bg-muted/50 p-2 rounded">
              <span className="font-semibold">Total Pembayaran</span>
              <span className="font-bold text-lg">
                {formatCurrency(calculations.totalRepayment)}
              </span>
            </div>

            {/* Monthly Installment */}
            <div className="flex justify-between items-center bg-primary/5 p-2 rounded">
              <span className="font-semibold text-primary">Cicilan per Bulan</span>
              <span className="font-bold text-xl text-primary">
                {formatCurrency(calculations.monthlyInstallment)}
              </span>
            </div>
          </div>

          {/* Additional Info */}
          {loanType === LoanType.GOODS_ONLINE && (
            <div className="mt-3 pt-3 border-t">
              <div className="flex items-start gap-2 text-xs text-muted-foreground">
                <Info className="h-3 w-3 mt-0.5 shrink-0" />
                <span>
                  Untuk kredit barang online, total pembayaran sudah termasuk margin toko {shopMarginRate}%
                </span>
              </div>
            </div>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}
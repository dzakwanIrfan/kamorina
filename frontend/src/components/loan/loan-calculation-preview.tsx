'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { DollarSign } from 'lucide-react';
import { formatCurrency } from '@/lib/loan-utils';

interface LoanCalculationPreviewProps {
  calculations: {
    totalInterest: number;
    totalRepayment: number;
    monthlyInstallment: number;
  };
  interestRate: number;
}

export function LoanCalculationPreview({ calculations, interestRate }: LoanCalculationPreviewProps) {
  return (
    <Alert>
      <DollarSign className="h-4 w-4" />
      <AlertDescription>
        <div className="space-y-2">
          <p className="font-semibold">Perhitungan Pinjaman:</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Bunga ({interestRate}% per tahun)</p>
              <p className="font-bold text-primary">
                {formatCurrency(calculations.totalInterest)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Total Pembayaran</p>
              <p className="font-bold">{formatCurrency(calculations.totalRepayment)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Cicilan per Bulan</p>
              <p className="font-bold text-orange-600">
                {formatCurrency(calculations.monthlyInstallment)}
              </p>
            </div>
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
}
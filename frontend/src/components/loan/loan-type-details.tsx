'use client';

import { LoanApplication, LoanType } from '@/types/loan.types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  Banknote, 
  ShoppingBag, 
  ShoppingCart, 
  Smartphone,
  ExternalLink 
} from 'lucide-react';
import { formatCurrency, getLoanTypeLabel } from '@/lib/loan-utils';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface LoanTypeDetailsProps {
  loan: LoanApplication;
}

const loanTypeIcons: Record<LoanType, any> = {
  [LoanType.CASH_LOAN]: Banknote,
  [LoanType.GOODS_REIMBURSE]: ShoppingBag,
  [LoanType.GOODS_ONLINE]: ShoppingCart,
  [LoanType.GOODS_PHONE]: Smartphone,
};

export function LoanTypeDetails({ loan }: LoanTypeDetailsProps) {
  const Icon = loanTypeIcons[loan.loanType];

  const renderTypeSpecificDetails = () => {
    switch (loan.loanType) {
      case LoanType.CASH_LOAN:
        return (
          <div className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Jumlah Pinjaman</p>
              <p className="text-2xl font-bold text-primary">
                {formatCurrency(loan.loanAmount)}
              </p>
            </div>
            {loan.cashLoanDetails?.notes && (
              <div>
                <p className="text-sm text-muted-foreground">Catatan</p>
                <p className="text-sm">{loan.cashLoanDetails.notes}</p>
              </div>
            )}
          </div>
        );

      case LoanType.GOODS_REIMBURSE:
        if (!loan.goodsReimburseDetails) return null;
        return (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Nama Barang</p>
                <p className="font-semibold">{loan.goodsReimburseDetails.itemName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Harga Barang</p>
                <p className="text-xl font-bold text-primary">
                  {formatCurrency(loan.goodsReimburseDetails.itemPrice)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tanggal Pembelian</p>
                <p className="font-medium">
                  {format(new Date(loan.goodsReimburseDetails.purchaseDate), 'dd MMMM yyyy', {
                    locale: id,
                  })}
                </p>
              </div>
            </div>
            {loan.goodsReimburseDetails.notes && (
              <div>
                <p className="text-sm text-muted-foreground">Catatan</p>
                <p className="text-sm">{loan.goodsReimburseDetails.notes}</p>
              </div>
            )}
          </div>
        );

      case LoanType.GOODS_ONLINE:
        if (!loan.goodsOnlineDetails) return null;
        return (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Nama Barang</p>
                <p className="font-semibold">{loan.goodsOnlineDetails.itemName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Harga Barang</p>
                <p className="text-xl font-bold text-primary">
                  {formatCurrency(loan.goodsOnlineDetails.itemPrice)}
                </p>
              </div>
            </div>
            
            {loan.goodsOnlineDetails.shopMarginRate && (
              <div className="bg-purple-50 dark:bg-purple-950/30 rounded-lg p-3">
                <p className="text-sm text-muted-foreground mb-1">Informasi Margin Toko</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Rate Margin:</span>
                  <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                    {loan.goodsOnlineDetails.shopMarginRate}%
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Margin: {formatCurrency(
                    loan.loanAmount * (loan.goodsOnlineDetails.shopMarginRate / 100)
                  )}
                </p>
              </div>
            )}

            <div>
              <p className="text-sm text-muted-foreground mb-1">Link Barang</p>
              <a
                href={loan.goodsOnlineDetails.itemUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline flex items-center gap-1"
              >
                <span className="truncate max-w-[400px]">
                  {loan.goodsOnlineDetails.itemUrl}
                </span>
                <ExternalLink className="h-3 w-3 shrink-0" />
              </a>
            </div>
            {loan.goodsOnlineDetails.notes && (
              <div>
                <p className="text-sm text-muted-foreground">Catatan</p>
                <p className="text-sm">{loan.goodsOnlineDetails.notes}</p>
              </div>
            )}
          </div>
        );

      case LoanType.GOODS_PHONE:
        if (!loan.goodsPhoneDetails) return null;
        return (
          <div className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Nama Handphone</p>
              <p className="text-lg font-semibold">{loan.goodsPhoneDetails.itemName}</p>
            </div>
            
            {loan.goodsPhoneDetails.retailPrice > 0 ? (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Harga Retail</p>
                  <p className="font-bold text-gray-600">
                    {formatCurrency(loan.goodsPhoneDetails.retailPrice)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Harga Koperasi</p>
                  <p className="text-xl font-bold text-primary">
                    {formatCurrency(loan.goodsPhoneDetails.cooperativePrice)}
                  </p>
                </div>
              </div>
            ) : (
              <Badge variant="secondary">Harga akan diisi oleh DSP</Badge>
            )}

            {loan.goodsPhoneDetails.notes && (
              <div>
                <p className="text-sm text-muted-foreground">Spesifikasi & Catatan</p>
                <p className="text-sm whitespace-pre-wrap">{loan.goodsPhoneDetails.notes}</p>
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Icon className="h-5 w-5" />
            Detail {getLoanTypeLabel(loan.loanType)}
          </CardTitle>
          <Badge variant="outline">{getLoanTypeLabel(loan.loanType)}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        {renderTypeSpecificDetails()}
      </CardContent>
    </Card>
  );
}
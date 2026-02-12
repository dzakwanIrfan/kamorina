'use client';

import { format, differenceInDays } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import {
  Wallet,
  Landmark,
  CreditCard,
  CalendarClock,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FinancialSummary, NextBill } from '@/types/dashboard.types';

interface DashboardCardsProps {
  summary: FinancialSummary;
}

/**
 * Format currency value
 */
function formatCurrency(value: string): string {
  const numValue = parseFloat(value);
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numValue);
}

/**
 * Get urgency badge for next bill
 */
function getUrgencyBadge(daysUntilDue: number) {
  if (daysUntilDue < 0) {
    return <Badge variant="destructive">Jatuh Tempo</Badge>;
  }
  if (daysUntilDue <= 7) {
    return <Badge variant="destructive">{daysUntilDue} hari lagi</Badge>;
  }
  if (daysUntilDue <= 14) {
    return (
      <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
        {daysUntilDue} hari lagi
      </Badge>
    );
  }
  return (
    <Badge variant="secondary">
      {daysUntilDue} hari lagi
    </Badge>
  );
}

export function DashboardCards({ summary }: DashboardCardsProps) {
  const cards = [
    {
      title: 'Total Simpanan',
      value: formatCurrency(summary.totalSavings),
      description: 'Pokok + Wajib + Tabungan',
      icon: Wallet,
      iconColor: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-950',
    },
    {
      title: 'Deposito Aktif',
      value: formatCurrency(summary.activeDeposits),
      description: 'Total deposito berjalan',
      icon: Landmark,
      iconColor: 'text-emerald-600',
      bgColor: 'bg-emerald-50 dark:bg-emerald-950',
    },
    {
      title: 'Sisa Pinjaman',
      value: formatCurrency(summary.remainingLoan),
      description: 'Total hutang yang tersisa',
      icon: CreditCard,
      iconColor: 'text-orange-600',
      bgColor: 'bg-orange-50 dark:bg-orange-950',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Regular summary cards */}
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
            <div className={`rounded-full p-2 ${card.bgColor}`}>
              <card.icon className={`h-4 w-4 ${card.iconColor}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
            <p className="text-xs text-muted-foreground">{card.description}</p>
          </CardContent>
        </Card>
      ))}

      {/* Next Bill Card - Special handling */}
      <Card className={summary.nextBill && summary.nextBill.daysUntilDue <= 7 
        ? 'border-orange-200 bg-orange-50/50 dark:border-orange-900 dark:bg-orange-950/50' 
        : ''}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Tagihan Berikutnya</CardTitle>
          <div className="rounded-full bg-violet-50 p-2 dark:bg-violet-950">
            <CalendarClock className="h-4 w-4 text-violet-600" />
          </div>
        </CardHeader>
        <CardContent>
          {summary.nextBill ? (
            <>
              <div className="text-2xl font-bold">
                {formatCurrency(summary.nextBill.amount)}
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <p className="text-xs text-muted-foreground">
                  {format(new Date(summary.nextBill.dueDate), 'dd MMMM yyyy', {
                    locale: localeId,
                  })}
                </p>
                {getUrgencyBadge(summary.nextBill.daysUntilDue)}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {summary.nextBill.loanNumber}
              </p>
            </>
          ) : (
            <>
              <div className="text-2xl font-bold text-muted-foreground">-</div>
              <p className="text-xs text-muted-foreground">
                Tidak ada tagihan mendatang
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { SaldoSummary } from "@/types/buku-tabungan.types";
import { formatCurrency } from "@/lib/format";
import { Wallet, PiggyBank, Coins, TrendingUp } from "lucide-react";

interface SaldoSummaryCardProps {
  summary?: SaldoSummary;
  isLoading?: boolean;
}

interface SaldoItemProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  color?: string;
}

function SaldoItem({
  label,
  value,
  icon,
  color = "text-primary",
}: SaldoItemProps) {
  return (
    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg bg-background ${color}`}>{icon}</div>
        <span className="text-sm font-medium text-muted-foreground">
          {label}
        </span>
      </div>
      <span className={`font-semibold ${color}`}>{formatCurrency(value)}</span>
    </div>
  );
}

export function SaldoSummaryCard({
  summary,
  isLoading,
}: SaldoSummaryCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!summary) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          Rincian Saldo
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <SaldoItem
          label="Saldo yang Bisa Diambil"
          value={summary.saldoSukarela}
          icon={<Wallet className="h-4 w-4" />}
          color="text-blue-600"
        />
        <SaldoItem
          label="Saldo Pokok (Pasif)"
          value={summary.saldoPokok}
          icon={<Coins className="h-4 w-4" />}
          color="text-green-600"
        />
        <SaldoItem
          label="Saldo Wajib (Pasif)"
          value={summary.saldoWajib}
          icon={<PiggyBank className="h-4 w-4" />}
          color="text-green-600"
        />
        <SaldoItem
          label="Bunga Deposito"
          value={summary.bungaDeposito}
          icon={<TrendingUp className="h-4 w-4" />}
          color="text-orange-600"
        />

        {/* Total */}
        <div className="pt-3 border-t">
          <div className="flex items-center justify-between p-4 bg-primary/10 rounded-lg">
            <span className="font-semibold text-primary">Total Saldo</span>
            <span className="text-xl font-bold text-primary">
              {formatCurrency(summary.totalSaldo)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TransactionSummary } from "@/types/buku-tabungan.types";
import { formatCurrency, toNumber } from "@/lib/format";
import {
  ArrowDownCircle,
  Receipt,
  Calendar,
  PiggyBank,
  Gift,
  TrendingUp,
} from "lucide-react";

interface TransactionSummaryCardProps {
  summary?: TransactionSummary;
  isLoading?: boolean;
  title?: string;
  period?: { month: number; year: number };
}

interface SummaryItemProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  type: "income" | "expense";
}

function SummaryItem({ label, value, icon, type }: SummaryItemProps) {
  const numValue = toNumber(value);
  if (numValue === 0) return null;

  const isIncome = type === "income";
  const colorClass = isIncome ? "text-green-600" : "text-red-600";
  const bgClass = isIncome
    ? "bg-green-50 dark:bg-green-950"
    : "bg-red-50 dark:bg-red-950";

  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-2">
        <div className={`p-1. 5 rounded ${bgClass} ${colorClass}`}>{icon}</div>
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <span className={`font-medium ${colorClass}`}>
        {isIncome ? "+" : "-"} {formatCurrency(numValue)}
      </span>
    </div>
  );
}

const MONTH_NAMES = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

export function TransactionSummaryCard({
  summary,
  isLoading,
  title = "Ringkasan Transaksi",
  period,
}: TransactionSummaryCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!summary) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-6">
            Tidak ada data transaksi
          </p>
        </CardContent>
      </Card>
    );
  }

  const hasIncome =
    toNumber(summary.totalIuranPendaftaran) > 0 ||
    toNumber(summary.totalIuranBulanan) > 0 ||
    toNumber(summary.totalTabunganDeposito) > 0 ||
    toNumber(summary.totalShu) > 0 ||
    toNumber(summary.totalBunga) > 0;

  const hasExpense = toNumber(summary.totalPenarikan) > 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            {title}
          </CardTitle>
          {period && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              {MONTH_NAMES[period.month - 1]} {period.year}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-1">
        {/* Income items */}
        {hasIncome && (
          <div className="space-y-1">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Pemasukan
            </h4>
            <SummaryItem
              label="Iuran Pendaftaran"
              value={summary.totalIuranPendaftaran}
              icon={<Receipt className="h-3. 5 w-3.5" />}
              type="income"
            />
            <SummaryItem
              label="Iuran Bulanan"
              value={summary.totalIuranBulanan}
              icon={<Calendar className="h-3.5 w-3.5" />}
              type="income"
            />
            <SummaryItem
              label="Tabungan Deposito"
              value={summary.totalTabunganDeposito}
              icon={<PiggyBank className="h-3.5 w-3.5" />}
              type="income"
            />
            <SummaryItem
              label="SHU"
              value={summary.totalShu}
              icon={<Gift className="h-3.5 w-3.5" />}
              type="income"
            />
            <SummaryItem
              label="Bunga"
              value={summary.totalBunga}
              icon={<TrendingUp className="h-3.5 w-3.5" />}
              type="income"
            />
          </div>
        )}

        {/* Expense items */}
        {hasExpense && (
          <>
            {hasIncome && <div className="border-t my-3" />}
            <div className="space-y-1">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                Pengeluaran
              </h4>
              <SummaryItem
                label="Penarikan"
                value={summary.totalPenarikan}
                icon={<ArrowDownCircle className="h-3.5 w-3.5" />}
                type="expense"
              />
            </div>
          </>
        )}

        {!hasIncome && !hasExpense && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Belum ada transaksi
          </p>
        )}
      </CardContent>
    </Card>
  );
}

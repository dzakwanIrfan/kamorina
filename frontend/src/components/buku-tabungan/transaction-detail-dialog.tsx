"use client";

import { format } from "date-fns";
import { id } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Receipt,
  Hash,
  ArrowUpCircle,
  ArrowDownCircle,
} from "lucide-react";
import { SavingsTransaction } from "@/types/buku-tabungan.types";
import { formatCurrency, toNumber } from "@/lib/format";

interface TransactionDetailDialogProps {
  transaction: SavingsTransaction | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface DetailRowProps {
  label: string;
  value: number | string;
  type: "income" | "expense" | "neutral";
}

function DetailRow({ label, value, type }: DetailRowProps) {
  const numValue = toNumber(value);
  if (numValue === 0) return null;

  const colorClass =
    type === "income"
      ? "text-green-600"
      : type === "expense"
      ? "text-red-600"
      : "text-foreground";

  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={`font-medium ${colorClass}`}>
        {type === "income" && "+"}
        {type === "expense" && "-"}
        {formatCurrency(numValue)}
      </span>
    </div>
  );
}

export function TransactionDetailDialog({
  transaction,
  open,
  onOpenChange,
}: TransactionDetailDialogProps) {
  if (!transaction) return null;

  const hasIncome =
    toNumber(transaction.iuranPendaftaran) > 0 ||
    toNumber(transaction.iuranBulanan) > 0 ||
    toNumber(transaction.tabunganDeposito) > 0 ||
    toNumber(transaction.shu) > 0 ||
    toNumber(transaction.bunga) > 0;

  const hasExpense = toNumber(transaction.penarikan) > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Detail Transaksi
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Transaction Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Hash className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">ID: </span>
              <code className="text-xs bg-muted px-2 py-0.5 rounded">
                {transaction.id.slice(0, 8)}...
              </code>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Tanggal:</span>
              <span className="font-medium">
                {format(new Date(transaction.transactionDate), "dd MMMM yyyy", {
                  locale: id,
                })}
              </span>
            </div>

            {transaction.payrollPeriod && (
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  Periode:{" "}
                  {transaction.payrollPeriod.name ||
                    `${transaction.payrollPeriod.month}/${transaction.payrollPeriod.year}`}
                </Badge>
              </div>
            )}
          </div>

          <Separator />

          {/* Income Section */}
          {hasIncome && (
            <div className="space-y-1">
              <div className="flex items-center gap-2 mb-2">
                <ArrowUpCircle className="h-4 w-4 text-green-600" />
                <h4 className="text-sm font-semibold">Pemasukan</h4>
              </div>
              <DetailRow
                label="Iuran Pendaftaran"
                value={transaction.iuranPendaftaran}
                type="income"
              />
              <DetailRow
                label="Iuran Bulanan"
                value={transaction.iuranBulanan}
                type="income"
              />
              <DetailRow
                label="Tabungan Deposito"
                value={transaction.tabunganDeposito}
                type="income"
              />
              <DetailRow label="SHU" value={transaction.shu} type="income" />
              <DetailRow
                label="Bunga"
                value={transaction.bunga}
                type="income"
              />
            </div>
          )}

          {/* Expense Section */}
          {hasExpense && (
            <>
              {hasIncome && <Separator />}
              <div className="space-y-1">
                <div className="flex items-center gap-2 mb-2">
                  <ArrowDownCircle className="h-4 w-4 text-red-600" />
                  <h4 className="text-sm font-semibold">Pengeluaran</h4>
                </div>
                <DetailRow
                  label="Penarikan"
                  value={transaction.penarikan}
                  type="expense"
                />
              </div>
            </>
          )}

          {/* Description */}
          {transaction.description && (
            <>
              <Separator />
              <div>
                <h4 className="text-sm font-semibold mb-1">Keterangan</h4>
                <p className="text-sm text-muted-foreground">
                  {transaction.description}
                </p>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

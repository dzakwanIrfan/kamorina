'use client';

import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RecentTransaction } from '@/types/dashboard.types';
import { Receipt, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';

interface RecentTransactionTableProps {
  transactions: RecentTransaction[];
}

/**
 * Format currency value
 */
function formatCurrency(value: string): string {
  const numValue = parseFloat(value);
  if (numValue === 0) return '-';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numValue);
}

/**
 * Calculate total income from transaction
 */
function calculateIncome(txn: RecentTransaction): number {
  return (
    parseFloat(txn.iuranPendaftaran) +
    parseFloat(txn.iuranBulanan) +
    parseFloat(txn.tabunganDeposito) +
    parseFloat(txn.shu) +
    parseFloat(txn.bunga)
  );
}

/**
 * Get period label
 */
function getPeriodLabel(month: number | null, year: number | null): string {
  if (!month || !year) return '-';
  const date = new Date(year, month - 1);
  return format(date, 'MMMM yyyy', { locale: localeId });
}

export function RecentTransactionTable({ transactions }: RecentTransactionTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Receipt className="h-5 w-5" />
          Transaksi Terakhir
        </CardTitle>
        <CardDescription>5 transaksi terakhir pada rekening simpanan Anda</CardDescription>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Receipt className="mb-4 h-12 w-12 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              Belum ada transaksi yang tercatat
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Periode</TableHead>
                  <TableHead className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <ArrowUpCircle className="h-4 w-4 text-emerald-500" />
                      Pemasukan
                    </div>
                  </TableHead>
                  <TableHead className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <ArrowDownCircle className="h-4 w-4 text-rose-500" />
                      Pengeluaran
                    </div>
                  </TableHead>
                  <TableHead>Catatan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((txn) => {
                  const income = calculateIncome(txn);
                  const expense = parseFloat(txn.penarikan);

                  return (
                    <TableRow key={txn.id}>
                      <TableCell className="font-medium">
                        {format(new Date(txn.transactionDate), 'dd MMM yyyy', {
                          locale: localeId,
                        })}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-normal">
                          {getPeriodLabel(txn.periodMonth, txn.periodYear)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {income > 0 ? (
                          <span className="font-medium text-emerald-600 dark:text-emerald-400">
                            +{formatCurrency(income.toString())}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {expense > 0 ? (
                          <span className="font-medium text-rose-600 dark:text-rose-400">
                            -{formatCurrency(expense.toString())}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate text-muted-foreground">
                        {txn.note || '-'}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

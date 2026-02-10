"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import {
  CheckCircle2,
  Clock,
  Loader2,
  Search,
  DollarSign,
  FileText,
  Calendar,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

import { payrollService } from "@/services/payroll.service";
import { PayrollPeriod, PayrollTransaction } from "@/types/payroll.types";

interface PayrollDetailDialogProps {
  period: PayrollPeriod | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PayrollDetailDialog({
  period,
  open,
  onOpenChange,
}: PayrollDetailDialogProps) {
  const [transactions, setTransactions] = useState<PayrollTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [meta, setMeta] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  useEffect(() => {
    if (open && period) {
      fetchTransactions();
    }
  }, [open, period, meta.page, searchValue]);

  const fetchTransactions = async () => {
    if (!period) return;
    setIsLoading(true);
    try {
      const response = await payrollService.getPeriodTransactions(period.id, {
        page: meta.page,
        limit: meta.limit,
        search: searchValue || undefined,
      });
      setTransactions(response.data);
      setMeta(response.meta);
    } catch {
      setTransactions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: string): string => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(parseFloat(amount));
  };

  if (!period) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full sm:max-w-5xl max-h-[95dvh] sm:max-h-[90vh] h-[95dvh] sm:h-[90vh] p-0 gap-0 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-4 sm:px-8 pt-6 sm:pt-8 pb-4 sm:pb-6 bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-950 border-b shrink-0">
          <div className="flex flex-col sm:flex-row items-start justify-between gap-4 sm:gap-0 mb-4 sm:mb-6">
            <div className="space-y-1">
              <DialogTitle className="text-2xl sm:text-3xl font-bold tracking-tight line-clamp-1">
                {period.name}
              </DialogTitle>
              <DialogDescription className="text-sm sm:text-base text-muted-foreground line-clamp-1">
                Detail lengkap transaksi payroll periode ini
              </DialogDescription>
            </div>
            <Badge
              variant={period.isProcessed ? "default" : "secondary"}
              className="text-sm font-medium px-4 py-1.5 gap-1.5 self-start sm:self-auto"
            >
              {period.isProcessed ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Diproses
                </>
              ) : (
                <>
                  <Clock className="h-4 w-4" />
                  Pending
                </>
              )}
            </Badge>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mt-4 sm:mt-6">
            <div className="group relative overflow-hidden rounded-xl sm:rounded-2xl bg-white dark:bg-slate-800 p-4 sm:p-6 shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all">
              <div className="absolute top-0 right-0 w-24 sm:w-32 h-24 sm:h-32 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-colors" />
              <div className="relative flex items-center sm:items-start gap-4">
                <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-blue-500/10 ring-1 ring-blue-500/20 shrink-0">
                  <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 sm:mb-2">
                    Total Amount
                  </p>
                  <p
                    className="text-lg sm:text-2xl font-bold text-slate-900 dark:text-slate-50 truncate"
                    title={formatCurrency(period.totalAmount)}
                  >
                    {formatCurrency(period.totalAmount)}
                  </p>
                </div>
              </div>
            </div>

            <div className="group relative overflow-hidden rounded-xl sm:rounded-2xl bg-white dark:bg-slate-800 p-4 sm:p-6 shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all">
              <div className="absolute top-0 right-0 w-24 sm:w-32 h-24 sm:h-32 bg-green-500/5 rounded-full blur-2xl group-hover:bg-green-500/10 transition-colors" />
              <div className="relative flex items-center sm:items-start gap-4">
                <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-green-500/10 ring-1 ring-green-500/20 shrink-0">
                  <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 sm:mb-2">
                    Total Transaksi
                  </p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-xl sm:text-3xl font-bold text-slate-900 dark:text-slate-50">
                      {period.transactionCount}
                    </p>
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                      transaksi
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="group relative overflow-hidden rounded-xl sm:rounded-2xl bg-white dark:bg-slate-800 p-4 sm:p-6 shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all">
              <div className="absolute top-0 right-0 w-24 sm:w-32 h-24 sm:h-32 bg-purple-500/5 rounded-full blur-2xl group-hover:bg-purple-500/10 transition-colors" />
              <div className="relative flex items-center sm:items-start gap-4">
                <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-purple-500/10 ring-1 ring-purple-500/20 shrink-0">
                  <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 sm:mb-2">
                    Tanggal Proses
                  </p>
                  {period.processedAt ? (
                    <>
                      <p className="text-base sm:text-xl font-bold text-slate-900 dark:text-slate-50">
                        {format(new Date(period.processedAt), "dd MMM yyyy", {
                          locale: id,
                        })}
                      </p>
                      <p className="text-[10px] sm:text-xs font-medium text-muted-foreground mt-0.5 sm:mt-1">
                        Pukul{" "}
                        {format(new Date(period.processedAt), "HH:mm", {
                          locale: id,
                        })}
                      </p>
                    </>
                  ) : (
                    <p className="text-base sm:text-xl font-bold text-muted-foreground">
                      Belum diproses
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="px-4 sm:px-8 py-3 sm:py-5 bg-white dark:bg-slate-950 border-b flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-6 shrink-0">
          <div className="relative w-full sm:flex-1 sm:max-w-md">
            <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
            <Input
              placeholder="Cari nama anggota atau nomor karyawan..."
              className="pl-9 sm:pl-11 h-9 sm:h-11 text-sm bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus-visible:ring-2 focus-visible:ring-blue-500/20"
              value={searchValue}
              onChange={(e) => {
                setSearchValue(e.target.value);
                setMeta((prev) => ({ ...prev, page: 1 }));
              }}
            />
          </div>
          <div className="w-full sm:w-auto flex items-center justify-between sm:justify-end gap-2 text-xs sm:text-sm">
            <span className="text-muted-foreground">Total:</span>
            <span className="font-bold text-slate-900 dark:text-slate-50">
              {meta.total}
            </span>
            <span className="text-muted-foreground">transaksi</span>
          </div>
        </div>

        {/* Table Container */}
        <div className="flex-1 min-h-0 bg-white dark:bg-slate-950">
          {isLoading ? (
            <div className="flex justify-center items-center h-full">
              <div className="text-center space-y-3">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto" />
                <p className="text-sm text-muted-foreground">
                  Memuat data transaksi...
                </p>
              </div>
            </div>
          ) : transactions.length === 0 ? (
            <div className="flex justify-center items-center h-full">
              <div className="text-center space-y-2">
                <FileText className="h-12 w-12 text-muted-foreground/40 mx-auto" />
                <p className="text-sm font-medium text-muted-foreground">
                  Tidak ada transaksi ditemukan
                </p>
              </div>
            </div>
          ) : (
            <div className="relative h-full overflow-auto">
              <div className="min-w-[800px]">
                <Table>
                  <TableHeader className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-900">
                    <TableRow className="hover:bg-slate-50 dark:hover:bg-slate-900 border-b-2">
                      <TableHead className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300 w-[200px] sm:w-[280px] h-10 sm:h-12 px-4 sm:px-8">
                        Anggota
                      </TableHead>
                      <TableHead className="text-right font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300 w-[120px] sm:w-[140px] px-4">
                        Iuran Pendaftaran
                      </TableHead>
                      <TableHead className="text-right font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300 w-[110px] sm:w-[130px] px-4">
                        Iuran Bulanan
                      </TableHead>
                      <TableHead className="text-right font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300 w-[110px] sm:w-[130px] px-4">
                        Tab. Deposito
                      </TableHead>
                      <TableHead className="text-right font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300 w-[100px] sm:w-[110px] px-4">
                        Bunga
                      </TableHead>
                      <TableHead className="text-right font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300 w-[110px] sm:w-[120px] px-4 sm:px-8">
                        Penarikan
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((t, index) => (
                      <TableRow
                        key={t.id}
                        className={`group transition-colors ${
                          index % 2 === 0
                            ? "bg-white dark:bg-slate-950"
                            : "bg-slate-50/50 dark:bg-slate-900/30"
                        } hover:bg-blue-50/50 dark:hover:bg-blue-950/10 border-b border-slate-100 dark:border-slate-800`}
                      >
                        <TableCell className="py-3 sm:py-4 px-4 sm:px-8">
                          <div className="space-y-0.5 sm:space-y-1">
                            <p className="text-sm font-semibold text-slate-900 dark:text-slate-50 line-clamp-1">
                              {t.user.name}
                            </p>
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {t.user.employeeNumber || "-"} ·{" "}
                              {t.user.department || "-"}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 px-4">
                          {formatCurrency(t.iuranPendaftaran)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 px-4">
                          {formatCurrency(t.iuranBulanan)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-xs sm:text-sm px-4">
                          <span className="font-semibold text-blue-600 dark:text-blue-400">
                            +{formatCurrency(t.tabunganDeposito)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-xs sm:text-sm px-4">
                          <span className="font-semibold text-green-600 dark:text-green-400">
                            +{formatCurrency(t.bunga)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-xs sm:text-sm px-4 sm:px-8">
                          <span
                            className={
                              parseFloat(t.penarikan) > 0
                                ? "font-semibold text-red-600 dark:text-red-400"
                                : "font-medium text-slate-700 dark:text-slate-300"
                            }
                          >
                            {parseFloat(t.penarikan) > 0 ? "-" : ""}
                            {formatCurrency(t.penarikan)}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>

        {/* Pagination */}
        {meta.totalPages > 1 && (
          <div className="px-4 sm:px-8 py-3 sm:py-5 bg-slate-50 dark:bg-slate-900 border-t flex items-center justify-between shrink-0">
            <p className="text-xs sm:text-sm text-muted-foreground">
              Hal.{" "}
              <span className="font-bold text-slate-900 dark:text-slate-50">
                {meta.page}
              </span>{" "}
              dari{" "}
              <span className="font-bold text-slate-900 dark:text-slate-50">
                {meta.totalPages}
              </span>
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={!meta.hasPreviousPage}
                onClick={() =>
                  setMeta((prev) => ({ ...prev, page: prev.page - 1 }))
                }
                className="font-medium h-8 sm:h-9 text-xs sm:text-sm px-2 sm:px-3"
              >
                ← Prev
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!meta.hasNextPage}
                onClick={() =>
                  setMeta((prev) => ({ ...prev, page: prev.page + 1 }))
                }
                className="font-medium h-8 sm:h-9 text-xs sm:text-sm px-2 sm:px-3"
              >
                Next →
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

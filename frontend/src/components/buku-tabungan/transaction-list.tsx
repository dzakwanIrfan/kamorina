"use client";

import { useState, useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Eye, Download, Calendar } from "lucide-react";
import { toast } from "sonner";

import { DataTableAdvanced } from "@/components/data-table/data-table-advanced";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { TransactionDetailDialog } from "@/components/buku-tabungan/transaction-detail-dialog";
import { EmptyState } from "@/components/buku-tabungan/empty-state";

import { useTransactions } from "@/hooks/use-buku-tabungan";
import { SavingsTransaction } from "@/types/buku-tabungan.types";
import { DataTableConfig } from "@/types/data-table.types";
import { formatCurrency, toNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

const MONTHS = [
  { label: "Semua Bulan", value: "all" },
  { label: "Januari", value: "1" },
  { label: "Februari", value: "2" },
  { label: "Maret", value: "3" },
  { label: "April", value: "4" },
  { label: "Mei", value: "5" },
  { label: "Juni", value: "6" },
  { label: "Juli", value: "7" },
  { label: "Agustus", value: "8" },
  { label: "September", value: "9" },
  { label: "Oktober", value: "10" },
  { label: "November", value: "11" },
  { label: "Desember", value: "12" },
];

const currentYear = new Date().getFullYear();
const YEARS = [
  { label: "Semua Tahun", value: "all" },
  ...Array.from({ length: 6 }, (_, i) => ({
    label: String(currentYear - i),
    value: String(currentYear - i),
  })),
];

export function TransactionList() {
  const [selectedTransaction, setSelectedTransaction] =
    useState<SavingsTransaction | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});

  const {
    transactions,
    meta,
    isLoading,
    notFound,
    setPage,
    setLimit,
    setFilters: setQueryFilters,
    resetFilters,
  } = useTransactions();

  const handleViewDetail = (transaction: SavingsTransaction) => {
    setSelectedTransaction(transaction);
    setDetailDialogOpen(true);
  };

  const handleFiltersChange = (newFilters: Record<string, unknown>) => {
    const queryFilters: Record<string, unknown> = {};

    if (newFilters.month && newFilters.month !== "all") {
      queryFilters.month = parseInt(newFilters.month as string);
    }
    if (newFilters.year && newFilters.year !== "all") {
      queryFilters.year = parseInt(newFilters.year as string);
    }
    if (dateRange.from) {
      queryFilters.startDate = format(dateRange.from, "yyyy-MM-dd");
    }
    if (dateRange.to) {
      queryFilters.endDate = format(dateRange.to, "yyyy-MM-dd");
    }

    setQueryFilters(queryFilters);
  };

  const handleDateRangeChange = (range: { from?: Date; to?: Date }) => {
    setDateRange(range);

    const queryFilters: Record<string, unknown> = {};
    if (range.from) {
      queryFilters.startDate = format(range.from, "yyyy-MM-dd");
    }
    if (range.to) {
      queryFilters.endDate = format(range.to, "yyyy-MM-dd");
    }

    setQueryFilters(queryFilters);
  };

  const handleResetFilters = () => {
    setDateRange({});
    resetFilters();
  };

  const handleExport = async () => {
    try {
      const { default: XLSX } = await import("xlsx");

      const exportData = transactions.map((tx) => ({
        Tanggal: format(new Date(tx.transactionDate), "dd/MM/yyyy", {
          locale: id,
        }),
        Periode: tx.payrollPeriod?.name || "-",
        "Iuran Pendaftaran": toNumber(tx.iuranPendaftaran),
        "Iuran Bulanan": toNumber(tx.iuranBulanan),
        "Tabungan Deposito": toNumber(tx.tabunganDeposito),
        SHU: toNumber(tx.shu),
        Bunga: toNumber(tx.bunga),
        Penarikan: toNumber(tx.penarikan),
        Keterangan: tx.description || "-",
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Transaksi");

      const fileName = `transaksi_tabungan_${format(
        new Date(),
        "yyyyMMdd_HHmmss"
      )}.xlsx`;
      XLSX.writeFile(wb, fileName);

      toast.success("Data berhasil diekspor");
    } catch {
      toast.error("Gagal mengekspor data");
    }
  };

  const columns: ColumnDef<SavingsTransaction>[] = useMemo(
    () => [
      {
        accessorKey: "transactionDate",
        header: "Tanggal",
        cell: ({ row }) => (
          <span className="text-sm font-medium">
            {format(new Date(row.original.transactionDate), "dd MMM yyyy", {
              locale: id,
            })}
          </span>
        ),
      },
      {
        accessorKey: "payrollPeriod",
        header: "Periode",
        cell: ({ row }) => {
          const period = row.original.payrollPeriod;
          if (!period) return "-";
          return (
            <Badge variant="outline" className="text-xs">
              {period.name || `${period.month}/${period.year}`}
            </Badge>
          );
        },
      },
      {
        accessorKey: "iuranBulanan",
        header: "Iuran Bulanan",
        cell: ({ row }) => {
          const value = toNumber(row.original.iuranBulanan);
          if (value === 0) return "-";
          return (
            <span className="text-green-600 font-medium">
              +{formatCurrency(value)}
            </span>
          );
        },
      },
      {
        accessorKey: "tabunganDeposito",
        header: "Deposito",
        cell: ({ row }) => {
          const value = toNumber(row.original.tabunganDeposito);
          if (value === 0) return "-";
          return (
            <span className="text-green-600 font-medium">
              +{formatCurrency(value)}
            </span>
          );
        },
      },
      {
        accessorKey: "penarikan",
        header: "Penarikan",
        cell: ({ row }) => {
          const value = toNumber(row.original.penarikan);
          if (value === 0) return "-";
          return (
            <span className="text-red-600 font-medium">
              -{formatCurrency(value)}
            </span>
          );
        },
      },
      {
        id: "actions",
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleViewDetail(row.original)}
          >
            <Eye className="h-4 w-4 mr-1" />
            Detail
          </Button>
        ),
      },
    ],
    []
  );

  const tableConfig: DataTableConfig<SavingsTransaction> = {
    searchable: false,
    filterable: true,
    selectable: false,
    filterFields: [
      {
        id: "month",
        label: "Bulan",
        type: "select",
        placeholder: "Pilih Bulan",
        options: MONTHS,
      },
      {
        id: "year",
        label: "Tahun",
        type: "select",
        placeholder: "Pilih Tahun",
        options: YEARS,
      },
    ],
    toolbarActions: [
      {
        label: "Export",
        icon: Download,
        onClick: handleExport,
        variant: "outline",
        disabled: transactions.length === 0,
      },
    ],
  };

  if (notFound) {
    return (
      <EmptyState
        title="Belum Ada Transaksi"
        description="Transaksi tabungan akan muncul setelah Anda memiliki buku tabungan."
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Date Range Picker */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filter Tanggal: </span>
            </div>

            <div className="flex flex-wrap gap-2 items-center">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "justify-start text-left font-normal",
                      !dateRange.from && "text-muted-foreground"
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {dateRange.from
                      ? format(dateRange.from, "dd MMM yyyy", { locale: id })
                      : "Tanggal Mulai"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarComponent
                    mode="single"
                    selected={dateRange.from}
                    onSelect={(date) =>
                      handleDateRangeChange({ ...dateRange, from: date })
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              <span className="text-muted-foreground">-</span>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "justify-start text-left font-normal",
                      !dateRange.to && "text-muted-foreground"
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {dateRange.to
                      ? format(dateRange.to, "dd MMM yyyy", { locale: id })
                      : "Tanggal Akhir"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarComponent
                    mode="single"
                    selected={dateRange.to}
                    onSelect={(date) =>
                      handleDateRangeChange({ ...dateRange, to: date })
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              {(dateRange.from || dateRange.to) && (
                <Button variant="ghost" onClick={handleResetFilters} size="sm">
                  Clear
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transaction Table */}
      <Card>
        <CardHeader>
          <CardTitle>Riwayat Transaksi</CardTitle>
          <CardDescription>
            Daftar semua transaksi tabungan Anda
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTableAdvanced
            columns={columns}
            data={transactions}
            meta={meta}
            config={tableConfig}
            onPageChange={setPage}
            onPageSizeChange={setLimit}
            onFiltersChange={handleFiltersChange}
            onResetFilters={handleResetFilters}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>

      <TransactionDetailDialog
        transaction={selectedTransaction}
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
      />
    </div>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import { Download, Loader2, FileSpreadsheet, Calendar } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { salaryDeductionReportService } from "@/services/salary-deduction-report.service";
import {
  SalaryDeductionReport,
  SalaryDeductionRow,
  SalaryDeductionTotals,
} from "@/types/salary-deduction-report.types";

const MONTHS = [
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

function formatNumber(value: number): string {
  if (!value) return "";
  return new Intl.NumberFormat("id-ID").format(value);
}

export function SalaryDeductionReportView() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [report, setReport] = useState<SalaryDeductionReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const fetchReport = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await salaryDeductionReportService.getReport({
        month,
        year,
      });
      setReport(response.data);
    } catch {
      toast.error("Gagal memuat laporan pemotongan gaji");
    } finally {
      setIsLoading(false);
    }
  }, [month, year]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await salaryDeductionReportService.exportExcel({ month, year });
      toast.success("Laporan berhasil diunduh");
    } catch {
      toast.error("Gagal mengunduh laporan");
    } finally {
      setIsExporting(false);
    }
  };

  const years = Array.from({ length: 10 }, (_, i) => now.getFullYear() - i);

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5" />
          Pemotongan Gaji
        </CardTitle>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <Select
              value={String(month)}
              onValueChange={(v) => setMonth(Number(v))}
            >
              <SelectTrigger className="w-[140px] h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map((name, i) => (
                  <SelectItem key={i} value={String(i + 1)}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={String(year)}
              onValueChange={(v) => setYear(Number(v))}
            >
              <SelectTrigger className="w-[100px] h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={isExporting || !report?.rows.length}
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Export Excel
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="text-center space-y-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
              <p className="text-sm text-muted-foreground">
                Memuat laporan...
              </p>
            </div>
          </div>
        ) : !report?.rows.length ? (
          <div className="flex justify-center items-center py-20">
            <div className="text-center space-y-2">
              <FileSpreadsheet className="h-12 w-12 text-muted-foreground/40 mx-auto" />
              <p className="text-sm font-medium text-muted-foreground">
                Tidak ada data untuk periode {MONTHS[month - 1]} {year}
              </p>
            </div>
          </div>
        ) : (
          <ReportTable rows={report.rows} totals={report.totals} />
        )}
      </CardContent>
    </Card>
  );
}

function ReportTable({
  rows,
  totals,
}: {
  rows: SalaryDeductionRow[];
  totals: SalaryDeductionTotals;
}) {
  return (
    <div className="relative overflow-auto max-h-[70vh] border-t">
      <table className="w-full text-sm border-collapse">
        <thead className="sticky top-0 z-30">
          {/* Group header row */}
          <tr>
            <th
              rowSpan={2}
              className="sticky left-0 z-40 min-w-[200px] bg-primary text-primary-foreground px-4 py-2 text-left font-semibold border-r border-primary-foreground/20"
            >
              NAMA
            </th>
            <th
              rowSpan={2}
              className="sticky left-[200px] z-40 min-w-20 bg-primary text-primary-foreground px-3 py-2 text-left font-semibold border-r border-primary-foreground/20 shadow-[2px_0_4px_-1px_rgba(0,0,0,0.15)]"
            >
              DEPT
            </th>
            <th
              rowSpan={2}
              className="min-w-[130px] bg-primary text-primary-foreground px-3 py-2 text-center font-semibold border-r border-primary-foreground/20"
            >
              PENDAFTARAN
            </th>
            <th
              rowSpan={2}
              className="min-w-40 bg-primary text-primary-foreground px-3 py-2 text-center font-semibold border-r border-primary-foreground/20"
            >
              TABUNGAN DEPOSITO
            </th>
            <th
              rowSpan={2}
              className="min-w-[130px] bg-primary text-primary-foreground px-3 py-2 text-center font-semibold border-r border-primary-foreground/20"
            >
              PENARIKAN
            </th>
            <th
              colSpan={4}
              className="bg-primary text-primary-foreground px-3 py-2 text-center font-semibold border-r border-primary-foreground/20 border-b"
            >
              PEMINJAMAN UANG
            </th>
            <th
              colSpan={2}
              className="bg-primary text-primary-foreground px-3 py-2 text-center font-semibold border-r border-primary-foreground/20 border-b"
            >
              PELUNASAN PINJAMAN
            </th>
            <th
              colSpan={4}
              className="bg-primary text-primary-foreground px-3 py-2 text-center font-semibold border-b border-primary-foreground/20"
            >
              PEMINJAMAN BARANG
            </th>
          </tr>
          {/* Sub-header row */}
          <tr className="text-xs">
            <th className="min-w-[120px] bg-primary/90 text-primary-foreground px-3 py-2 text-center font-medium border-r border-primary-foreground/20">
              ANGSURAN
            </th>
            <th className="min-w-[150px] bg-primary/90 text-primary-foreground px-3 py-2 text-center font-medium border-r border-primary-foreground/20">
              JUMLAH PINJAMAN
            </th>
            <th className="min-w-[90px] bg-primary/90 text-primary-foreground px-3 py-2 text-center font-medium border-r border-primary-foreground/20">
              START
            </th>
            <th className="min-w-[90px] bg-primary/90 text-primary-foreground px-3 py-2 text-center font-medium border-r border-primary-foreground/20">
              FINISH
            </th>
            <th className="min-w-[130px] bg-primary/90 text-primary-foreground px-3 py-2 text-center font-medium border-r border-primary-foreground/20">
              PELUNASAN
            </th>
            <th className="min-w-40 bg-primary/90 text-primary-foreground px-3 py-2 text-center font-medium border-r border-primary-foreground/20">
              SISA LAMA PINJAMAN
            </th>
            <th className="min-w-[120px] bg-primary/90 text-primary-foreground px-3 py-2 text-center font-medium border-r border-primary-foreground/20">
              ANGSURAN
            </th>
            <th className="min-w-[150px] bg-primary/90 text-primary-foreground px-3 py-2 text-center font-medium border-r border-primary-foreground/20">
              JUMLAH PINJAMAN
            </th>
            <th className="min-w-[90px] bg-primary/90 text-primary-foreground px-3 py-2 text-center font-medium border-r border-primary-foreground/20">
              START
            </th>
            <th className="min-w-[90px] bg-primary/90 text-primary-foreground px-3 py-2 text-center font-medium">
              FINISH
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => {
            const rowBg =
              index % 2 === 0
                ? "bg-white dark:bg-slate-950"
                : "bg-slate-50 dark:bg-slate-900";
            return (
              <tr
                key={index}
                className={`border-b border-border ${rowBg}`}
              >
                <td
                  className={`sticky left-0 z-20 min-w-[200px] px-4 py-2.5 font-medium border-r border-border ${rowBg}`}
                >
                  {row.nama}
                </td>
                <td
                  className={`sticky left-[200px] z-20 min-w-20 px-3 py-2.5 border-r border-border shadow-[2px_0_4px_-1px_rgba(0,0,0,0.08)] ${rowBg}`}
                >
                  {row.dept}
                </td>
                <td className="px-3 py-2.5 text-center tabular-nums border-r border-border">
                  {formatNumber(row.pendaftaran)}
                </td>
                <td className="px-3 py-2.5 text-center tabular-nums border-r border-border">
                  {formatNumber(row.tabunganDeposito)}
                </td>
                <td className="px-3 py-2.5 text-center tabular-nums border-r border-border text-red-600 dark:text-red-400">
                  {formatNumber(row.penarikan)}
                </td>
                <td className="px-3 py-2.5 text-center tabular-nums border-r border-border">
                  {formatNumber(row.cashLoan.angsuran)}
                </td>
                <td className="px-3 py-2.5 text-center tabular-nums border-r border-border">
                  {formatNumber(row.cashLoan.jumlahPinjaman)}
                </td>
                <td className="px-3 py-2.5 text-center text-xs border-r border-border">
                  {row.cashLoan.start || ""}
                </td>
                <td className="px-3 py-2.5 text-center text-xs border-r border-border">
                  {row.cashLoan.finish || ""}
                </td>
                <td className="px-3 py-2.5 text-center tabular-nums border-r border-border">
                  {formatNumber(row.pelunasanPinjaman.pelunasan)}
                </td>
                <td className="px-3 py-2.5 text-center text-xs border-r border-border">
                  {row.pelunasanPinjaman.sisaLamaPinjaman || ""}
                </td>
                <td className="px-3 py-2.5 text-center tabular-nums border-r border-border">
                  {formatNumber(row.goodsLoan.angsuran)}
                </td>
                <td className="px-3 py-2.5 text-center tabular-nums border-r border-border">
                  {formatNumber(row.goodsLoan.jumlahPinjaman)}
                </td>
                <td className="px-3 py-2.5 text-center text-xs border-r border-border">
                  {row.goodsLoan.start || ""}
                </td>
                <td className="px-3 py-2.5 text-center text-xs">
                  {row.goodsLoan.finish || ""}
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot className="sticky bottom-0 z-30">
          <tr className="border-t-2 border-border font-bold bg-amber-50 dark:bg-amber-900">
            <td className="sticky left-0 z-20 min-w-[200px] px-4 py-3 border-r border-border bg-amber-50 dark:bg-amber-900">
              TOTAL
            </td>
            <td className="sticky left-[200px] z-20 min-w-20 px-3 py-3 border-r border-border shadow-[2px_0_4px_-1px_rgba(0,0,0,0.08)] bg-amber-50 dark:bg-amber-900" />
            <td className="px-3 py-3 text-center tabular-nums border-r border-border">
              {formatNumber(totals.pendaftaran)}
            </td>
            <td className="px-3 py-3 text-center tabular-nums border-r border-border">
              {formatNumber(totals.tabunganDeposito)}
            </td>
            <td className="px-3 py-3 text-center tabular-nums border-r border-border text-red-600 dark:text-red-400">
              {formatNumber(totals.penarikan)}
            </td>
            <td className="px-3 py-3 text-center tabular-nums border-r border-border">
              {formatNumber(totals.cashLoanAngsuran)}
            </td>
            <td className="px-3 py-3 text-center tabular-nums border-r border-border">
              {formatNumber(totals.cashLoanJumlahPinjaman)}
            </td>
            <td className="border-r border-border" />
            <td className="border-r border-border" />
            <td className="px-3 py-3 text-center tabular-nums border-r border-border">
              {formatNumber(totals.pelunasan)}
            </td>
            <td className="border-r border-border" />
            <td className="px-3 py-3 text-center tabular-nums border-r border-border">
              {formatNumber(totals.goodsLoanAngsuran)}
            </td>
            <td className="px-3 py-3 text-center tabular-nums border-r border-border">
              {formatNumber(totals.goodsLoanJumlahPinjaman)}
            </td>
            <td className="border-r border-border" />
            <td />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

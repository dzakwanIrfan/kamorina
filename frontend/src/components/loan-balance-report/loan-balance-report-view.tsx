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

import { loanBalanceReportService } from "@/services/loan-balance-report.service";
import {
  LoanBalanceReport,
  LoanBalanceRow,
  LoanBalanceTotals,
  MonthMeta,
} from "@/types/loan-balance-report.types";

function formatNumber(value: number): string {
  if (!value) return "";
  return new Intl.NumberFormat("id-ID").format(Math.round(value));
}

export function LoanBalanceReportView() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [report, setReport] = useState<LoanBalanceReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const fetchReport = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await loanBalanceReportService.getReport({ year });
      setReport(response.data);
    } catch {
      toast.error("Gagal memuat laporan saldo pinjaman");
    } finally {
      setIsLoading(false);
    }
  }, [year]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await loanBalanceReportService.exportExcel({ year });
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
          Total Saldo Freeze {year}
        </CardTitle>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
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
                Tidak ada data pinjaman untuk tahun {year}
              </p>
            </div>
          </div>
        ) : (
          <ReportTable
            rows={report.rows}
            totals={report.totals}
            months={report.months}
            prevYear={report.prevYear}
            year={report.year}
          />
        )}
      </CardContent>
    </Card>
  );
}

function ReportTable({
  rows,
  totals,
  months,
  prevYear,
  year,
}: {
  rows: LoanBalanceRow[];
  totals: LoanBalanceTotals;
  months: MonthMeta[];
  prevYear: number;
  year: number;
}) {
  // Sticky left columns: NO.ANGGOTA (140px) + NAMA (200px) = 340px total
  const COL1_W = "min-w-[140px] w-[140px]";
  const COL2_W = "min-w-[200px] w-[200px]";
  const COL1_LEFT = "left-0";
  const COL2_LEFT = "left-[140px]";

  return (
    <div className="relative overflow-auto max-h-[75vh] border-t">
      <table className="w-full text-xs border-collapse">
        <thead className="sticky top-0 z-30">
          {/* Row 1: Group headers */}
          <tr>
            {/* NO.ANGGOTA - rowspan 2 */}
            <th
              rowSpan={2}
              className={`sticky ${COL1_LEFT} z-40 ${COL1_W} bg-emerald-700 text-white px-2 py-2 text-center font-semibold border-r border-emerald-600`}
            >
              NO. ANGGOTA
            </th>
            {/* NAMA - rowspan 2 */}
            <th
              rowSpan={2}
              className={`sticky ${COL2_LEFT} z-40 ${COL2_W} bg-emerald-700 text-white px-2 py-2 text-left font-semibold border-r border-emerald-600 shadow-[2px_0_4px_-1px_rgba(0,0,0,0.15)]`}
            >
              NAMA
            </th>
            {/* TOTAL BUNGA PREV YEAR - rowspan 2 */}
            <th
              rowSpan={2}
              className="min-w-[150px] bg-emerald-700 text-white px-2 py-2 text-center font-semibold border-r border-emerald-600 whitespace-pre-line"
            >
              {`TOTAL BUNGA\nPINJAMAN ${prevYear}`}
            </th>
            {/* Dynamic month group headers - colspan 3 each */}
            {months.map((month) => (
              <th
                key={month.key}
                colSpan={3}
                className="bg-emerald-700 text-white px-2 py-2 text-center font-semibold border-r border-b border-emerald-600"
              >
                {month.label}
              </th>
            ))}
            {/* TOTAL BUNGA CURRENT YEAR - rowspan 2 */}
            <th
              rowSpan={2}
              className="min-w-[150px] bg-emerald-700 text-white px-2 py-2 text-center font-semibold whitespace-pre-line"
            >
              {`TOTAL BUNGA\nPINJAMAN ${year}`}
            </th>
          </tr>
          {/* Row 2: Sub-headers under each month */}
          <tr>
            {months.map((month) => (
              <SubHeaderCells key={month.key} />
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => {
            const rowBg =
              index % 2 === 0
                ? "bg-white dark:bg-slate-950"
                : "bg-slate-50 dark:bg-slate-900";
            return (
              <tr key={index} className={`border-b border-border ${rowBg}`}>
                <td
                  className={`sticky ${COL1_LEFT} z-20 ${COL1_W} px-2 py-1.5 text-center border-r border-border ${rowBg}`}
                >
                  {row.noAnggota}
                </td>
                <td
                  className={`sticky ${COL2_LEFT} z-20 ${COL2_W} px-2 py-1.5 font-medium border-r border-border shadow-[2px_0_4px_-1px_rgba(0,0,0,0.08)] ${rowBg}`}
                >
                  {row.nama}
                </td>
                <td className="px-2 py-1.5 text-right tabular-nums border-r border-border">
                  {formatNumber(row.totalBungaPrevYear)}
                </td>
                {months.map((month) => {
                  const md = row.monthlyData[month.key];
                  return (
                    <MonthDataCells
                      key={month.key}
                      sisaPinjaman={md?.sisaPinjaman || 0}
                      bunga={md?.bunga || 0}
                      angsuran={md?.angsuran || 0}
                    />
                  );
                })}
                <td className="px-2 py-1.5 text-right tabular-nums font-semibold">
                  {formatNumber(row.totalBungaCurrentYear)}
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot className="sticky bottom-0 z-30">
          <tr className="border-t-2 border-border font-bold bg-amber-50 dark:bg-amber-900">
            <td
              className={`sticky ${COL1_LEFT} z-20 ${COL1_W} px-2 py-2 bg-amber-50 dark:bg-amber-900 border-r border-border`}
            />
            <td
              className={`sticky ${COL2_LEFT} z-20 ${COL2_W} px-2 py-2 bg-amber-50 dark:bg-amber-900 border-r border-border shadow-[2px_0_4px_-1px_rgba(0,0,0,0.08)]`}
            >
              TOTAL
            </td>
            <td className="px-2 py-2 text-right tabular-nums border-r border-border">
              {formatNumber(totals.totalBungaPrevYear)}
            </td>
            {months.map((month) => {
              const mt = totals.monthlyTotals[month.key];
              return (
                <MonthDataCells
                  key={month.key}
                  sisaPinjaman={mt?.sisaPinjaman || 0}
                  bunga={mt?.bunga || 0}
                  angsuran={mt?.angsuran || 0}
                />
              );
            })}
            <td className="px-2 py-2 text-right tabular-nums">
              {formatNumber(totals.totalBungaCurrentYear)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

/** Sub-header cells for a single month group */
function SubHeaderCells() {
  const base =
    "min-w-[110px] bg-emerald-600/80 text-white px-2 py-1.5 text-center font-medium border-r border-emerald-500 text-[10px]";
  return (
    <>
      <th className={base}>SISA PINJAMAN</th>
      <th className={base}>BUNGA</th>
      <th className={`${base} border-r-emerald-600`}>ANGSURAN</th>
    </>
  );
}

/** Data cells for a single month group */
function MonthDataCells({
  sisaPinjaman,
  bunga,
  angsuran,
}: {
  sisaPinjaman: number;
  bunga: number;
  angsuran: number;
}) {
  const base = "px-2 py-1.5 text-right tabular-nums border-r border-border";
  return (
    <>
      <td className={base}>{formatNumber(sisaPinjaman)}</td>
      <td className={base}>{formatNumber(bunga)}</td>
      <td className={base}>{formatNumber(angsuran)}</td>
    </>
  );
}

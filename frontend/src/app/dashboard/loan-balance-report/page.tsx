"use client";

import { LoanBalanceReportView } from "@/components/loan-balance-report/loan-balance-report-view";

export default function LoanBalanceReportPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Total Saldo Freeze Pinjaman</h1>
        <p className="text-muted-foreground">
          Laporan saldo pinjaman beku per bulan termasuk sisa pinjaman, bunga,
          dan angsuran
        </p>
      </div>
      <LoanBalanceReportView />
    </div>
  );
}

"use client";

import { SalaryDeductionReportView } from "@/components/salary-deduction-report/salary-deduction-report-view";

export default function SalaryDeductionReportPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Laporan Pemotongan Gaji</h1>
        <p className="text-muted-foreground">
          Laporan pemotongan gaji bulanan untuk tabungan dan pinjaman anggota
        </p>
      </div>
      <SalaryDeductionReportView />
    </div>
  );
}

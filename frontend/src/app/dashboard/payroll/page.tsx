"use client";

import { PayrollPeriods } from "@/components/payroll/payroll-periods";

export default function PayrollPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Payroll</h1>
        <p className="text-muted-foreground">
          Manajemen dan pemantauan proses payroll koperasi
        </p>
      </div>

      <PayrollPeriods />
    </div>
  );
}

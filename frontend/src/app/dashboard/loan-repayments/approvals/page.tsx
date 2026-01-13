"use client";

import { RepaymentList } from "@/components/loan-repayment/repayment-list";

export default function RepaymentApprovalsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Approval Pelunasan
        </h1>
        <p className="text-muted-foreground">
          Proses persetujuan pelunasan pinjaman anggota
        </p>
      </div>

      <RepaymentList />
    </div>
  );
}

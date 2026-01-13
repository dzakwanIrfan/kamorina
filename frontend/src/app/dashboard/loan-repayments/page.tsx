"use client";

import { MyRepayments } from "@/components/loan-repayment/my-repayments";

export default function MyRepaymentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Pelunasan Saya</h1>
        <p className="text-muted-foreground">
          Kelola dan pantau pengajuan pelunasan pinjaman Anda
        </p>
      </div>

      <MyRepayments />
    </div>
  );
}

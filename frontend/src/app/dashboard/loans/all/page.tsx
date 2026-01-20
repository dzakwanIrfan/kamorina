"use client";

import { AllLoans } from "@/components/loan/all-loans";

export default function AllLoansPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Semua Pinjaman</h1>
        <p className="text-muted-foreground">
          Manajemen dan pemantauan seluruh data pinjaman anggota
        </p>
      </div>

      <AllLoans />
    </div>
  );
}

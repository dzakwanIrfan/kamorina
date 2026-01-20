"use client";

import { AllDeposits } from "@/components/deposit/all-deposits";

export default function AllDepositsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Semua Deposito</h1>
        <p className="text-muted-foreground">
          Manajemen dan pemantauan seluruh data deposito anggota
        </p>
      </div>

      <AllDeposits />
    </div>
  );
}

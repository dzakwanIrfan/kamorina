'use client';

import { MyDeposits } from '@/components/deposit/my-deposits';

export default function DepositsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Deposito Saya</h1>
        <p className="text-muted-foreground">
          Kelola dan pantau tabungan deposito Anda
        </p>
      </div>

      <MyDeposits />
    </div>
  );
}
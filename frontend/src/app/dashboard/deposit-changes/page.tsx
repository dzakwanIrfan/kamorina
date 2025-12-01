'use client';

import { MyDepositChanges } from '@/components/deposit-change/my-deposit-changes';

export default function DepositChangesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Perubahan Deposito Saya</h1>
        <p className="text-muted-foreground">
          Lihat riwayat pengajuan perubahan deposito Anda
        </p>
      </div>

      <MyDepositChanges />
    </div>
  );
}
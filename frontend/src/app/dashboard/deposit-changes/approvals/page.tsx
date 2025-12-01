'use client';

import { DepositChangeList } from '@/components/deposit-change/deposit-change-list';

export default function DepositChangeApprovalsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Persetujuan Perubahan Deposito</h1>
        <p className="text-muted-foreground">
          Review dan proses pengajuan perubahan deposito
        </p>
      </div>

      <DepositChangeList />
    </div>
  );
}
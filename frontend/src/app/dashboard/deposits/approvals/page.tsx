'use client';

import { DepositList } from '@/components/deposit/deposit-list';

export default function DepositApprovalsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Persetujuan Deposito</h1>
        <p className="text-muted-foreground">
          Review dan proses pengajuan deposito
        </p>
      </div>

      <DepositList />
    </div>
  );
}
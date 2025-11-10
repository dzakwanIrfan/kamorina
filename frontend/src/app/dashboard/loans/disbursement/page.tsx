'use client';

import { DisbursementList } from '@/components/loan/disbursement-list';

export default function DisbursementPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Pencairan Pinjaman</h1>
        <p className="text-muted-foreground">
          Proses pencairan pinjaman yang sudah disetujui
        </p>
      </div>

      <DisbursementList />
    </div>
  );
}
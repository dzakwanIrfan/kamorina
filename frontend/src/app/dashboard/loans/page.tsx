'use client';

import { MyLoans } from '@/components/loan/my-loans';

export default function LoansPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Pinjaman Saya</h1>
        <p className="text-muted-foreground">
          Kelola dan pantau pengajuan pinjaman Anda
        </p>
      </div>

      <MyLoans />
    </div>
  );
}
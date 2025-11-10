'use client';

import { LoanList } from '@/components/loan/loan-list';

export default function LoanApprovalsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Persetujuan Pinjaman</h1>
        <p className="text-muted-foreground">
          Review dan proses pengajuan pinjaman
        </p>
      </div>

      <LoanList />
    </div>
  );
}
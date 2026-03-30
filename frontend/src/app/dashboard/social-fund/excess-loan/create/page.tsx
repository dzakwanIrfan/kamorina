'use client';

import { ExcessLoanForm } from '@/components/loan/excess-loan-form';

export default function CreateExcessLoanPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Buat Pinjaman Excess</h1>
        <p className="text-muted-foreground">
          Ajukan pinjaman tanpa bunga dari dana sosial untuk anggota
        </p>
      </div>

      <div className="max-w-2xl">
        <ExcessLoanForm />
      </div>
    </div>
  );
}

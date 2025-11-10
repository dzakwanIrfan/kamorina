'use client';

import { AuthorizationList } from '@/components/loan/authorization-list';

export default function AuthorizationPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Otorisasi Pinjaman</h1>
        <p className="text-muted-foreground">
          Otorisasi transaksi pencairan pinjaman
        </p>
      </div>

      <AuthorizationList />
    </div>
  );
}
"use client";

import { MyBukuTabungan } from "@/components/buku-tabungan/my-buku-tabungan";

export default function BukuTabunganPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Buku Tabungan</h1>
        <p className="text-muted-foreground">
          Pantau saldo dan riwayat transaksi tabungan Anda
        </p>
      </div>

      <MyBukuTabungan />
    </div>
  );
}

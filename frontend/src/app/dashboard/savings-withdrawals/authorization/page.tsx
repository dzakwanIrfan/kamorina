'use client';

import { SavingsWithdrawalAuthorizationList } from '@/components/savings-withdrawal/savings-withdrawal-authorization-list';

export default function SavingsWithdrawalAuthorizationPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">
                    Otorisasi Penarikan Tabungan
                </h1>
                <p className="text-muted-foreground">
                    Verifikasi dan otorisasi akhir untuk transaksi penarikan tabungan.
                </p>
            </div>

            <SavingsWithdrawalAuthorizationList />
        </div>
    );
}

'use client';

import { MySavingsWithdrawals } from '@/components/savings-withdrawal/my-savings-withdrawals';

export default function SavingsWithdrawalsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Penarikan Tabungan Saya</h1>
                <p className="text-muted-foreground">
                    Kelola dan pantau pengajuan penarikan tabungan Anda
                </p>
            </div>

            <MySavingsWithdrawals />
        </div>
    );
}
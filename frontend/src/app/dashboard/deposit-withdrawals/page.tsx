'use client';

import { MyWithdrawals } from '@/components/deposit-withdrawal/my-withdrawals';

export default function DepositWithdrawalsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Penarikan Deposito Saya</h1>
                <p className="text-muted-foreground">
                    Kelola dan pantau pengajuan penarikan deposito Anda
                </p>
            </div>

            <MyWithdrawals />
        </div>
    );
}
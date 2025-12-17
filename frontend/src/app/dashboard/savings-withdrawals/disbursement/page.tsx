'use client';

import { SavingsWithdrawalDisbursementList } from '@/components/savings-withdrawal/savings-withdrawal-disbursement-list';

export default function SavingsWithdrawalDisbursementPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">
                    Pencairan Tabungan
                </h1>
                <p className="text-muted-foreground">
                    Konfirmasi pencairan dana untuk pengajuan penarikan tabungan yang telah disetujui.
                </p>
            </div>

            <SavingsWithdrawalDisbursementList />
        </div>
    );
}

'use client';

import { SavingsWithdrawalApprovalList } from '@/components/savings-withdrawal/savings-withdrawal-approval-list';

export default function SavingsWithdrawalApprovalsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">
                    Persetujuan Penarikan Tabungan
                </h1>
                <p className="text-muted-foreground">
                    Review dan proses pengajuan penarikan tabungan
                </p>
            </div>

            <SavingsWithdrawalApprovalList />
        </div>
    );
}
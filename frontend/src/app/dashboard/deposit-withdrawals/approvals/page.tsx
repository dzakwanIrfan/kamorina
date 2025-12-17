'use client';

import { WithdrawalApprovalList } from '@/components/deposit-withdrawal/withdrawal-approval-list';

export default function WithdrawalApprovalsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">
                    Persetujuan Penarikan Deposito
                </h1>
                <p className="text-muted-foreground">
                    Review dan proses pengajuan penarikan deposito
                </p>
            </div>

            <WithdrawalApprovalList />
        </div>
    );
}
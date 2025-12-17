'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WithdrawalForm } from '@/components/deposit-withdrawal/withdrawal-form';

export default function CreateWithdrawalPage() {
    const router = useRouter();

    const handleSuccess = () => {
        router.push('/dashboard/deposit-withdrawals');
    };

    const handleCancel = () => {
        router.back();
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={handleCancel}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        Ajukan Penarikan Deposito
                    </h1>
                    <p className="text-muted-foreground">
                        Lengkapi formulir pengajuan penarikan deposito
                    </p>
                </div>
            </div>

            <WithdrawalForm onSuccess={handleSuccess} onCancel={handleCancel} />
        </div>
    );
}
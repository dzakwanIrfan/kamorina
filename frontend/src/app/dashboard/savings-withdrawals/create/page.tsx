'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SavingsWithdrawalForm } from '@/components/savings-withdrawal/savings-withdrawal-form';

export default function CreateSavingsWithdrawalPage() {
    const router = useRouter();

    const handleSuccess = () => {
        router.push('/dashboard/savings-withdrawals');
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
                        Ajukan Penarikan Tabungan
                    </h1>
                    <p className="text-muted-foreground">
                        Lengkapi formulir pengajuan penarikan tabungan
                    </p>
                </div>
            </div>

            <SavingsWithdrawalForm onSuccess={handleSuccess} onCancel={handleCancel} />
        </div>
    );
}
'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DepositForm } from '@/components/deposit/deposit-form';

export default function CreateDepositPage() {
  const router = useRouter();

  const handleSuccess = () => {
    router.push('/dashboard/deposits');
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
          <h1 className="text-3xl font-bold tracking-tight">Ajukan Tabungan Deposito Baru</h1>
          <p className="text-muted-foreground">
            Lengkapi formulir pengajuan tabungan deposito
          </p>
        </div>
      </div>

      <DepositForm onSuccess={handleSuccess} onCancel={handleCancel} />
    </div>
  );
}
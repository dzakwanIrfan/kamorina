'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LoanForm } from '@/components/loan/loan-form';

export default function CreateLoanPage() {
  const router = useRouter();

  const handleSuccess = () => {
    router.push('/dashboard/loans');
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
          <h1 className="text-3xl font-bold tracking-tight">Ajukan Pinjaman Baru</h1>
          <p className="text-muted-foreground">
            Lengkapi formulir pengajuan pinjaman
          </p>
        </div>
      </div>

      <LoanForm onSuccess={handleSuccess} onCancel={handleCancel} />
    </div>
  );
}
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { DepositChangeForm } from '@/components/deposit-change/deposit-change-form';
import { depositService } from '@/services/deposit.service';
import { DepositApplication, DepositStatus } from '@/types/deposit.types';
import { handleApiError } from '@/lib/axios';

export default function CreateDepositChangePage() {
  const router = useRouter();
  const params = useParams();
  const depositId = params. depositId as string;

  const [deposit, setDeposit] = useState<DepositApplication | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDeposit = async () => {
      try {
        setIsLoading(true);
        const data = await depositService.getMyDepositById(depositId);
        
        // Validate deposit can be changed
        const allowedStatuses = [DepositStatus.APPROVED, DepositStatus.ACTIVE];
        if (!allowedStatuses.includes(data.status)) {
          setError('Hanya deposito yang sudah disetujui atau aktif yang dapat diubah');
          return;
        }
        
        setDeposit(data);
      } catch (err) {
        setError(handleApiError(err));
      } finally {
        setIsLoading(false);
      }
    };

    if (depositId) {
      fetchDeposit();
    }
  }, [depositId]);

  const handleSuccess = () => {
    toast.success('Pengajuan perubahan deposito berhasil disubmit! ');
    router.push('/dashboard/deposit-changes');
  };

  const handleCancel = () => {
    router.back();
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96 mt-2" />
          </div>
        </div>
        <Card>
          <CardContent className="py-10">
            <div className="flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleCancel}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Ajukan Perubahan Deposito</h1>
          </div>
        </div>
        <Card>
          <CardContent className="py-10">
            <Alert variant="destructive">
              <AlertTitle>Tidak Dapat Melanjutkan</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <div className="mt-4 flex justify-center">
              <Button variant="outline" onClick={handleCancel}>
                Kembali
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!deposit) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={handleCancel}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Ajukan Perubahan Deposito</h1>
          <p className="text-muted-foreground">
            Ubah jumlah atau tenor deposito {deposit.depositNumber}
          </p>
        </div>
      </div>

      <DepositChangeForm deposit={deposit} onSuccess={handleSuccess} onCancel={handleCancel} />
    </div>
  );
}
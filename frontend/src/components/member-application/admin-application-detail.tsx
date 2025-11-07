'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Loader2, History, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { memberApplicationService } from '@/services/member-application.service';
import { MemberApplication } from '@/types/member-application.types';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface AdminApplicationDetailProps {
  applicationId: string;
}

export function AdminApplicationDetail({ applicationId }: AdminApplicationDetailProps) {
  const router = useRouter();
  const [application, setApplication] = useState<MemberApplication | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchApplication();
  }, [applicationId]);

  const fetchApplication = async () => {
    try {
      setIsLoading(true);
      const data = await memberApplicationService.getApplicationById(applicationId);
      setApplication(data);
    } catch (error: any) {
      console.error('Failed to fetch application:', error);
      toast.error('Gagal memuat data aplikasi');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (!application) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Detail Pengajuan</h1>
          <p className="text-muted-foreground">
            {application.user?.name} • {application.user?.employee.employeeNumber}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Riwayat Pengajuan</CardTitle>
          <CardDescription>
            Total {application.submissionCount} kali pengajuan
          </CardDescription>
        </CardHeader>
        <CardContent>
          {application.history && application.history.length > 0 ? (
            <div className="space-y-4">
              {application.history.map((history) => (
                <div key={history.id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold">Pengajuan #{history.submissionNumber}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(history.submittedAt), 'dd MMMM yyyy, HH:mm', { locale: id })}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      history.status === 'APPROVED' 
                        ? 'bg-green-100 text-green-800'
                        : history.status === 'REJECTED'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {history.status === 'APPROVED' ? 'Disetujui' : history.status === 'REJECTED' ? 'Ditolak' : 'Review'}
                    </span>
                  </div>

                  {history.rejectionReason && (
                    <div className="mt-3 p-3 bg-red-50 rounded border border-red-200">
                      <p className="text-sm font-medium text-red-900 mb-1">Alasan Penolakan:</p>
                      <p className="text-sm text-red-800">{history.rejectionReason}</p>
                    </div>
                  )}

                  {history.processedByUser && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Diproses oleh: {history.processedByUser.name}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Belum ada riwayat</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
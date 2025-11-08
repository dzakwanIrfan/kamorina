'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Clock, CheckCircle, XCircle, FileText, User, Calendar } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { memberApplicationService } from '@/services/member-application.service';
import { ApplicationHistoryResponse, ApplicationStatus } from '@/types/member-application.types';
import { toast } from 'sonner';

export function ApplicationHistory() {
  const [historyData, setHistoryData] = useState<ApplicationHistoryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setIsLoading(true);
      const data = await memberApplicationService.getMyApplicationHistory();
      setHistoryData(data);
    } catch (error: any) {
      console.error('Failed to fetch history:', error);
      toast.error('Gagal memuat riwayat aplikasi');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: ApplicationStatus) => {
    const badges = {
      UNDER_REVIEW: <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300 dark:bg-yellow-950 dark:text-yellow-400 dark:border-yellow-800">Dalam Review</Badge>,
      APPROVED: <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300 dark:bg-green-950 dark:text-green-400 dark:border-green-800">Disetujui</Badge>,
      REJECTED: <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300 dark:bg-red-950 dark:text-red-400 dark:border-red-800">Ditolak</Badge>,
    };
    return badges[status];
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getInstallmentText = (plan: number | null | undefined): string => {
    if (!plan) return '-';
    return plan === 1 ? 'Angsuran I - Lunas Langsung' : 'Angsuran II - Bayar 2x';
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  if (!historyData || historyData.history.length === 0) {
    return (
      <Alert>
        <FileText className="h-4 w-4" />
        <AlertDescription>
          Belum ada riwayat pengajuan sebelumnya.
        </AlertDescription>
      </Alert>
    );
  }

  // DEDUPLICATE: Remove duplicate histories based on submissionNumber and status
  const uniqueHistory = historyData.history.reduce((acc, current) => {
    const isDuplicate = acc.find(
      item => item.submissionNumber === current.submissionNumber && 
              item.status === current.status
    );
    if (!isDuplicate) {
      acc.push(current);
    }
    return acc;
  }, [] as typeof historyData.history);

  // Sort by submission number descending (newest first)
  const sortedHistory = [...uniqueHistory].sort((a, b) => 
    b.submissionNumber - a.submissionNumber
  );

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle>Ringkasan Pengajuan</CardTitle>
          <CardDescription>
            Total pengajuan yang telah disubmit
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
              <span className="text-2xl font-bold text-primary">
                {historyData.submissionCount}
              </span>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Pengajuan</p>
              <p className="text-lg font-semibold">
                {historyData.submissionCount} kali pengajuan
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* History Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Riwayat Pengajuan</CardTitle>
          <CardDescription>
            Timeline lengkap semua pengajuan yang pernah disubmit
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {sortedHistory.map((history, index) => (
              <div key={`${history.id}-${history.submissionNumber}`} className="relative">
                {/* Timeline Line */}
                {index !== sortedHistory.length - 1 && (
                  <div className="absolute left-4 top-12 bottom-0 w-0.5 bg-border" />
                )}

                <div className="flex gap-4">
                  {/* Icon */}
                  <div className="relative flex items-center justify-center w-8 h-8 rounded-full border-2 border-border bg-background z-10">
                    {history.status === 'APPROVED' && (
                      <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                    )}
                    {history.status === 'REJECTED' && (
                      <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                    )}
                    {history.status === 'UNDER_REVIEW' && (
                      <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 pb-8">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold">
                            Pengajuan #{history.submissionNumber}
                          </h4>
                          {getStatusBadge(history.status)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(history.submittedAt), 'dd MMMM yyyy, HH:mm', { locale: id })}
                        </p>
                      </div>
                    </div>

                    {/* Details Card */}
                    <div className="mt-3 p-4 rounded-lg border bg-card">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">NIK</p>
                          <p className="text-sm font-medium">{history.nik || '-'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">NPWP</p>
                          <p className="text-sm font-medium">{history.npwp || '-'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Tanggal Lahir</p>
                          <p className="text-sm font-medium">
                            {history.dateOfBirth 
                              ? format(new Date(history.dateOfBirth), 'dd MMMM yyyy', { locale: id })
                              : '-'
                            }
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Tempat Lahir</p>
                          <p className="text-sm font-medium">{history.birthPlace || '-'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Tanggal Pegawai Tetap</p>
                          <p className="text-sm font-medium">
                            {history.permanentEmployeeDate 
                              ? format(new Date(history.permanentEmployeeDate), 'dd MMMM yyyy', { locale: id })
                              : '-'
                            }
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Metode Pembayaran</p>
                          <p className="text-sm font-medium">{getInstallmentText(history.installmentPlan)}</p>
                        </div>
                      </div>

                      <Separator className="my-4" />

                      {/* Status Details */}
                      {history.status === 'REJECTED' && history.rejectionReason && (
                        <div className="mt-3">
                          <div className="flex items-start gap-2 p-3 rounded-md bg-red-50 border border-red-200 dark:bg-red-950/30 dark:border-red-800">
                            <XCircle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5" />
                            <div className="flex-1">
                              <p className="text-xs font-medium text-red-900 dark:text-red-300 mb-1">
                                Alasan Penolakan
                              </p>
                              <p className="text-sm text-red-800 dark:text-red-400">
                                {history.rejectionReason}
                              </p>
                            </div>
                          </div>
                          {history.processedByUser && (
                            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                              <User className="h-3 w-3" />
                              <span>Ditolak oleh: {history.processedByUser.name}</span>
                              <Calendar className="h-3 w-3 ml-2" />
                              <span>
                                {format(new Date(history.rejectedAt!), 'dd MMM yyyy, HH:mm', { locale: id })}
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {history.status === 'APPROVED' && (
                        <div className="mt-3">
                          <div className="flex items-start gap-2 p-3 rounded-md bg-green-50 border border-green-200 dark:bg-green-950/30 dark:border-green-800">
                            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5" />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-green-900 dark:text-green-300">
                                Pengajuan Disetujui
                              </p>
                            </div>
                          </div>
                          {history.processedByUser && (
                            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                              <User className="h-3 w-3" />
                              <span>Disetujui oleh: {history.processedByUser.name}</span>
                              <Calendar className="h-3 w-3 ml-2" />
                              <span>
                                {format(new Date(history.approvedAt!), 'dd MMM yyyy, HH:mm', { locale: id })}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
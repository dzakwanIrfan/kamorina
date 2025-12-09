'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Loader2, History, FileText, User as UserIcon, Calendar, MapPin, CreditCard, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { memberApplicationService } from '@/services/member-application.service';
import { MemberApplication, ApplicationStatus, ApprovalStep } from '@/types/member-application.types';
import { ApplicationHistory } from './application-history';
import { useAuthStore } from '@/store/auth.store';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export function MyApplicationDetail() {
  const router = useRouter();
  const { refreshUserSession } = useAuthStore();
  const [application, setApplication] = useState<MemberApplication | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchApplication();
  }, []);

  const fetchApplication = async () => {
    try {
      setIsLoading(true);
      const data = await memberApplicationService.getMyApplication();
      setApplication(data);
    } catch (error: any) {
      console.error('Failed to fetch application:', error);
      if (error.response?.status !== 404) {
        toast.error('Gagal memuat data aplikasi');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefreshSession = async () => {
    try {
      setIsRefreshing(true);
      await refreshUserSession();
      toast.success('Session berhasil diperbarui! Mengalihkan...');
      
      // Redirect to dashboard to see member view
      setTimeout(() => {
        router.refresh();
      }, 1000);
    } catch (error) {
      console.error('Failed to refresh session:', error);
      toast.error('Gagal memperbarui session. Silakan refresh halaman secara manual.');
    } finally {
      setIsRefreshing(false);
    }
  };

  const getStatusBadge = (status: ApplicationStatus) => {
    const badges = {
      UNDER_REVIEW: <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">Dalam Review</Badge>,
      APPROVED: <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">Disetujui</Badge>,
      REJECTED: <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">Ditolak</Badge>,
    };
    return badges[status];
  };

  const getStepBadge = (step: ApprovalStep | null) => {
    if (!step) return null;
    const badges = {
      DIVISI_SIMPAN_PINJAM: <Badge variant="secondary">Menunggu Divisi Simpan Pinjam</Badge>,
      KETUA: <Badge variant="secondary">Menunggu Ketua</Badge>,
    };
    return badges[step];
  };

  const getInstallmentText = (plan: number | null | undefined): string => {
    if (!plan) return '-';
    return plan === 1 ? 'Angsuran I - Lunas Langsung' : 'Angsuran II - Bayar 2x';
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
    return (
      <Alert>
        <FileText className="h-4 w-4" />
        <AlertDescription>
          Anda belum memiliki pengajuan keanggotaan.
        </AlertDescription>
      </Alert>
    );
  }

  // Show refresh button if approved
  const showRefreshButton = application.status === ApplicationStatus.APPROVED;

  return (
    <div className="space-y-6">
      {/* Refresh Session Card - Show when approved */}
      {showRefreshButton && (
        <Card>
          <CardContent>
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <CardTitle className="text-base font-semibold">
                  Akses Member Telah Aktif
                </CardTitle>
                <CardDescription>
                  Klik tombol di samping untuk memperbarui informasi akun Anda dan mengakses fitur member.
                </CardDescription>
              </div>
              <Button
                onClick={handleRefreshSession}
                disabled={isRefreshing}
                className="shrink-0"
                size="sm"
              >
                {isRefreshing ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Memperbarui...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Perbarui Session
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="current" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="current">
            <FileText className="h-4 w-4 mr-2" />
            Pengajuan Saat Ini
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="h-4 w-4 mr-2" />
            Riwayat Pengajuan
          </TabsTrigger>
        </TabsList>

        <TabsContent value="current" className="space-y-4 mt-4">
          {/* Status Card */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>Status Pengajuan</CardTitle>
                  <CardDescription>
                    Pengajuan #{application.submissionCount}
                    {application.lastSubmittedAt && (
                      <span className="ml-2">
                        • Terakhir disubmit {format(new Date(application.lastSubmittedAt), 'dd MMM yyyy', { locale: id })}
                      </span>
                    )}
                  </CardDescription>
                </div>
                {getStatusBadge(application.status)}
              </div>
            </CardHeader>
            <CardContent>
              {application.currentStep && (
                <div className="mb-4">
                  {getStepBadge(application.currentStep)}
                </div>
              )}

              {application.status === 'REJECTED' && application.rejectionReason && (
                <Alert variant="destructive">
                  <AlertDescription>
                    <p className="font-semibold mb-1">Alasan Penolakan:</p>
                    <p>{application.rejectionReason}</p>
                    {application.rejectedAt && (
                      <p className="text-xs mt-2">
                        Ditolak pada: {format(new Date(application.rejectedAt), 'dd MMMM yyyy, HH:mm', { locale: id })}
                      </p>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              {application.status === 'APPROVED' && application.approvedAt && (
                <Alert className='bg-green-50 border border-green-200 dark:bg-green-950/30 dark:border-green-800'>
                  <AlertDescription>
                    <p className="font-semibold mb-1 text-green-900 dark:text-green-300">Selamat! Pengajuan Anda telah disetujui.</p>
                    <p className="text-sm">
                      Disetujui pada: {format(new Date(application.approvedAt), 'dd MMMM yyyy, HH:mm', { locale: id })}
                    </p>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Personal Data Card */}
          <Card>
            <CardHeader>
              <CardTitle>Data Pribadi</CardTitle>
              <CardDescription>
                Informasi yang telah disubmit
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* User Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <UserIcon className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Nama Lengkap</p>
                      <p className="font-medium">{application.user?.name}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <CreditCard className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">NIK</p>
                      <p className="font-medium">{application.user?.nik || '-'}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <CreditCard className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">NPWP</p>
                      <p className="font-medium">{application.user?.npwp || '-'}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Tanggal Lahir</p>
                      <p className="font-medium">
                        {application.user?.dateOfBirth 
                          ? format(new Date(application.user.dateOfBirth), 'dd MMMM yyyy', { locale: id })
                          : '-'
                        }
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Tempat Lahir</p>
                      <p className="font-medium">{application.user?.birthPlace || '-'}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Tanggal Pegawai Tetap</p>
                      <p className="font-medium">
                        {application.user?.employee.permanentEmployeeDate 
                          ? format(new Date(application.user.employee.permanentEmployeeDate), 'dd MMMM yyyy', { locale: id })
                          : '-'
                        }
                      </p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Employee Info */}
                <div>
                  <h4 className="font-semibold mb-3">Informasi Kepegawaian</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Nomor Karyawan</p>
                      <p className="font-medium">{application.user?.employee.employeeNumber}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Departemen</p>
                      <p className="font-medium">
                        {application.user?.employee.department?.departmentName || '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Golongan</p>
                      <p className="font-medium">
                        {application.user?.employee.golongan?.golonganName || '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Metode Pembayaran</p>
                      <p className="font-medium">
                        {getInstallmentText(application.user?.installmentPlan)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Approval Timeline */}
          {application.approvals && application.approvals.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Timeline Approval</CardTitle>
                <CardDescription>
                  Status persetujuan dari setiap tahap
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {application.approvals.map((approval, index) => (
                    <div key={approval.id} className="flex items-start gap-4">
                      <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                        approval.decision === 'APPROVED' 
                          ? 'border-green-500' 
                          : approval.decision === 'REJECTED'
                          ? 'border-red-500'
                          : 'border-gray-300'
                      }`}>
                        {approval.decision === 'APPROVED' ? '✓' : approval.decision === 'REJECTED' ? '✗' : index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-medium">
                            {approval.step === 'DIVISI_SIMPAN_PINJAM' 
                              ? 'Divisi Simpan Pinjam' 
                              : 'Ketua Koperasi'
                            }
                          </p>
                          {approval.decision && (
                            <Badge variant={approval.decision === 'APPROVED' ? 'default' : 'destructive'}>
                              {approval.decision === 'APPROVED' ? 'Disetujui' : 'Ditolak'}
                            </Badge>
                          )}
                        </div>
                        {approval.approver && (
                          <p className="text-sm text-muted-foreground">
                            oleh {approval.approver.name}
                          </p>
                        )}
                        {approval.decidedAt && (
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(approval.decidedAt), 'dd MMMM yyyy, HH:mm', { locale: id })}
                          </p>
                        )}
                        {approval.notes && (
                          <p className="text-sm mt-2 p-2 bg-muted rounded">
                            {approval.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <ApplicationHistory />
        </TabsContent>
      </Tabs>
    </div>
  );
}
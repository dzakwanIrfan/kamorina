'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, UserPlus, CheckCircle2, RefreshCw, FileText } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthStore } from '@/store/auth.store';
import { MemberApplicationForm } from '@/components/member-application/member-application-form';
import { MyApplicationDetail } from '@/components/member-application/my-application-detail';
import { DashboardContent } from '@/components/dashboard';
import { memberApplicationService } from '@/services/member-application.service';
import { dashboardService } from '@/services/dashboard.service';
import { handleApiError } from '@/lib/axios';
import { MemberApplication, ApplicationStatus } from '@/types/member-application.types';
import { DashboardSummary } from '@/types/dashboard.types';

/**
 * Dashboard Skeleton component for loading state
 */
function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-16 w-16 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cards Skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-32 mb-2" />
              <Skeleton className="h-3 w-40" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chart and Activity Skeleton */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[300px] w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-3 p-3 border rounded-lg">
                  <Skeleton className="h-9 w-9 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table Skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [showForm, setShowForm] = useState(false);
  const [application, setApplication] = useState<MemberApplication | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDashboardLoading, setIsDashboardLoading] = useState(false);

  useEffect(() => {
    if (user) {
      if (user.memberVerified) {
        // Verified member: fetch dashboard data
        fetchDashboardData();
      } else {
        // Non-member: check application status
        checkApplication();
      }
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setIsDashboardLoading(true);
      const data = await dashboardService.getDashboardSummary();
      setDashboardData(data);
    } catch (error) {
      const errorMessage = handleApiError(error);
      toast.error('Gagal memuat dashboard: ' + errorMessage);
    } finally {
      setIsLoading(false);
      setIsDashboardLoading(false);
    }
  };

  const checkApplication = async () => {
    try {
      setIsLoading(true);
      const data = await memberApplicationService.getMyApplication();
      setApplication(data);
    } catch (error) {
      // If 404, user hasn't submitted application yet
      const errorMessage = handleApiError(error);
      if (!errorMessage.includes('tidak ditemukan')) {
        toast.error(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    checkApplication();
    toast.success('Pendaftaran berhasil disubmit!');
  };

  const handleResubmit = () => {
    setShowForm(true);
  };

  // Loading state
  if (isLoading) {
    return <DashboardSkeleton />;
  }

  // If user is already a verified member, show full dashboard
  if (user?.memberVerified) {
    if (isDashboardLoading || !dashboardData) {
      return <DashboardSkeleton />;
    }
    return <DashboardContent data={dashboardData} />;
  }

  // If user has submitted application, show detailed status
  if (application) {
    // If form is shown for resubmission
    if (showForm) {
      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Ajukan Ulang Pendaftaran</h1>
              <p className="text-muted-foreground">
                Perbaiki data dan ajukan kembali pendaftaran anggota koperasi
              </p>
            </div>
            <Button variant="outline" onClick={() => setShowForm(false)}>
              Batal
            </Button>
          </div>

          <MemberApplicationForm onSuccess={handleFormSuccess} />
        </div>
      );
    }

    // Show application detail with resubmit button if rejected
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Status Pendaftaran Anggota</h1>
            <p className="text-muted-foreground">
              Pantau dan kelola pengajuan keanggotaan koperasi Anda
            </p>
          </div>

          {/* Show resubmit button if rejected */}
          {application.status === ApplicationStatus.REJECTED && (
            <Button onClick={handleResubmit} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Ajukan Ulang Pendaftaran
            </Button>
          )}
        </div>

        {/* Alert for rejected status */}
        {application.status === ApplicationStatus.REJECTED && (
          <Alert variant="destructive">
            <AlertDescription>
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <p className="font-semibold mb-1">Pengajuan Anda Ditolak</p>
                  <p className="text-sm mb-3">
                    Alasan: {application.rejectionReason || 'Tidak ada keterangan'}
                  </p>
                  <p className="text-sm">
                    Silakan perbaiki data Anda dan ajukan ulang pendaftaran dengan mengklik tombol 
                    <strong> "Ajukan Ulang Pendaftaran"</strong> di atas.
                  </p>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <MyApplicationDetail />
      </div>
    );
  }

  // If user hasn't submitted application, show welcome and form
  if (showForm) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Pendaftaran Anggota</h1>
            <p className="text-muted-foreground">
              Lengkapi formulir untuk menjadi anggota koperasi
            </p>
          </div>
          <Button variant="outline" onClick={() => setShowForm(false)}>
            Batal
          </Button>
        </div>

        <MemberApplicationForm onSuccess={handleFormSuccess} />
      </div>
    );
  }

  // Default welcome screen for non-member
  return (
    <div className="flex min-h-[calc(100vh-200px)] items-center justify-center">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center justify-center space-y-8 text-center">
          {/* Logo */}
          <div className="flex items-center justify-center">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/10">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-12 w-12 text-primary"
              >
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
          </div>

          {/* Hero Text */}
          <div className="space-y-4 max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
              Selamat Datang di{' '}
              <span className="text-primary">Koperasi Surya Niaga Kamorina</span>
            </h1>
            <p className="text-xl text-muted-foreground">
              Halo, <strong>{user?.name}</strong>!
            </p>
            <p className="text-lg text-muted-foreground">
              Untuk dapat mengakses semua fitur sistem koperasi, Anda perlu mendaftar
              sebagai anggota terlebih dahulu. Pendaftaran Anda akan diverifikasi oleh
              Divisi Simpan Pinjam dan Ketua Koperasi.
            </p>
          </div>

          {/* Info Alert */}
          <Alert className="max-w-2xl">
            <FileText className="h-4 w-4" />
            <AlertDescription className='flex flex-col justify-center items-center'>
              <div className="space-y-2">
                <p className="font-medium">Proses Pendaftaran:</p>
                <ol className="list-decimal list-inside space-y-1 text-sm text-center">
                  <li>Lengkapi formulir pendaftaran dengan data yang valid</li>
                  <li>Menunggu verifikasi dari Divisi Simpan Pinjam</li>
                  <li>Menunggu persetujuan final dari Ketua Koperasi</li>
                  <li>Akun Anda akan diaktifkan setelah disetujui</li>
                </ol>
              </div>
            </AlertDescription>
          </Alert>

          {/* CTA Button */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <Button
                    size="lg"
                    onClick={() => setShowForm(true)}
                    className="gap-2"
                    disabled={user?.employee?.employeeType !== 'TETAP'}
                  >
                    <UserPlus className="h-5 w-5" />
                    Daftar Sebagai Anggota Koperasi
                  </Button>
                </div>
              </TooltipTrigger>
              {user?.employee?.employeeType !== 'TETAP' && (
                <TooltipContent>
                  <p>Anda bukan karyawan tetap</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </div>
  );
}
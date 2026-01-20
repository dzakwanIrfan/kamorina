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
import { useAuthStore } from '@/store/auth.store';
import { MemberApplicationForm } from '@/components/member-application/member-application-form';
import { MyApplicationDetail } from '@/components/member-application/my-application-detail';
import { memberApplicationService } from '@/services/member-application.service';
import { handleApiError } from '@/lib/axios';
import { MemberApplication, ApplicationStatus } from '@/types/member-application.types';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [showForm, setShowForm] = useState(false);
  const [application, setApplication] = useState<MemberApplication | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user && !user.memberVerified) {
      checkApplication();
    } else {
      setIsLoading(false);
    }
  }, [user]);

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
    return (
      <div className="flex h-[calc(100vh-200px)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If user is already a verified member, show welcome dashboard
  if (user?.memberVerified) {
    return (
      <div className="space-y-6">
        {/* Welcome Card */}
        <Card className="border-primary/20 bg-linear-to-br from-primary/5 via-background to-primary/10">
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <CheckCircle2 className="h-8 w-8 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl">Selamat Datang, {user.name}!</CardTitle>
                <CardDescription className="text-base">
                  Anda adalah anggota terverifikasi Koperasi Surya Niaga Kamorina
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Simpanan</CardTitle>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                className="h-4 w-4 text-muted-foreground"
              >
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Rp 0</div>
              <p className="text-xs text-muted-foreground">Belum ada simpanan</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pinjaman Aktif</CardTitle>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                className="h-4 w-4 text-muted-foreground"
              >
                <rect width="20" height="14" x="2" y="5" rx="2" />
                <path d="M2 10h20" />
              </svg>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Rp 0</div>
              <p className="text-xs text-muted-foreground">Tidak ada pinjaman</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Transaksi Bulan Ini</CardTitle>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                className="h-4 w-4 text-muted-foreground"
              >
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">Belum ada transaksi</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Status Member</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">Aktif</div>
              <p className="text-xs text-muted-foreground">Member terverifikasi</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
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
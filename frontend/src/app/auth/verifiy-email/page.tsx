'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ThemeToggle } from '@/components/theme-toggle';

import { authService } from '@/services/auth.service';
import { handleApiError } from '@/lib/axios';

type VerificationState = 'loading' | 'success' | 'error';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [state, setState] = useState<VerificationState>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setState('error');
        setMessage('Token verifikasi tidak ditemukan');
        return;
      }

      try {
        const response = await authService.verifyEmail({ token });
        setState('success');
        setMessage(response.message);
      } catch (error) {
        setState('error');
        const errorMessage = handleApiError(error);
        setMessage(errorMessage);
      }
    };

    verifyEmail();
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-liniear-to-br from-primary/5 via-background to-primary/10 p-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            {state === 'loading' && (
              <Loader2 className="h-16 w-16 text-primary animate-spin" />
            )}
            {state === 'success' && (
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-primary" />
              </div>
            )}
            {state === 'error' && (
              <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
                <XCircle className="h-8 w-8 text-destructive" />
              </div>
            )}
          </div>
          <CardTitle className="text-2xl font-bold text-center">
            {state === 'loading' && 'Memverifikasi Email...'}
            {state === 'success' && 'Verifikasi Berhasil!'}
            {state === 'error' && 'Verifikasi Gagal'}
          </CardTitle>
          <CardDescription className="text-center">
            {message || 'Mohon tunggu sebentar...'}
          </CardDescription>
        </CardHeader>

        {state !== 'loading' && (
          <CardContent className="space-y-4">
            {state === 'success' && (
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                <p className="text-sm text-muted-foreground">
                  Email Anda telah berhasil diverifikasi. Sekarang Anda dapat login 
                  menggunakan email dan password yang telah didaftarkan.
                </p>
              </div>
            )}
            {state === 'error' && (
              <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4">
                <p className="text-sm text-muted-foreground">
                  Terjadi kesalahan saat verifikasi email. Link mungkin sudah tidak valid 
                  atau sudah digunakan sebelumnya.
                </p>
              </div>
            )}
          </CardContent>
        )}

        {state !== 'loading' && (
          <CardFooter className="flex flex-col space-y-2">
            {state === 'success' && (
              <Button
                className="w-full"
                onClick={() => router.push('/auth/login')}
              >
                Login Sekarang
              </Button>
            )}
            {state === 'error' && (
              <>
                <Button
                  className="w-full"
                  onClick={() => router.push('/auth/register')}
                >
                  Daftar Ulang
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push('/auth/login')}
                >
                  Kembali ke Login
                </Button>
              </>
            )}
          </CardFooter>
        )}
      </Card>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Link from 'next/link';

/**
 * Dashboard Error Boundary
 * Catches runtime errors in dashboard and shows user-friendly error UI
 */
export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to error reporting service
    console.error('Dashboard Error:', error);
  }, [error]);

  return (
    <div className="flex min-h-[calc(100vh-200px)] items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle className="text-2xl">Gagal Memuat Dashboard</CardTitle>
          <CardDescription>
            Terjadi kesalahan saat memuat data dashboard. Silakan coba lagi atau hubungi administrator.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              {error.message || 'Terjadi kesalahan yang tidak terduga'}
              {error.digest && (
                <span className="block mt-1 text-xs opacity-70">
                  Error ID: {error.digest}
                </span>
              )}
            </AlertDescription>
          </Alert>

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Button onClick={() => reset()} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Coba Lagi
            </Button>
            <Button variant="outline" asChild>
              <Link href="/dashboard" className="gap-2">
                <Home className="h-4 w-4" />
                Kembali ke Dashboard
              </Link>
            </Button>
          </div>

          <p className="text-center text-xs text-muted-foreground">
            Jika masalah berlanjut, silakan hubungi administrator sistem
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

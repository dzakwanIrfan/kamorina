'use client';

import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { ErrorLayout } from '@/components/errors/error-layout';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to error reporting service
    console.error('Application Error:', error);
  }, [error]);

  return (
    <ErrorLayout
      statusCode={500}
      title="Terjadi Kesalahan"
      description="Maaf, terjadi kesalahan yang tidak terduga. Tim kami telah menerima notifikasi dan sedang menangani masalah ini."
      icon={<AlertTriangle className="h-16 w-16 text-destructive" />}
      showBackButton
      showHomeButton
      showRefreshButton
    >
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="text-sm">
          {error.message || 'Terjadi kesalahan server internal'}
          {error.digest && (
            <span className="block mt-1 text-xs opacity-70">
              Error ID: {error.digest}
            </span>
          )}
        </AlertDescription>
      </Alert>
    </ErrorLayout>
  );
}
'use client';

import { AlertTriangle } from 'lucide-react';
import { ErrorLayout } from '@/components/errors/error-layout';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <ErrorLayout
          statusCode={500}
          title="Kesalahan Fatal"
          description="Aplikasi mengalami kesalahan fatal. Silakan muat ulang halaman atau hubungi administrator."
          icon={<AlertTriangle className="h-16 w-16 text-destructive" />}
          showRefreshButton
          showHomeButton={false}
          showBackButton={false}
        />
      </body>
    </html>
  );
}
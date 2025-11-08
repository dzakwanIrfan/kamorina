import { WifiOff } from 'lucide-react';
import { ErrorLayout } from '@/components/errors/error-layout';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export function NetworkError() {
  return (
    <ErrorLayout
      statusCode={0}
      title="Tidak Ada Koneksi"
      description="Tidak dapat terhubung ke server. Periksa koneksi internet Anda dan coba lagi."
      icon={<WifiOff className="h-16 w-16 text-destructive" />}
      showRefreshButton
      showHomeButton={false}
      showBackButton={false}
    >
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Pastikan Anda terhubung ke internet dan server dapat diakses.
        </AlertDescription>
      </Alert>
    </ErrorLayout>
  );
}
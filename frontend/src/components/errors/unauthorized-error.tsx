import { ShieldAlert } from 'lucide-react';
import { ErrorLayout } from '@/components/errors/error-layout';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export function UnauthorizedError() {
  return (
    <ErrorLayout
      statusCode={403}
      title="Akses Ditolak"
      description="Anda tidak memiliki izin untuk mengakses halaman ini. Silakan hubungi administrator jika Anda yakin ini adalah kesalahan."
      icon={<ShieldAlert className="h-16 w-16 text-destructive" />}
      showBackButton
      showHomeButton
    >
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Halaman ini memerlukan level akses khusus. Pastikan Anda telah login dengan akun yang memiliki hak akses yang sesuai.
        </AlertDescription>
      </Alert>
    </ErrorLayout>
  );
}
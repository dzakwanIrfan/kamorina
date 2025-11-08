import { FileQuestion } from 'lucide-react';
import { ErrorLayout } from '@/components/errors/error-layout';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InfoIcon } from 'lucide-react';

export default function NotFound() {
  return (
    <ErrorLayout
      statusCode={404}
      title="Halaman Tidak Ditemukan"
      description="Maaf, halaman yang Anda cari tidak dapat ditemukan. Mungkin halaman tersebut telah dipindahkan atau dihapus."
      icon={<FileQuestion className="h-16 w-16 text-primary" />}
      showBackButton
      showHomeButton
    >
      <Alert>
        <InfoIcon className="h-4 w-4" />
        <AlertDescription>
          Pastikan URL yang Anda masukkan sudah benar atau gunakan menu navigasi untuk menemukan halaman yang Anda cari.
        </AlertDescription>
      </Alert>
    </ErrorLayout>
  );
}
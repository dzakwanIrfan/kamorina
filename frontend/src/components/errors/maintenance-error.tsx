import { Wrench } from 'lucide-react';
import { ErrorLayout } from '@/components/errors/error-layout';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InfoIcon } from 'lucide-react';

export function MaintenanceError() {
  return (
    <ErrorLayout
      statusCode={503}
      title="Sedang Dalam Pemeliharaan"
      description="Sistem sedang dalam pemeliharaan terjadwal. Kami akan segera kembali. Terima kasih atas kesabaran Anda."
      icon={<Wrench className="h-16 w-16 text-primary" />}
      showRefreshButton
      showHomeButton={false}
      showBackButton={false}
    >
      <Alert>
        <InfoIcon className="h-4 w-4" />
        <AlertDescription>
          Estimasi waktu pemeliharaan: 30 menit - 1 jam
          <br />
          <span className="text-xs text-muted-foreground">
            Terakhir diperbarui: {new Date().toLocaleString('id-ID')}
          </span>
        </AlertDescription>
      </Alert>
    </ErrorLayout>
  );
}
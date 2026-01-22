import { EmailLogsList } from "@/components/email-logs/email-logs-list";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function EmailLogsPage() {
  return (
    <div className="flex flex-1 flex-col space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Log Email
          </h1>
          <p className="text-muted-foreground">
            Riwayat pengiriman email sistem.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Riwayat Pengiriman Email</CardTitle>
          <CardDescription>
            Memantau status pengiriman email, melihat detail konten, dan
            melakukan pengiriman ulang jika gagal.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EmailLogsList />
        </CardContent>
      </Card>
    </div>
  );
}

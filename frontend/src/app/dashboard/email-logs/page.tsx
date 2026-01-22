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
    <div className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold md:text-2xl">Log Email</h1>
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

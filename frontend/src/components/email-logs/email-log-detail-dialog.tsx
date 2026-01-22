"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmailLog, EmailStatus } from "@/types/email-logs.types";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Mail,
  User,
  Clock,
  AlertCircle,
  FileText,
  CheckCircle2,
  XCircle,
} from "lucide-react";

interface EmailLogDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  log: EmailLog | null;
}

const statusConfig = {
  [EmailStatus.SENT]: {
    label: "Terkirim",
    variant: "default" as const,
    icon: CheckCircle2,
    className: "bg-green-600 hover:bg-green-700",
  },
  [EmailStatus.PENDING]: {
    label: "Pending",
    variant: "secondary" as const,
    icon: Clock,
    className: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200",
  },
  [EmailStatus.FAILED]: {
    label: "Gagal",
    variant: "destructive" as const,
    icon: XCircle,
    className: "",
  },
};

export function EmailLogDetailDialog({
  open,
  onOpenChange,
  log,
}: EmailLogDetailDialogProps) {
  if (!log) return null;

  const status = statusConfig[log.status] || {
    label: log.status,
    variant: "outline",
    icon: AlertCircle,
    className: "",
  };

  const StatusIcon = status.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detail Log Email</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details">
              <FileText className="h-4 w-4 mr-2" />
              Informasi & Header
            </TabsTrigger>
            <TabsTrigger value="content">
              <Mail className="h-4 w-4 mr-2" />
              Konten Email
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-6 mt-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-muted-foreground">
                Status Pengiriman
              </p>
              <Badge
                variant={status.variant}
                className={`flex items-center gap-1.5 px-3 py-1 ${status.className}`}
              >
                <StatusIcon className="h-3.5 w-3.5" />
                {status.label}
              </Badge>
            </div>
            {/* Error Section if Failed */}
            {log.status === EmailStatus.FAILED && log.errorMessage && (
              <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-4 space-y-2">
                <h3 className="font-semibold text-destructive flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Informasi Error
                </h3>
                <p className="text-sm font-mono bg-white/50 p-2 rounded border border-destructive/10">
                  {log.errorMessage}
                </p>
              </div>
            )}

            {/* Email Headers */}
            <div className="rounded-lg border p-4 space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Header Email
              </h3>
              <Separator />
              <div className="grid gap-4">
                <div className="grid grid-cols-[120px_1fr] items-center gap-4 text-sm">
                  <span className="text-muted-foreground font-medium">
                    Subjek
                  </span>
                  <span className="font-medium">{log.subject}</span>
                </div>
                <div className="grid grid-cols-[120px_1fr] items-center gap-4 text-sm">
                  <span className="text-muted-foreground font-medium">
                    Pengirim
                  </span>
                  <div className="flex flex-col">
                    <span className="font-medium">{log.email?.fromName}</span>
                    <span className="text-xs text-muted-foreground font-mono">
                      {log.email?.username}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-[120px_1fr] items-center gap-4 text-sm">
                  <span className="text-muted-foreground font-medium">
                    Penerima
                  </span>
                  <span className="font-mono bg-muted px-2 py-0.5 rounded w-fit text-xs sm:text-sm">
                    {log.recipient}
                  </span>
                </div>
              </div>
            </div>

            {/* Delivery Details */}
            <div className="rounded-lg border p-4 space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Detail Pengiriman
              </h3>
              <Separator />
              <div className="grid sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground mb-1">Waktu Kirim</p>
                  <p className="font-medium">
                    {format(new Date(log.sentAt), "dd MMMM yyyy", {
                      locale: id,
                    })}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(log.sentAt), "HH:mm:ss", { locale: id })}{" "}
                    WIB
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">
                    Percobaan Kirim (Retry)
                  </p>
                  <p className="font-medium">{log.retryCount}x</p>
                </div>
              </div>
            </div>

            {/* Sender Config Info */}
            <div className="rounded-lg border p-4 space-y-4 bg-muted/30">
              <h3 className="font-semibold flex items-center gap-2">
                <User className="h-4 w-4" />
                Email Pengirim
              </h3>
              <Separator />
              <div className="text-sm">
                <p className="text-muted-foreground mb-1">{log.email?.fromName || "N/A (Deleted or Unknown)"}</p>
                <span className="font-mono text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                  {log.email?.username || "N/A (Deleted or Unknown)"}
                </span>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="content" className="space-y-6 mt-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-muted-foreground">
                Preview HTML
              </p>
              <Badge variant="outline" className="text-xs font-normal">
                Secure View
              </Badge>
            </div>
            <div className="flex-1 rounded-md border bg-white overflow-hidden relative">
              {log.content ? (
                <ScrollArea className="h-full w-full">
                  <div className="p-4">
                    <div
                      className="prose prose-sm max-w-none prose-headings:font-bold prose-a:text-blue-600 text-slate-900"
                      dangerouslySetInnerHTML={{ __html: log.content }}
                    />
                  </div>
                </ScrollArea>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                  <p className="italic">Tidak ada konten email.</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

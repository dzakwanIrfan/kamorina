"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { EmailConfigList } from "@/components/email-config/email-config-list";
import { EmailConfigDialog } from "@/components/email-config/email-config-dialog";
import { emailConfigService } from "@/services/email-config.service";
import { EmailConfig } from "@/types/email-config.types";

export default function EmailConfigPage() {
  const [data, setData] = useState<EmailConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<EmailConfig | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const configs = await emailConfigService.getAll();
      setData(configs);
    } catch (error) {
      console.error(error);
      toast.error("Gagal memuat data konfigurasi email");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = () => {
    setEditingConfig(null);
    setDialogOpen(true);
  };

  const handleEdit = (config: EmailConfig) => {
    setEditingConfig(config);
    setDialogOpen(true);
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Konfigurasi Email
          </h1>
          <p className="text-muted-foreground">
            Kelola konfigurasi SMTP untuk pengiriman email sistem.
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Tambah Konfigurasi
        </Button>
      </div>

      <div className="bg-card rounded-lg border shadow-sm p-6">
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <span className="text-muted-foreground">Memuat data...</span>
          </div>
        ) : (
          <EmailConfigList
            data={data}
            onEdit={handleEdit}
            onRefresh={fetchData}
          />
        )}
      </div>

      <EmailConfigDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        config={editingConfig}
        onSuccess={fetchData}
      />
    </div>
  );
}

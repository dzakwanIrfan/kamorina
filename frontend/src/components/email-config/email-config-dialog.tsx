"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmailConfigForm } from "./email-config-form";
import { EmailConfig } from "@/types/email-config.types";
import { emailConfigService } from "@/services/email-config.service";
import { EmailConfigFormValues } from "./schema";

interface EmailConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config?: EmailConfig | null; // If null/undefined -> Create mode
  onSuccess: () => void;
}

export function EmailConfigDialog({
  open,
  onOpenChange,
  config,
  onSuccess,
}: EmailConfigDialogProps) {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values: EmailConfigFormValues) => {
    try {
      setLoading(true);
      if (config) {
        await emailConfigService.update(config.id, values);
        toast.success("Konfigurasi email berhasil diperbarui");
      } else {
        await emailConfigService.create(values);
        toast.success("Konfigurasi email berhasil dibuat");
      }
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      toast.error("Gagal menyimpan konfigurasi email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {config ? "Edit Konfigurasi Email" : "Tambah Konfigurasi Email"}
          </DialogTitle>
          <DialogDescription>
            {config
              ? "Ubah detail konfigurasi SMTP email di bawah ini."
              : "Tambahkan konfigurasi SMTP baru untuk pengiriman email."}
          </DialogDescription>
        </DialogHeader>
        <EmailConfigForm
          defaultValues={config || undefined}
          onSubmit={handleSubmit}
          isLoading={loading}
        />
      </DialogContent>
    </Dialog>
  );
}

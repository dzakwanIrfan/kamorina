"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { emailConfigSchema, type EmailConfigFormValues } from "./schema";
import { type EmailConfig } from "@/types/email-config.types";

interface EmailConfigFormProps {
  defaultValues?: EmailConfig;
  onSubmit: (data: EmailConfigFormValues) => Promise<void>;
  isLoading?: boolean;
}

export function EmailConfigForm({
  defaultValues,
  onSubmit,
  isLoading,
}: EmailConfigFormProps) {
  const form = useForm<EmailConfigFormValues>({
    resolver: zodResolver(emailConfigSchema),
    defaultValues: {
      label: "",
      host: "smtp.gmail.com",
      port: 587,
      username: "",
      password: "",
      fromName: "",
      isActive: false,
    },
  });

  useEffect(() => {
    if (defaultValues) {
      form.reset({
        label: defaultValues.label || "",
        host: defaultValues.host,
        port: defaultValues.port,
        username: defaultValues.username,
        password: "",
        fromName: defaultValues.fromName,
        isActive: defaultValues.isActive,
      });
    }
  }, [defaultValues, form]);

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((data) => onSubmit(data))}
        className="space-y-4"
      >
        <FormField
          control={form.control}
          name="label"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Label (Opsional)</FormLabel>
              <FormControl>
                <Input
                  placeholder="Contoh: Email Utama"
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="host"
            render={({ field }) => (
              <FormItem>
                <FormLabel>SMTP Host</FormLabel>
                <FormControl>
                  <Input placeholder="smtp.gmail.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="port"
            render={({ field }) => (
              <FormItem>
                <FormLabel>SMTP Port</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="587"
                    {...field}
                    onChange={(e) =>
                      field.onChange(e.target.valueAsNumber || 0)
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username / Email</FormLabel>
              <FormControl>
                <Input placeholder="admin@koperasi.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password App / Password Email</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder={
                    defaultValues
                      ? "Biarkan kosong jika tidak ingin mengubah"
                      : "Masukkan password aplikasi"
                  }
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormDescription>
                Gunakan App Password jika menggunakan Gmail dengan 2FA.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="fromName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nama Pengirim</FormLabel>
              <FormControl>
                <Input placeholder="Koperasi Surya Niaga" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">
                  Aktifkan Konfigurasi
                </FormLabel>
                <FormDescription>
                  Jika aktif, konfigurasi ini akan digunakan untuk mengirim
                  email sistem. Konfigurasi lain akan dinonaktifkan otomatis.
                </FormDescription>
              </div>
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {defaultValues ? "Simpan Perubahan" : "Simpan Konfigurasi"}
        </Button>
      </form>
    </Form>
  );
}

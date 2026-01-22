import { z } from "zod";

export const emailConfigSchema = z.object({
  label: z.string().optional(),
  host: z.string().min(1, "Host harus diisi"),
  port: z.number().min(1, "Port harus diisi"),
  username: z
    .email("Format email tidak valid")
    .min(1, "Username/Email harus diisi"),
  password: z.string().optional(),
  fromName: z.string().min(1, "Nama Pengirim harus diisi"),
  isActive: z.boolean(),
});

export type EmailConfigFormValues = z.infer<typeof emailConfigSchema>;

"use client";

import { UseFormReturn } from "react-hook-form";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar as CalendarIcon, Wallet } from "lucide-react";
import { LoanEligibility } from "@/types/loan.types";
import { CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useAuthStore } from "@/store/auth.store";

interface CommonLoanFieldsProps {
  form: UseFormReturn<any>;
  eligibility: LoanEligibility;
  isSubmitting: boolean;
}

export function CommonLoanFields({
  form,
  eligibility,
  isSubmitting,
}: CommonLoanFieldsProps) {
  const { user } = useAuthStore();
  return (
    <>
      <FormField
        control={form.control}
        name="loanTenor"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Lama Pinjaman (Tenor)</FormLabel>
            <FormControl>
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  type="number"
                  placeholder="12"
                  className="pl-10"
                  {...field}
                  onChange={(e) =>
                    field.onChange(parseInt(e.target.value) || 0)
                  }
                  disabled={isSubmitting}
                />
              </div>
            </FormControl>
            <FormDescription>
              Dalam bulan. Maksimal {eligibility.loanLimit.maxTenor} bulan
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="loanPurpose"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Alasan Peminjaman</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Jelaskan alasan dan tujuan peminjaman Anda..."
                rows={4}
                {...field}
                disabled={isSubmitting}
              />
            </FormControl>
            <FormDescription>
              Minimal 10 karakter. Jelaskan secara detail.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Bank Account Verification */}
      <FormField
        control={form.control}
        name="isBankAccountVerified"
        render={({ field }) => (
          <FormItem className="flex flex-col gap-2 rounded-lg border p-4 shadow-sm bg-card">
            <div className="space-y-0.5">
              <FormLabel className="text-base font-semibold">
                Rekening Penerima
              </FormLabel>
              <CardDescription>
                Dana akan ditransfer ke nomor rekening yang terdaftar di perusahaan
              </CardDescription>
            </div>

            <div className="flex items-center p-3 my-2 bg-muted rounded-md border">
              <Wallet className="h-5 w-5 mr-3 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">
                  Nomor Rekening
                </p>
                <p className="text-lg font-bold tracking-wide">
                  {user?.employee?.bankAccountNumber || "-"} ({user?.employee?.bankAccountName})
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 mt-2">
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel className="cursor-pointer font-normal text-sm">
                  Saya memverifikasi bahwa nomor rekening di atas adalah benar
                  milik saya
                </FormLabel>
              </div>
            </div>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
}

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
import { Textarea } from "@/components/ui/textarea";
import { LoanEligibility } from "@/types/loan.types";
import { formatCurrency } from "@/lib/loan-utils";
import { CurrencyInput } from "@/components/ui/currency-input";

interface CashLoanFieldsProps {
  form: UseFormReturn<any>;
  eligibility: LoanEligibility;
  isSubmitting: boolean;
}

export function CashLoanFields({
  form,
  eligibility,
  isSubmitting,
}: CashLoanFieldsProps) {
  return (
    <>
      <FormField
        control={form.control}
        name="loanAmount"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Jumlah Pinjaman</FormLabel>
            <FormControl>
              <CurrencyInput
                placeholder="Masukkan jumlah yang ingin dipinjam"
                value={field.value}
                onChange={(value) => field.onChange(parseFloat(value) || 0)}
                minValue={eligibility.loanLimit.minLoanAmount}
                maxValue={eligibility.loanLimit.maxLoanAmount}
                disabled={isSubmitting}
              />
            </FormControl>
            <FormDescription>
              Minimal {formatCurrency(eligibility.loanLimit.minLoanAmount)} -
              Maksimal {formatCurrency(eligibility.loanLimit.maxLoanAmount)}
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="notes"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Catatan Tambahan (Opsional)</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Tambahkan catatan jika diperlukan..."
                rows={3}
                {...field}
                disabled={isSubmitting}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
}

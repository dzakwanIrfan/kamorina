'use client';

import { UseFormReturn } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { DollarSign } from 'lucide-react';
import { LoanEligibility } from '@/types/loan.types';
import { formatCurrency } from '@/lib/loan-utils';

interface CashLoanFieldsProps {
  form: UseFormReturn<any>;
  eligibility: LoanEligibility;
  isSubmitting: boolean;
}

export function CashLoanFields({ form, eligibility, isSubmitting }: CashLoanFieldsProps) {
  return (
    <>
      <FormField
        control={form.control}
        name="loanAmount"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Jumlah Pinjaman</FormLabel>
            <FormControl>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  type="number"
                  placeholder="5000000"
                  className="pl-10"
                  {...field}
                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  disabled={isSubmitting}
                />
              </div>
            </FormControl>
            <FormDescription>
              Minimal {formatCurrency(eligibility.loanLimit.minLoanAmount)} - Maksimal{' '}
              {formatCurrency(eligibility.loanLimit.maxLoanAmount)}
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
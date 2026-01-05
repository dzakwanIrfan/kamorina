'use client';

import { UseFormReturn } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar as CalendarIcon } from 'lucide-react';
import { LoanEligibility } from '@/types/loan.types';

interface CommonLoanFieldsProps {
  form: UseFormReturn<any>;
  eligibility: LoanEligibility;
  isSubmitting: boolean;
}

export function CommonLoanFields({ 
  form, 
  eligibility, 
  isSubmitting 
}: CommonLoanFieldsProps) {
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
                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
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
            <FormDescription>Minimal 10 karakter. Jelaskan secara detail.</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
}
'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { Loader2, Check, ChevronsUpDown, User, HeartHandshake } from 'lucide-react';

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { CurrencyInput } from '@/components/ui/currency-input';
import { cn } from '@/lib/utils';
import { socialFundService } from '@/services/social-fund.service';
import { loanService } from '@/services/loan.service';
import { handleApiError } from '@/lib/axios';
import { LoanType } from '@/types/loan.types';
import type { EligibleMember } from '@/types/social-fund.types';
import { toast } from 'sonner';

const formSchema = z.object({
  recipientUserId: z.string().min(1, 'Anggota penerima harus dipilih'),
  loanAmount: z
    .string()
    .min(1, 'Jumlah pinjaman harus diisi')
    .refine((val) => {
      const num = Number(val);
      return !isNaN(num) && num > 0;
    }, 'Jumlah pinjaman harus lebih dari 0'),
  loanTenor: z
    .string()
    .min(1, 'Tenor harus diisi')
    .refine((val) => {
      const num = Number(val);
      return !isNaN(num) && num >= 1 && num <= 60 && Number.isInteger(num);
    }, 'Tenor harus antara 1-60 bulan'),
  loanPurpose: z.string().min(1, 'Tujuan pinjaman harus diisi'),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export function ExcessLoanForm() {
  const router = useRouter();
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      recipientUserId: '',
      loanAmount: '',
      loanTenor: '',
      loanPurpose: '',
      notes: '',
    },
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [comboboxOpen, setComboboxOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [members, setMembers] = useState<EligibleMember[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedMember, setSelectedMember] = useState<EligibleMember | null>(null);
  const [currentBalance, setCurrentBalance] = useState<number>(0);
  const [isLoadingBalance, setIsLoadingBalance] = useState(true);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load current social fund balance
  useEffect(() => {
    async function loadBalance() {
      try {
        const balance = await socialFundService.getBalance();
        setCurrentBalance(balance.currentBalance);
      } catch (error) {
        console.error('Failed to load balance:', handleApiError(error));
      } finally {
        setIsLoadingBalance(false);
      }
    }
    loadBalance();
  }, []);

  // Debounced member search
  const searchMembers = useCallback(async (query: string) => {
    try {
      setIsSearching(true);
      const results = await socialFundService.getEligibleMembers(query || undefined);
      setMembers(results);
    } catch (error) {
      console.error('Failed to search members:', handleApiError(error));
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    if (!comboboxOpen) return;

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      searchMembers(searchQuery);
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [searchQuery, comboboxOpen, searchMembers]);

  useEffect(() => {
    if (comboboxOpen && members.length === 0) {
      searchMembers('');
    }
  }, [comboboxOpen, members.length, searchMembers]);

  const handleMemberSelect = (member: EligibleMember) => {
    setSelectedMember(member);
    form.setValue('recipientUserId', member.id, { shouldValidate: true });
    setComboboxOpen(false);
  };

  const loanAmount = Number(form.watch('loanAmount')) || 0;
  const loanTenor = Number(form.watch('loanTenor')) || 0;
  const monthlyInstallment = loanTenor > 0 ? Math.round((loanAmount / loanTenor) * 100) / 100 : 0;

  const handleSubmit = async (data: FormData) => {
    const amount = Number(data.loanAmount);
    if (amount > currentBalance) {
      toast.error('Jumlah pinjaman melebihi saldo dana sosial');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await loanService.createDraft({
        loanType: LoanType.EXCESS_LOAN,
        loanAmount: amount,
        loanTenor: Number(data.loanTenor),
        loanPurpose: data.loanPurpose,
        recipientUserId: data.recipientUserId,
        notes: data.notes || undefined,
      });

      // Auto-submit after draft creation
      await loanService.submitLoan(result.loan.id);
      toast.success('Pinjaman Excess berhasil diajukan');
      router.push('/dashboard/social-fund/excess-loan');
    } catch (error) {
      toast.error(handleApiError(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Balance Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <HeartHandshake className="h-5 w-5 text-rose-600" />
            Saldo Dana Sosial
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingBalance ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <p className="text-2xl font-bold text-primary">
              {formatCurrency(currentBalance)}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Form Pinjaman Excess</CardTitle>
          <CardDescription>
            Buat pinjaman tanpa bunga dari dana sosial untuk anggota. Pinjaman ini
            hanya dapat diajukan oleh Ketua atau DSP.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              {/* Member Combobox */}
              <FormField
                control={form.control}
                name="recipientUserId"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Anggota Penerima</FormLabel>
                    <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={comboboxOpen}
                            className={cn(
                              'w-full justify-between',
                              !field.value && 'text-muted-foreground',
                            )}
                            disabled={isSubmitting}
                          >
                            {selectedMember
                              ? selectedMember.employee.fullName
                              : 'Pilih anggota...'}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                        <Command shouldFilter={false}>
                          <CommandInput
                            placeholder="Cari nama atau NIK..."
                            value={searchQuery}
                            onValueChange={setSearchQuery}
                          />
                          <CommandList>
                            {isSearching ? (
                              <div className="flex items-center justify-center py-6">
                                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                <span className="ml-2 text-sm text-muted-foreground">
                                  Mencari...
                                </span>
                              </div>
                            ) : (
                              <>
                                <CommandEmpty>Tidak ada anggota ditemukan.</CommandEmpty>
                                <CommandGroup>
                                  {members.map((member) => (
                                    <CommandItem
                                      key={member.id}
                                      value={member.id}
                                      onSelect={() => handleMemberSelect(member)}
                                      className="cursor-pointer"
                                    >
                                      <Check
                                        className={cn(
                                          'mr-2 h-4 w-4',
                                          field.value === member.id
                                            ? 'opacity-100'
                                            : 'opacity-0',
                                        )}
                                      />
                                      <div className="flex flex-col">
                                        <span className="font-medium">
                                          {member.employee.fullName}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                          NIK: {member.nik || '-'} &middot; No.{' '}
                                          {member.employee.employeeNumber} &middot;{' '}
                                          {member.employee.department.departmentName}
                                        </span>
                                      </div>
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </>
                            )}
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Auto-filled member info */}
              {selectedMember && (
                <div className="rounded-lg border bg-muted/50 p-3 space-y-1.5">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <User className="h-4 w-4 text-muted-foreground" />
                    Detail Anggota
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Nama: </span>
                      <span className="font-medium">{selectedMember.employee.fullName}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">NIK: </span>
                      <span className="font-medium">{selectedMember.nik || '-'}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">No. Karyawan: </span>
                      <span className="font-medium">{selectedMember.employee.employeeNumber}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Departemen: </span>
                      <span className="font-medium">
                        {selectedMember.employee.department.departmentName}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Loan Amount */}
              <FormField
                control={form.control}
                name="loanAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Jumlah Pinjaman</FormLabel>
                    <FormControl>
                      <CurrencyInput
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Masukkan jumlah pinjaman"
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    {field.value && Number(field.value) > currentBalance && (
                      <FormDescription className="text-destructive">
                        Jumlah melebihi saldo dana sosial saat ini
                      </FormDescription>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Tenor */}
              <FormField
                control={form.control}
                name="loanTenor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tenor (Bulan)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        max={60}
                        placeholder="Masukkan tenor dalam bulan"
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Calculation Preview */}
              {loanAmount > 0 && loanTenor > 0 && (
                <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
                  <p className="text-sm font-medium">Simulasi Cicilan</p>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Bunga</p>
                      <p className="font-bold text-green-600">0%</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Cicilan/Bulan</p>
                      <p className="font-bold">{formatCurrency(monthlyInstallment)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Total Bayar</p>
                      <p className="font-bold">{formatCurrency(loanAmount)}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Purpose */}
              <FormField
                control={form.control}
                name="loanPurpose"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tujuan Pinjaman</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Jelaskan tujuan/keperluan pinjaman"
                        className="min-h-20"
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Notes */}
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Catatan (Opsional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Catatan tambahan"
                        className="min-h-20"
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={isSubmitting}
                >
                  Batal
                </Button>
                <Button type="submit" disabled={isSubmitting || currentBalance === 0}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Mengajukan...
                    </>
                  ) : (
                    'Ajukan Pinjaman'
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

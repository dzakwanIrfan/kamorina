'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, Check, ChevronsUpDown, User } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { CurrencyInput } from '@/components/ui/currency-input';
import { cn } from '@/lib/utils';
import { socialFundService } from '@/services/social-fund.service';
import { handleApiError } from '@/lib/axios';
import { EligibleMember } from '@/types/social-fund.types';

const formSchema = z.object({
  recipientUserId: z.string().min(1, 'Anggota penerima harus dipilih'),
  amount: z
    .string()
    .min(1, 'Angka santunan harus diisi')
    .refine((val) => {
      const num = Number(val);
      return !isNaN(num) && num > 0;
    }, 'Angka santunan harus lebih dari 0'),
  description: z.string().min(1, 'Alasan/peruntukan harus diisi'),
});

type FormData = z.infer<typeof formSchema>;

interface SantunanFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    recipientUserId: string;
    amount: number;
    description: string;
  }) => Promise<void>;
  isLoading?: boolean;
  currentBalance: number;
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export function SantunanFormDialog({
  open,
  onOpenChange,
  onSubmit,
  isLoading = false,
  currentBalance,
}: SantunanFormDialogProps) {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      recipientUserId: '',
      amount: '',
      description: '',
    },
  });

  const [comboboxOpen, setComboboxOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [members, setMembers] = useState<EligibleMember[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedMember, setSelectedMember] = useState<EligibleMember | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // Load initial members when combobox opens
  useEffect(() => {
    if (comboboxOpen && members.length === 0) {
      searchMembers('');
    }
  }, [comboboxOpen, members.length, searchMembers]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      form.reset();
      setSelectedMember(null);
      setSearchQuery('');
      setMembers([]);
    }
  }, [open, form]);

  const handleMemberSelect = (member: EligibleMember) => {
    setSelectedMember(member);
    form.setValue('recipientUserId', member.id, { shouldValidate: true });
    setComboboxOpen(false);
  };

  const handleSubmit = async (data: FormData) => {
    await onSubmit({
      recipientUserId: data.recipientUserId,
      amount: Number(data.amount),
      description: data.description,
    });
    form.reset();
    setSelectedMember(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Buat Santunan</DialogTitle>
          <DialogDescription>
            Cairkan dana sosial kepada anggota yang berhak. Saldo saat ini:{' '}
            <span className="font-semibold text-primary">
              {formatCurrency(currentBalance)}
            </span>
          </DialogDescription>
        </DialogHeader>
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
                          disabled={isLoading}
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

            {/* Amount */}
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Angka Santunan</FormLabel>
                  <FormControl>
                    <CurrencyInput
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Masukkan jumlah santunan"
                      disabled={isLoading}
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

            {/* Reason */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Alasan/Peruntukan</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Contoh: Santunan duka cita, santunan sakit, dll."
                      className="min-h-20"
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Batal
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  'Simpan'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

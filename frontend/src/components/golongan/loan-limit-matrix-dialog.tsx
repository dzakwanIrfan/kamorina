'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, Plus, Trash2, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Golongan, LoanLimitMatrix } from '@/types/golongan.types';
import { golonganService } from '@/services/golongan.service';
import { handleApiError } from '@/lib/axios';

const YEAR_RANGES = [
  { min: 0, max: 1, label: '< 1 th' },
  { min: 1, max: 2, label: '1-2 Th' },
  { min: 2, max: 3, label: '2-3 Th' },
  { min: 3, max: 6, label: '3-6 Th' },
  { min: 6, max: 9, label: '6-9 Th' },
  { min: 9, max: null, label: '> 9 Th' },
];

interface LoanLimitMatrixDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  golongan: Golongan | null;
  onSuccess?: () => void;
}

export function LoanLimitMatrixDialog({
  open,
  onOpenChange,
  golongan,
  onSuccess,
}: LoanLimitMatrixDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [loanLimits, setLoanLimits] = useState<Record<string, string>>({});

  useEffect(() => {
    if (golongan && open) {
      fetchLoanLimits();
    }
  }, [golongan, open]);

  const fetchLoanLimits = async () => {
    if (!golongan) return;

    setIsLoading(true);
    try {
      const limits = await golonganService.getLoanLimitsByGolongan(golongan.id);
      
      const limitsMap: Record<string, string> = {};
      limits.forEach((limit) => {
        const key = `${limit.minYearsOfService}-${limit.maxYearsOfService ?? 'null'}`;
        limitsMap[key] = limit.maxLoanAmount.toString();
      });
      
      setLoanLimits(limitsMap);
    } catch (error) {
      toast.error('Gagal memuat data plafond', {
        description: handleApiError(error),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAmountChange = (minYears: number, maxYears: number | null, value: string) => {
    const key = `${minYears}-${maxYears ?? 'null'}`;
    setLoanLimits((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const formatCurrency = (value: string): string => {
    const number = value.replace(/\D/g, '');
    return new Intl.NumberFormat('id-ID').format(Number(number));
  };

  const handleSave = async () => {
    if (!golongan) return;

    setIsSaving(true);
    try {
      const limits = YEAR_RANGES.map((range) => {
        const key = `${range.min}-${range.max ?? 'null'}`;
        const amount = loanLimits[key] || '0';
        
        return {
          minYearsOfService: range.min.toString(),
          maxYearsOfService: range.max?.toString() ?? 'null',
          maxLoanAmount: amount.replace(/\D/g, ''),
        };
      });

      await golonganService.bulkUpdateLoanLimits({
        golonganId: golongan.id,
        limits,
      });

      toast.success('Berhasil', {
        description: 'Plafond pinjaman berhasil disimpan',
      });

      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      toast.error('Gagal menyimpan', {
        description: handleApiError(error),
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!golongan) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Matrik Plafond Pinjaman</DialogTitle>
          <DialogDescription>
            Atur plafond maksimal pinjaman berdasarkan masa kerja untuk golongan{' '}
            <span className="font-semibold">{golongan.golonganName}</span>
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2 text-sm text-muted-foreground">Memuat data...</span>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">Masa Kerja</TableHead>
                    <TableHead>Plafond Maksimal (Rp)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {YEAR_RANGES.map((range) => {
                    const key = `${range.min}-${range.max ?? 'null'}`;
                    const value = loanLimits[key] || '';

                    return (
                      <TableRow key={key}>
                        <TableCell className="font-medium">{range.label}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Input
                              type="text"
                              placeholder="0"
                              value={formatCurrency(value)}
                              onChange={(e) => {
                                const rawValue = e.target.value.replace(/\D/g, '');
                                handleAmountChange(range.min, range.max, rawValue);
                              }}
                              className="max-w-xs"
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            <div className="rounded-lg bg-muted p-4">
              <h4 className="mb-2 text-sm font-semibold">Catatan:</h4>
              <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                <li>Masa kerja dihitung dari tanggal karyawan tetap</li>
                <li>Plafond dalam satuan Rupiah</li>
                <li>Isi 0 jika tidak ada plafond untuk range tertentu</li>
              </ul>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Batal
          </Button>
          <Button onClick={handleSave} disabled={isSaving || isLoading}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Menyimpan...
              </>
            ) : (
              'Simpan'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
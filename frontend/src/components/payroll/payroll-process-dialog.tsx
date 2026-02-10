"use client";

import { useState } from "react";
import { Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import { payrollService } from "@/services/payroll.service";
import { PayrollProcessResult } from "@/types/payroll.types";

interface PayrollProcessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const months = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

export function PayrollProcessDialog({
  open,
  onOpenChange,
  onSuccess,
}: PayrollProcessDialogProps) {
  const currentDate = new Date();
  const [month, setMonth] = useState(String(currentDate.getMonth() + 1));
  const [year, setYear] = useState(String(currentDate.getFullYear()));
  const [force, setForce] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<PayrollProcessResult | null>(null);

  const currentYear = currentDate.getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  const handleProcess = async () => {
    setIsProcessing(true);
    try {
      const response = await payrollService.triggerPayroll({
        month: parseInt(month),
        year: parseInt(year),
        force,
      });
      setResult(response.data);
      toast.success("Payroll berhasil diproses!");
      onSuccess();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Gagal memproses payroll");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setResult(null);
    setForce(false);
    onOpenChange(false);
  };

  const formatCurrency = (amount: string): string => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(parseFloat(amount));
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Proses Payroll</DialogTitle>
          <DialogDescription>
            Jalankan proses payroll untuk periode tertentu. Proses ini akan
            menghitung iuran, tabungan, dan bunga untuk seluruh anggota.
          </DialogDescription>
        </DialogHeader>

        {result ? (
          /* Result View */
          <div className="space-y-4">
            <Alert className="border-green-200 bg-green-50 dark:bg-green-900/20">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-700 dark:text-green-400">
                Payroll Berhasil Diproses
              </AlertTitle>
              <AlertDescription className="text-green-600 dark:text-green-400">
                {result.periodName}
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <h4 className="font-medium text-sm">Ringkasan Proses</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex justify-between border rounded-md p-2">
                  <span className="text-muted-foreground">Simpanan Pokok</span>
                  <span className="font-medium">
                    {result.summary.membership.count} (
                    {formatCurrency(result.summary.membership.total)})
                  </span>
                </div>
                <div className="flex justify-between border rounded-md p-2">
                  <span className="text-muted-foreground">Iuran Wajib</span>
                  <span className="font-medium">
                    {result.summary.mandatorySavings.count} (
                    {formatCurrency(result.summary.mandatorySavings.total)})
                  </span>
                </div>
                <div className="flex justify-between border rounded-md p-2">
                  <span className="text-muted-foreground">Tab. Deposito</span>
                  <span className="font-medium">
                    {result.summary.depositSavings.count} (
                    {formatCurrency(result.summary.depositSavings.total)})
                  </span>
                </div>
                <div className="flex justify-between border rounded-md p-2">
                  <span className="text-muted-foreground">Angsuran</span>
                  <span className="font-medium">
                    {result.summary.loanInstallment.count} (
                    {formatCurrency(result.summary.loanInstallment.total)})
                  </span>
                </div>
                <div className="flex justify-between border rounded-md p-2">
                  <span className="text-muted-foreground">Bunga</span>
                  <span className="font-medium">
                    {result.summary.interest.count} (
                    {formatCurrency(result.summary.interest.total)})
                  </span>
                </div>
                <div className="flex justify-between border rounded-md p-2 bg-primary/5">
                  <span className="font-semibold">Grand Total</span>
                  <span className="font-bold text-primary">
                    {formatCurrency(result.summary.grandTotal)}
                  </span>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button onClick={handleClose}>Tutup</Button>
            </DialogFooter>
          </div>
        ) : (
          /* Form View */
          <div className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Perhatian</AlertTitle>
              <AlertDescription>
                Proses payroll akan menghitung dan mencatat semua transaksi
                keuangan anggota untuk periode yang dipilih. Pastikan data sudah
                benar sebelum memproses.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Bulan</Label>
                <Select value={month} onValueChange={setMonth}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map((m, i) => (
                      <SelectItem key={i} value={String(i + 1)}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tahun</Label>
                <Select value={year} onValueChange={setYear}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((y) => (
                      <SelectItem key={y} value={String(y)}>
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="force"
                checked={force}
                onCheckedChange={(c) => setForce(c as boolean)}
              />
              <Label htmlFor="force" className="text-sm">
                Paksa proses ulang jika sudah pernah diproses
              </Label>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={isProcessing}
              >
                Batal
              </Button>
              <Button onClick={handleProcess} disabled={isProcessing}>
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  "Proses Payroll"
                )}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

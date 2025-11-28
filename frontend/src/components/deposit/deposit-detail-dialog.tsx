'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  CheckCircle2,
  XCircle,
  Clock,
  User,
  FileText,
  History,
  Calendar,
  TrendingUp,
} from 'lucide-react';
import { FaRupiahSign } from "react-icons/fa6";
import { toast } from 'sonner';

import {
  DepositApplication,
  DepositStatus,
  DepositApprovalStep,
  DepositApprovalDecision,
  ApproveDepositDto,
} from '@/types/deposit.types';
import { depositService } from '@/services/deposit.service';
import { handleApiError } from '@/lib/axios';

interface DepositDetailDialogProps {
  deposit: (DepositApplication & { calculationBreakdown?: any }) | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  canApprove?: boolean;
}

const statusMap = {
  [DepositStatus.DRAFT]: { label: 'Draft', variant: 'secondary' as const, icon: Clock },
  [DepositStatus.SUBMITTED]: { label: 'Submitted', variant: 'default' as const, icon: Clock },
  [DepositStatus.UNDER_REVIEW_DSP]: { label: 'Review DSP', variant: 'default' as const, icon: Clock },
  [DepositStatus.UNDER_REVIEW_KETUA]: { label: 'Review Ketua', variant: 'default' as const, icon: Clock },
  [DepositStatus.APPROVED]: { label: 'Disetujui', variant: 'default' as const, icon: CheckCircle2 },
  [DepositStatus.ACTIVE]: { label: 'Aktif', variant: 'default' as const, icon: CheckCircle2 },
  [DepositStatus.COMPLETED]: { label: 'Selesai', variant: 'default' as const, icon: CheckCircle2 },
  [DepositStatus.REJECTED]: { label: 'Ditolak', variant: 'destructive' as const, icon: XCircle },
  [DepositStatus.CANCELLED]: { label: 'Dibatalkan', variant: 'destructive' as const, icon: XCircle },
};

const stepMap = {
  [DepositApprovalStep.DIVISI_SIMPAN_PINJAM]: 'Divisi Simpan Pinjam',
  [DepositApprovalStep.KETUA]: 'Ketua',
};

export function DepositDetailDialog({
  deposit,
  open,
  onOpenChange,
  onSuccess,
  canApprove = false,
}: DepositDetailDialogProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [notes, setNotes] = useState('');
  const [activeTab, setActiveTab] = useState('details');

  if (!deposit) return null;

  const status = statusMap[deposit.status];
  const StatusIcon = status.icon;

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleProcess = async (decision: DepositApprovalDecision) => {
    if (!deposit) return;

    try {
      setIsProcessing(true);
      const dto: ApproveDepositDto = {
        decision,
        notes: notes.trim() || undefined,
      };

      await depositService.processApproval(deposit.id, dto);

      toast.success(
        decision === DepositApprovalDecision.APPROVED
          ? 'Deposito berhasil disetujui'
          : 'Deposito berhasil ditolak'
      );

      onSuccess?.();
      onOpenChange(false);
      setNotes('');
    } catch (error: any) {
      toast.error(handleApiError(error));
    } finally {
      setIsProcessing(false);
    }
  };

  const calculationBreakdown = deposit.calculationBreakdown;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detail Pengajuan Deposito</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">
              <FileText className="h-4 w-4 mr-2" />
              Detail
            </TabsTrigger>
            <TabsTrigger value="timeline">
              <History className="h-4 w-4 mr-2" />
              Timeline
            </TabsTrigger>
            <TabsTrigger value="calculation">
              <TrendingUp className="h-4 w-4 mr-2" />
              Perhitungan
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-6 mt-6">
            {/* Status */}
            <div className="flex items-center justify-between">
              <Badge variant={status.variant} className="flex items-center gap-2">
                <StatusIcon className="h-4 w-4" />
                {status.label}
              </Badge>
              {deposit.currentStep && (
                <Badge variant="outline">
                  Step: {stepMap[deposit.currentStep]}
                </Badge>
              )}
            </div>

            {/* Deposit Number */}
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Nomor Deposito</p>
              <p className="text-lg font-bold font-mono">{deposit.depositNumber}</p>
            </div>

            {/* User Info */}
            <div className="rounded-lg border p-4 space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <User className="h-4 w-4" />
                Informasi Pemohon
              </h3>
              <Separator />
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Nama</p>
                  <p className="font-medium">{deposit.user?.name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Email</p>
                  <p className="font-medium">{deposit.user?.email}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">No. Karyawan</p>
                  <p className="font-medium">{deposit.user?.employee.employeeNumber}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Department</p>
                  <p className="font-medium">
                    {deposit.user?.employee.department?.departmentName || '-'}
                  </p>
                </div>
              </div>
            </div>

            {/* Deposit Details */}
            <div className="rounded-lg border p-4 space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <FaRupiahSign className="h-4 w-4" />
                Detail Deposito
              </h3>
              <Separator />
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Jumlah Deposito</p>
                  <p className="text-lg font-bold text-primary">
                    {formatCurrency(deposit.amountValue)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Jangka Waktu</p>
                  <p className="font-medium">{deposit.tenorMonths} Bulan</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Suku Bunga</p>
                  <p className="font-medium">{deposit.interestRate}% per tahun</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Proyeksi Bunga</p>
                  <p className="text-lg font-bold text-green-600">
                    {deposit.projectedInterest
                      ? formatCurrency(deposit.projectedInterest)
                      : '-'}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-muted-foreground">Total Return</p>
                  <p className="text-xl font-bold text-blue-600">
                    {deposit.totalReturn ? formatCurrency(deposit.totalReturn) : '-'}
                  </p>
                </div>
              </div>
            </div>

            {/* Dates */}
            <div className="rounded-lg border p-4 space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Tanggal Penting
              </h3>
              <Separator />
              <div className="grid grid-cols-2 gap-4 text-sm">
                {deposit.submittedAt && (
                  <div>
                    <p className="text-muted-foreground">Tanggal Submit</p>
                    <p className="font-medium">
                      {format(new Date(deposit.submittedAt), 'dd MMMM yyyy', { locale: id })}
                    </p>
                  </div>
                )}
                {deposit.approvedAt && (
                  <div>
                    <p className="text-muted-foreground">Tanggal Disetujui</p>
                    <p className="font-medium">
                      {format(new Date(deposit.approvedAt), 'dd MMMM yyyy', { locale: id })}
                    </p>
                  </div>
                )}
                {deposit.activatedAt && (
                  <div>
                    <p className="text-muted-foreground">Tanggal Diaktifkan</p>
                    <p className="font-medium">
                      {format(new Date(deposit.activatedAt), 'dd MMMM yyyy', { locale: id })}
                    </p>
                  </div>
                )}
                {deposit.maturityDate && (
                  <div>
                    <p className="text-muted-foreground">Tanggal Jatuh Tempo</p>
                    <p className="font-bold text-primary">
                      {format(new Date(deposit.maturityDate), 'dd MMMM yyyy', { locale: id })}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Rejection Reason */}
            {deposit.status === DepositStatus.REJECTED && deposit.rejectionReason && (
              <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-4 space-y-2">
                <h3 className="font-semibold text-destructive">Alasan Penolakan</h3>
                <p className="text-sm">{deposit.rejectionReason}</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="timeline" className="space-y-6 mt-6">
            {/* Approval Timeline */}
            <div className="space-y-4">
              {deposit.approvals.map((approval, index) => {
                const isLast = index === deposit.approvals.length - 1;
                const isPending = !approval.decision;
                const isApproved = approval.decision === DepositApprovalDecision.APPROVED;
                const isRejected = approval.decision === DepositApprovalDecision.REJECTED;

                return (
                  <div key={approval.id} className="relative">
                    <div className="flex items-start gap-4">
                      <div className="flex flex-col items-center">
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${
                            isApproved
                              ? 'border-green-500 bg-green-50 text-green-600 dark:bg-green-950'
                              : isRejected
                              ? 'border-red-500 bg-red-50 text-red-600 dark:bg-red-950'
                              : 'border-gray-300 bg-gray-50 text-gray-400 dark:bg-gray-900'
                          }`}
                        >
                          {isApproved ? (
                            <CheckCircle2 className="h-5 w-5" />
                          ) : isRejected ? (
                            <XCircle className="h-5 w-5" />
                          ) : (
                            <Clock className="h-5 w-5" />
                          )}
                        </div>
                        {!isLast && (
                          <div
                            className={`mt-2 h-full w-0.5 ${
                              isApproved ? 'bg-green-500' : 'bg-gray-200'
                            }`}
                            style={{ minHeight: '40px' }}
                          />
                        )}
                      </div>

                      <div className="flex-1 space-y-1 pb-8">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold">{stepMap[approval.step]}</h4>
                          {isPending && (
                            <Badge variant="outline" className="gap-1">
                              <Clock className="h-3 w-3" />
                              Menunggu
                            </Badge>
                          )}
                          {isApproved && (
                            <Badge variant="default" className="gap-1 bg-green-600">
                              <CheckCircle2 className="h-3 w-3" />
                              Disetujui
                            </Badge>
                          )}
                          {isRejected && (
                            <Badge variant="destructive" className="gap-1">
                              <XCircle className="h-3 w-3" />
                              Ditolak
                            </Badge>
                          )}
                        </div>

                        {approval.approver && (
                          <p className="text-sm text-muted-foreground">
                            oleh {approval.approver.name}
                          </p>
                        )}

                        {approval.decidedAt && (
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(approval.decidedAt), 'dd MMMM yyyy HH:mm', {
                              locale: id,
                            })}
                          </p>
                        )}

                        {approval.notes && (
                          <p className="text-sm mt-2 p-2 bg-muted rounded">
                            {approval.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="calculation" className="space-y-4 mt-6">
            <div className="rounded-lg border p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">Rincian Perhitungan Deposito</h3>
                {calculationBreakdown && (
                  <Badge variant="outline">
                    {calculationBreakdown.calculationMethod === 'SIMPLE'
                      ? 'Bunga Sederhana'
                      : 'Bunga Majemuk'}
                  </Badge>
                )}
              </div>
              <Separator />

              {/* Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-xs text-muted-foreground mb-1">Pokok Deposito</p>
                  <p className="text-lg font-bold">{formatCurrency(deposit.amountValue)}</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-xs text-muted-foreground mb-1">Jangka Waktu</p>
                  <p className="text-lg font-bold">{deposit.tenorMonths} Bulan</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-xs text-muted-foreground mb-1">Suku Bunga</p>
                  <p className="text-lg font-bold">{deposit.interestRate}% p.a.</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-xs text-muted-foreground mb-1">
                    {calculationBreakdown?.calculationMethod === 'COMPOUND'
                      ? 'Effective Rate'
                      : 'Rate Efektif'}
                  </p>
                  <p className="text-lg font-bold">
                    {calculationBreakdown?.effectiveRate || deposit.interestRate}%
                  </p>
                </div>
              </div>

              {/* Result Summary */}
              <div className="bg-primary/5 rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Pokok Deposito</span>
                  <span className="font-medium">{formatCurrency(deposit.amountValue)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Proyeksi Bunga</span>
                  <span className="font-medium text-green-600">
                    +{formatCurrency(deposit.projectedInterest || 0)}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-primary">Total Return</span>
                  <span className="text-2xl font-bold text-primary">
                    {formatCurrency(deposit.totalReturn || 0)}
                  </span>
                </div>
              </div>

              {/* Monthly Breakdown Table */}
              {calculationBreakdown?.monthlyInterestBreakdown && (
                <div className="space-y-3">
                  <h4 className="font-medium">Rincian Bunga Per Bulan</h4>
                  <div className="rounded-md border overflow-hidden max-h-64 overflow-y-auto">
                    <Table>
                      <TableHeader className="sticky top-0 bg-background">
                        <TableRow>
                          <TableHead className="w-16">Bulan</TableHead>
                          <TableHead className="text-right">Saldo Awal</TableHead>
                          <TableHead className="text-right">Bunga</TableHead>
                          <TableHead className="text-right">Saldo Akhir</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {calculationBreakdown.monthlyInterestBreakdown.map((row: any) => (
                          <TableRow key={row.month}>
                            <TableCell className="font-medium">Ke-{row.month}</TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(row.openingBalance)}
                            </TableCell>
                            <TableCell className="text-right text-green-600">
                              +{formatCurrency(row.interest)}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrency(row.closingBalance)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              {/* Formula Explanation */}
              <div className="mt-6 p-4 bg-muted/50 rounded-lg space-y-2">
                <h4 className="font-medium text-sm">Rumus Perhitungan:</h4>
                {calculationBreakdown?.calculationMethod === 'COMPOUND' ? (
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>
                      <strong>Bunga Majemuk (Compound Interest):</strong>
                    </p>
                    <p className="font-mono bg-background p-2 rounded text-xs">
                      Total = Pokok × (1 + Bunga/12)^Tenor
                    </p>
                    <p className="mt-2">
                      = {formatCurrency(deposit.amountValue)} × (1 + {deposit.interestRate}%/12)^
                      {deposit.tenorMonths}
                    </p>
                    <p>= {formatCurrency(deposit.totalReturn || 0)}</p>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>
                      <strong>Bunga Sederhana (Simple Interest):</strong>
                    </p>
                    <p className="font-mono bg-background p-2 rounded text-xs">
                      Bunga = Pokok × (Suku Bunga / 100) × (Tenor / 12)
                    </p>
                    <p className="mt-2">
                      = {formatCurrency(deposit.amountValue)} × ({deposit.interestRate}% / 100) × (
                      {deposit.tenorMonths} / 12)
                    </p>
                    <p>= {formatCurrency(deposit.projectedInterest || 0)}</p>
                    <p className="mt-2">
                      <strong>Total Return</strong> = Pokok + Bunga
                    </p>
                    <p>
                      = {formatCurrency(deposit.amountValue)} +{' '}
                      {formatCurrency(deposit.projectedInterest || 0)}
                    </p>
                    <p>= {formatCurrency(deposit.totalReturn || 0)}</p>
                  </div>
                )}
              </div>

              {/* Maturity Info */}
              <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm">
                  <strong>Catatan:</strong> Deposito akan dipotong dari gaji bulanan sebesar{' '}
                  <strong>{formatCurrency(deposit.amountValue)}</strong>. Dana beserta bunga sebesar{' '}
                  <strong className="text-green-600">
                    {formatCurrency(deposit.totalReturn || 0)}
                  </strong>{' '}
                  dapat dicairkan setelah jatuh tempo pada{' '}
                  <strong>
                    {deposit.maturityDate
                      ? format(new Date(deposit.maturityDate), 'dd MMMM yyyy', { locale: id })
                      : '-'}
                  </strong>
                  .
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Action Buttons for Approvers */}
        {canApprove &&
          [DepositStatus.SUBMITTED, DepositStatus.UNDER_REVIEW_DSP, DepositStatus.UNDER_REVIEW_KETUA].includes(deposit.status) &&
          deposit.currentStep && (
            <>
              <Separator />
              <div className="space-y-4">
                <div>
                  <Label htmlFor="notes">Catatan (Opsional)</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Tambahkan catatan..."
                    className="mt-2"
                    rows={3}
                  />
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="destructive"
                    onClick={() => handleProcess(DepositApprovalDecision.REJECTED)}
                    disabled={isProcessing}
                    className="flex-1"
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Tolak
                  </Button>
                  <Button
                    onClick={() => handleProcess(DepositApprovalDecision.APPROVED)}
                    disabled={isProcessing}
                    className="flex-1"
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Setujui
                  </Button>
                </div>
              </div>
            </>
          )}
      </DialogContent>
    </Dialog>
  );
}
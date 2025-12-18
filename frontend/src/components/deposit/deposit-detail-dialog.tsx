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
  CheckCircle2,
  XCircle,
  Clock,
  User,
  FileText,
  History,
  Calendar,
  Loader2,
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
import { DepositCalculation } from '@/types/deposit-option.types';

interface DepositDetailDialogProps {
  deposit: (DepositApplication & { calculationBreakdown?: DepositCalculation }) | null;
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
  const [processingDecision, setProcessingDecision] = useState<DepositApprovalDecision | null>(null);
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
      setProcessingDecision(decision);
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
      setProcessingDecision(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detail Pengajuan Deposito</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details">
              <FileText className="h-4 w-4 mr-2" />
              Detail
            </TabsTrigger>
            <TabsTrigger value="timeline">
              <History className="h-4 w-4 mr-2" />
              Timeline Approval
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
                  <p className="font-medium">{deposit.user?.employee.fullName}</p>
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
                  <p className="text-muted-foreground">Setoran</p>
                  <p className="font-medium">{deposit.installmentCount}/{deposit.tenorMonths}</p>
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
                          className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${isApproved
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
                            className={`mt-2 h-full w-0.5 ${isApproved ? 'bg-green-500' : 'bg-gray-200'
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
                    disabled={!!processingDecision}
                    className="flex-1"
                  >
                    {processingDecision === DepositApprovalDecision.REJECTED ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <XCircle className="mr-2 h-4 w-4" />
                    )}
                    Tolak
                  </Button>
                  <Button
                    onClick={() => handleProcess(DepositApprovalDecision.APPROVED)}
                    disabled={!!processingDecision}
                    className="flex-1"
                  >
                    {processingDecision === DepositApprovalDecision.APPROVED ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                    )}
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
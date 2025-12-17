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
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  FileText,
  History,
  ArrowRightLeft,
  ArrowRight,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { toast } from 'sonner';

import { depositChangeService } from '@/services/deposit-change.service';
import { handleApiError } from '@/lib/axios';
import {
  DepositChangeRequest,
  DepositChangeApprovalDecision,
} from '@/types/deposit-change.types';
import {
  changeStatusMap,
  changeStepMap,
  changeTypeMap,
  formatCurrency,
  formatDifference,
} from '@/lib/deposit-change-constants';

interface DepositChangeDetailDialogProps {
  changeRequest: DepositChangeRequest | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  canApprove?: boolean;
}

export function DepositChangeDetailDialog({
  changeRequest,
  open,
  onOpenChange,
  onSuccess,
  canApprove = false,
}: DepositChangeDetailDialogProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [notes, setNotes] = useState('');
  const [activeTab, setActiveTab] = useState('details');

  if (!changeRequest) return null;

  const status = changeStatusMap[changeRequest.status];
  const StatusIcon = status?.icon || Clock;
  const changeType = changeTypeMap[changeRequest.changeType];

  const handleProcess = async (decision: DepositChangeApprovalDecision) => {
    try {
      setIsProcessing(true);
      const result = await depositChangeService.processApproval(changeRequest.id, {
        decision,
        notes: notes.trim() || undefined,
      });
      toast.success(result.message);
      onOpenChange(false);
      setNotes('');
      onSuccess();
    } catch (error) {
      toast.error(handleApiError(error));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detail Perubahan Deposito</DialogTitle>
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
            {/* Status Section */}
            <div className="flex items-center justify-between">
              <Badge variant={status?.variant} className="flex items-center gap-2">
                <StatusIcon className="h-4 w-4" />
                {status?.label}
              </Badge>
              {changeRequest.currentStep && (
                <Badge variant="outline">
                  Step: {changeStepMap[changeRequest.currentStep]}
                </Badge>
              )}
            </div>

            {/* Change Number */}
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Nomor Perubahan</p>
              <p className="text-lg font-bold font-mono">{changeRequest.changeNumber}</p>
              <p className="text-sm text-muted-foreground mt-1">
                Deposito: {changeRequest.depositApplication?.depositNumber}
              </p>
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
                  <p className="font-medium">{changeRequest.user?.name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">NIK</p>
                  <p className="font-medium">{changeRequest.user?.employee?.employeeNumber}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Department</p>
                  <p className="font-medium">
                    {changeRequest.user?.employee?.department?.departmentName || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Golongan</p>
                  <p className="font-medium">
                    {changeRequest.user?.employee?.golongan?.golonganName || '-'}
                  </p>
                </div>
              </div>
            </div>

            {/* Change Details */}
            <div className="rounded-lg border p-4 space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <ArrowRightLeft className="h-4 w-4" />
                Detail Perubahan
              </h3>
              <Separator />
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Jenis Perubahan</p>
                  <Badge variant="outline" className={changeType?.color}>
                    {changeType?.label}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground">Biaya Admin</p>
                  <p className="font-bold text-orange-600">
                    {formatCurrency(changeRequest.adminFee)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Tanggal Submit</p>
                  <p className="font-medium">
                    {changeRequest.submittedAt
                      ? format(new Date(changeRequest.submittedAt), 'dd MMMM yyyy', { locale: id })
                      : '-'}
                  </p>
                </div>
                {changeRequest.approvedAt && (
                  <div>
                    <p className="text-muted-foreground">Tanggal Disetujui</p>
                    <p className="font-medium">
                      {format(new Date(changeRequest.approvedAt), 'dd MMMM yyyy', { locale: id })}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Comparison: Before & After */}
            <div className="rounded-lg border p-4 space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <ArrowRightLeft className="h-4 w-4" />
                Perbandingan Nilai
              </h3>
              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Before */}
                <div className="rounded-lg bg-muted/50 p-4 space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground text-center">Sebelum</h4>
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-muted-foreground">Jumlah Setoran</p>
                      <p className="font-semibold">{formatCurrency(changeRequest.currentAmountValue)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Jangka Waktu</p>
                      <p className="font-semibold">{changeRequest.currentTenorMonths} Bulan</p>
                    </div>
                    {changeRequest.currentInterestRate && (
                      <div>
                        <p className="text-xs text-muted-foreground">Suku Bunga</p>
                        <p className="font-semibold">{changeRequest.currentInterestRate}%</p>
                      </div>
                    )}
                    {changeRequest.currentProjectedInterest && (
                      <div>
                        <p className="text-xs text-muted-foreground">Proyeksi Bunga</p>
                        <p className="font-semibold">{formatCurrency(changeRequest.currentProjectedInterest)}</p>
                      </div>
                    )}
                    {changeRequest.currentTotalReturn && (
                      <div>
                        <p className="text-xs text-muted-foreground">Total Pengembalian</p>
                        <p className="font-semibold">{formatCurrency(changeRequest.currentTotalReturn)}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* After */}
                <div className="rounded-lg bg-primary/5 border-primary/20 border p-4 space-y-3">
                  <h4 className="text-sm font-medium text-primary text-center">Sesudah</h4>
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-muted-foreground">Jumlah Setoran</p>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{formatCurrency(changeRequest.newAmountValue)}</p>
                        {changeRequest.newAmountValue !== changeRequest.currentAmountValue && (
                          <span className={`text-xs flex items-center ${changeRequest.newAmountValue > changeRequest.currentAmountValue
                              ? 'text-green-600'
                              : 'text-red-600'
                            }`}>
                            {changeRequest.newAmountValue > changeRequest.currentAmountValue
                              ? <TrendingUp className="h-3 w-3" />
                              : <TrendingDown className="h-3 w-3" />}
                          </span>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Jangka Waktu</p>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{changeRequest.newTenorMonths} Bulan</p>
                        {changeRequest.newTenorMonths !== changeRequest.currentTenorMonths && (
                          <span className={`text-xs flex items-center ${changeRequest.newTenorMonths > changeRequest.currentTenorMonths
                              ? 'text-green-600'
                              : 'text-red-600'
                            }`}>
                            {changeRequest.newTenorMonths > changeRequest.currentTenorMonths
                              ? <TrendingUp className="h-3 w-3" />
                              : <TrendingDown className="h-3 w-3" />}
                          </span>
                        )}
                      </div>
                    </div>
                    {changeRequest.newInterestRate && (
                      <div>
                        <p className="text-xs text-muted-foreground">Suku Bunga</p>
                        <p className="font-semibold">{changeRequest.newInterestRate}%</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Difference Summary */}
              <div className="mt-4 pt-3 border-t">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                  {changeRequest.newAmountValue !== changeRequest.currentAmountValue && (
                    <div>
                      <p className="text-muted-foreground">Selisih Setoran</p>
                      <p className={`font-semibold ${changeRequest.newAmountValue > changeRequest.currentAmountValue
                          ? 'text-green-600'
                          : 'text-red-600'
                        }`}>
                        {formatDifference(changeRequest.newAmountValue - changeRequest.currentAmountValue)}
                      </p>
                    </div>
                  )}
                  {changeRequest.newTenorMonths !== changeRequest.currentTenorMonths && (
                    <div>
                      <p className="text-muted-foreground">Selisih Tenor</p>
                      <p className={`font-semibold ${changeRequest.newTenorMonths > changeRequest.currentTenorMonths
                          ? 'text-green-600'
                          : 'text-red-600'
                        }`}>
                        {changeRequest.newTenorMonths > changeRequest.currentTenorMonths ? '+' : ''}
                        {changeRequest.newTenorMonths - changeRequest.currentTenorMonths} Bulan
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-muted-foreground">Biaya Admin</p>
                    <p className="font-semibold text-orange-600">
                      {formatCurrency(changeRequest.adminFee)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Rejection Reason */}
            {changeRequest.rejectionReason && (
              <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-4 space-y-2">
                <h3 className="font-semibold text-destructive flex items-center gap-2">
                  <XCircle className="h-4 w-4" />
                  Alasan Penolakan
                </h3>
                <p className="text-sm">{changeRequest.rejectionReason}</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="timeline" className="space-y-6 mt-6">
            {/* Approval Timeline */}
            <div className="space-y-4">
              {changeRequest.approvals?.map((approval, index) => {
                const isLast = index === (changeRequest.approvals?.length ?? 0) - 1;
                const isPending = !approval.decision;
                const isApproved = approval.decision === 'APPROVED';
                const isRejected = approval.decision === 'REJECTED';

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
                          <h4 className="font-semibold">{changeStepMap[approval.step]}</h4>
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

            {/* History Section */}
            {changeRequest.history && changeRequest.history.length > 0 && (
              <>
                <Separator />
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <History className="h-4 w-4" />
                    Riwayat Aktivitas
                  </h3>
                  {changeRequest.history.map((item, index) => {
                    const isLast = index === changeRequest.history!.length - 1;

                    return (
                      <div key={item.id} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div
                            className={`w-3 h-3 rounded-full ${item.action === 'APPROVED'
                              ? 'bg-green-500'
                              : item.action === 'REJECTED'
                                ? 'bg-red-500'
                                : 'bg-blue-500'
                              }`}
                          />
                          {!isLast && (
                            <div className="w-0.5 h-full bg-gray-200 dark:bg-gray-700 mt-1" />
                          )}
                        </div>
                        <div className="flex-1 pb-4">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-sm">{item.action}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(item.actionAt), 'dd MMM yyyy HH:mm', { locale: id })}
                            </p>
                          </div>
                          {item.actionByUser && (
                            <p className="text-xs text-muted-foreground">
                              oleh {item.actionByUser.name}
                            </p>
                          )}
                          {item.notes && (
                            <p className="text-sm mt-1 p-2 bg-muted rounded">{item.notes}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>

        {/* Action Buttons for Approvers */}
        {canApprove && (
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
                  onClick={() => handleProcess(DepositChangeApprovalDecision.REJECTED)}
                  disabled={isProcessing}
                  className="flex-1"
                >
                  {isProcessing ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <XCircle className="mr-2 h-4 w-4" />
                  )}
                  Tolak
                </Button>
                <Button
                  onClick={() => handleProcess(DepositChangeApprovalDecision.APPROVED)}
                  disabled={isProcessing}
                  className="flex-1"
                >
                  {isProcessing ? (
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
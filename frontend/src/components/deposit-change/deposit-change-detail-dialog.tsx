'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Building2,
  ArrowRight,
  AlertTriangle,
  History,
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

  if (!changeRequest) return null;

  const status = changeStatusMap[changeRequest. status];
  const StatusIcon = status?. icon || Clock;
  const changeType = changeTypeMap[changeRequest.changeType];
  const ChangeTypeIcon = changeType?.icon || Clock;

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
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Detail Perubahan Deposito
            <Badge variant={status?.variant} className="ml-2">
              <StatusIcon className="h-3 w-3 mr-1" />
              {status?.label}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            {changeRequest.changeNumber} • {changeRequest.depositApplication?. depositNumber}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-200px)]">
          <Tabs defaultValue="detail" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="detail">Detail</TabsTrigger>
              <TabsTrigger value="comparison">Perbandingan</TabsTrigger>
              <TabsTrigger value="history">Riwayat</TabsTrigger>
            </TabsList>

            <TabsContent value="detail" className="space-y-4 mt-4">
              {/* Applicant Info */}
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Informasi Pemohon
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-0">
                  <div>
                    <p className="text-xs text-muted-foreground">Nama</p>
                    <p className="font-medium">{changeRequest.user?. name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">NIK</p>
                    <p className="font-medium">{changeRequest.user?.employee?.employeeNumber}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Department</p>
                    <p className="font-medium">{changeRequest.user?.employee?.department?. departmentName || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Golongan</p>
                    <p className="font-medium">{changeRequest.user?.employee?.golongan?.golonganName || '-'}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Change Info */}
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <ChangeTypeIcon className={`h-4 w-4 ${changeType?.color}`} />
                    Informasi Perubahan
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-0">
                  <div>
                    <p className="text-xs text-muted-foreground">Nomor Perubahan</p>
                    <p className="font-mono font-medium">{changeRequest.changeNumber}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Jenis Perubahan</p>
                    <Badge variant="outline" className={changeType?.color}>
                      {changeType?.label}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Biaya Admin</p>
                    <p className="font-semibold text-orange-600">
                      {formatCurrency(changeRequest.adminFee)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Step Saat Ini</p>
                    <p className="font-medium">
                      {changeRequest.currentStep ?  changeStepMap[changeRequest. currentStep] : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Tanggal Submit</p>
                    <p className="font-medium">
                      {changeRequest.submittedAt
                        ? format(new Date(changeRequest.submittedAt), 'dd MMM yyyy HH:mm', { locale: id })
                        : '-'}
                    </p>
                  </div>
                  {changeRequest.approvedAt && (
                    <div>
                      <p className="text-xs text-muted-foreground">Tanggal Disetujui</p>
                      <p className="font-medium">
                        {format(new Date(changeRequest.approvedAt), 'dd MMM yyyy HH:mm', { locale: id })}
                      </p>
                    </div>
                  )}
                  {changeRequest.rejectedAt && (
                    <div>
                      <p className="text-xs text-muted-foreground">Tanggal Ditolak</p>
                      <p className="font-medium text-red-600">
                        {format(new Date(changeRequest.rejectedAt), 'dd MMM yyyy HH:mm', { locale: id })}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Rejection Reason */}
              {changeRequest.rejectionReason && (
                <Card className="border-red-200 dark:border-red-800">
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm flex items-center gap-2 text-red-600">
                      <XCircle className="h-4 w-4" />
                      Alasan Penolakan
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm">{changeRequest.rejectionReason}</p>
                  </CardContent>
                </Card>
              )}

              {/* Approval Status */}
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    Status Approval
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {changeRequest.approvals?. map((approval, index) => (
                      <div key={approval.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            approval.decision === 'APPROVED'
                              ? 'bg-green-100 text-green-600 dark:bg-green-900'
                              : approval.decision === 'REJECTED'
                              ?  'bg-red-100 text-red-600 dark:bg-red-900'
                              : 'bg-gray-100 text-gray-400 dark:bg-gray-800'
                          }`}>
                            {approval.decision === 'APPROVED' ? (
                              <CheckCircle2 className="h-4 w-4" />
                            ) : approval.decision === 'REJECTED' ? (
                              <XCircle className="h-4 w-4" />
                            ) : (
                              <Clock className="h-4 w-4" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{changeStepMap[approval.step]}</p>
                            {approval.approver && (
                              <p className="text-xs text-muted-foreground">
                                {approval.approver.name}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          {approval.decision ?  (
                            <Badge variant={approval.decision === 'APPROVED' ? 'default' : 'destructive'}>
                              {approval.decision === 'APPROVED' ? 'Disetujui' : 'Ditolak'}
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Menunggu</Badge>
                          )}
                          {approval.decidedAt && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {format(new Date(approval.decidedAt), 'dd MMM yyyy', { locale: id })}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="comparison" className="space-y-4 mt-4">
              {/* Comparison Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Before */}
                <Card>
                  <CardHeader className="py-3 bg-muted/50">
                    <CardTitle className="text-sm">Sebelum</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 pt-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Jumlah Deposito</p>
                      <p className="text-lg font-bold">{formatCurrency(changeRequest.currentAmountValue)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Tenor</p>
                      <p className="font-semibold">{changeRequest.currentTenorMonths} Bulan</p>
                    </div>
                    <Separator />
                    <div>
                      <p className="text-xs text-muted-foreground">Proyeksi Bunga</p>
                      <p className="font-semibold text-green-600">
                        {changeRequest.currentProjectedInterest 
                          ? formatCurrency(changeRequest.currentProjectedInterest) 
                          : '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Total Return</p>
                      <p className="font-bold">
                        {changeRequest.currentTotalReturn 
                          ? formatCurrency(changeRequest.currentTotalReturn) 
                          : '-'}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Arrow */}
                <div className="hidden md:flex items-center justify-center">
                  <ArrowRight className="h-8 w-8 text-muted-foreground" />
                </div>

                {/* After */}
                <Card className="border-primary">
                  <CardHeader className="py-3 bg-primary/10">
                    <CardTitle className="text-sm text-primary">Sesudah</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 pt-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Jumlah Deposito</p>
                      <p className="text-lg font-bold text-primary">
                        {formatCurrency(changeRequest.newAmountValue)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Tenor</p>
                      <p className="font-semibold">{changeRequest.newTenorMonths} Bulan</p>
                    </div>
                    <Separator />
                    <div>
                      <p className="text-xs text-muted-foreground">Proyeksi Bunga</p>
                      <p className="font-semibold text-green-600">
                        {changeRequest.newProjectedInterest 
                          ? formatCurrency(changeRequest.newProjectedInterest) 
                          : '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Total Return</p>
                      <p className="font-bold text-primary">
                        {changeRequest.newTotalReturn 
                          ? formatCurrency(changeRequest.newTotalReturn) 
                          : '-'}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Difference Summary */}
              {changeRequest.comparison && (
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm">Ringkasan Selisih</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-0">
                    <div>
                      <p className="text-xs text-muted-foreground">Selisih Jumlah</p>
                      <p className={`text-lg font-bold ${
                        changeRequest.comparison.difference. amount >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatDifference(changeRequest.comparison. difference.amount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Selisih Tenor</p>
                      <p className={`text-lg font-bold ${
                        changeRequest.comparison. difference.tenor >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {changeRequest.comparison.difference.tenor > 0 ? '+' : ''}
                        {changeRequest. comparison.difference.tenor} Bulan
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Selisih Bunga</p>
                      <p className={`text-lg font-bold ${
                        changeRequest.comparison.difference.projectedInterest >= 0 ?  'text-green-600' : 'text-red-600'
                      }`}>
                        {formatDifference(changeRequest.comparison.difference.projectedInterest)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Selisih Total</p>
                      <p className={`text-lg font-bold ${
                        changeRequest.comparison.difference.totalReturn >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatDifference(changeRequest.comparison.difference.totalReturn)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Admin Fee */}
              <Card className="border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950">
                <CardContent className="flex items-center justify-between py-4">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                    <span className="font-medium text-orange-800 dark:text-orange-200">Biaya Admin</span>
                  </div>
                  <span className="text-2xl font-bold text-orange-600">
                    {formatCurrency(changeRequest.adminFee)}
                  </span>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history" className="space-y-4 mt-4">
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <History className="h-4 w-4" />
                    Riwayat Perubahan
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  {changeRequest.history && changeRequest.history.length > 0 ? (
                    <div className="space-y-4">
                      {changeRequest. history.map((item, index) => (
                        <div key={item.id} className="flex gap-4">
                          <div className="flex flex-col items-center">
                            <div className={`w-3 h-3 rounded-full ${
                              item.action === 'APPROVED' ? 'bg-green-500' :
                              item.action === 'REJECTED' ? 'bg-red-500' :
                              'bg-blue-500'
                            }`} />
                            {index < changeRequest.history! .length - 1 && (
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
                                oleh {item.actionByUser. name}
                              </p>
                            )}
                            {item.notes && (
                              <p className="text-sm mt-1 text-muted-foreground">{item.notes}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Belum ada riwayat
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </ScrollArea>

        {/* Approval Actions */}
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
                  placeholder="Tambahkan catatan untuk perubahan ini..."
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
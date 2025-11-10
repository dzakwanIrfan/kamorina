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
  DollarSign,
  FileText,
  Download,
  History,
  CreditCard,
  Edit,
} from 'lucide-react';
import { toast } from 'sonner';

import {
  LoanApplication,
  LoanStatus,
  LoanApprovalStep,
  LoanApprovalDecision,
  ApproveLoanDto,
} from '@/types/loan.types';
import { loanService } from '@/services/loan.service';
import { handleApiError } from '@/lib/axios';
import { ReviseLoanDialog } from '@/components/loan/revise-loan-dialog'; 
import { usePermissions } from '@/hooks/use-permission'; 

interface LoanDetailDialogProps {
  loan: LoanApplication | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  canApprove?: boolean;
  canRevise?: boolean;
}

const statusMap = {
  [LoanStatus.DRAFT]: { label: 'Draft', variant: 'secondary' as const, icon: Clock },
  [LoanStatus.SUBMITTED]: { label: 'Submitted', variant: 'default' as const, icon: Clock },
  [LoanStatus.UNDER_REVIEW_DSP]: { label: 'Review DSP', variant: 'default' as const, icon: Clock },
  [LoanStatus.UNDER_REVIEW_KETUA]: { label: 'Review Ketua', variant: 'default' as const, icon: Clock },
  [LoanStatus.UNDER_REVIEW_PENGAWAS]: { label: 'Review Pengawas', variant: 'default' as const, icon: Clock },
  [LoanStatus.APPROVED_PENDING_DISBURSEMENT]: { label: 'Menunggu Pencairan', variant: 'default' as const, icon: Clock },
  [LoanStatus.DISBURSEMENT_IN_PROGRESS]: { label: 'Proses Pencairan', variant: 'default' as const, icon: Clock },
  [LoanStatus.PENDING_AUTHORIZATION]: { label: 'Menunggu Otorisasi', variant: 'default' as const, icon: Clock },
  [LoanStatus.DISBURSED]: { label: 'Telah Dicairkan', variant: 'default' as const, icon: CheckCircle2 },
  [LoanStatus.REJECTED]: { label: 'Ditolak', variant: 'destructive' as const, icon: XCircle },
  [LoanStatus.CANCELLED]: { label: 'Dibatalkan', variant: 'destructive' as const, icon: XCircle },
};

const stepMap = {
  [LoanApprovalStep.DIVISI_SIMPAN_PINJAM]: 'Divisi Simpan Pinjam',
  [LoanApprovalStep.KETUA]: 'Ketua',
  [LoanApprovalStep.PENGAWAS]: 'Pengawas',
};

export function LoanDetailDialog({
  loan,
  open,
  onOpenChange,
  onSuccess,
  canApprove = false,
  canRevise = false,
}: LoanDetailDialogProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [notes, setNotes] = useState('');
  const [activeTab, setActiveTab] = useState('details');
  const [reviseDialogOpen, setReviseDialogOpen] = useState(false); 
  const { hasRole } = usePermissions(); 

  if (!loan) return null;

  const status = statusMap[loan.status];
  const StatusIcon = status.icon;

  const isDSP = hasRole('divisi_simpan_pinjam');
  const canDSPRevise = isDSP && 
    loan.currentStep === LoanApprovalStep.DIVISI_SIMPAN_PINJAM &&
    (loan.status === LoanStatus.SUBMITTED || loan.status === LoanStatus.UNDER_REVIEW_DSP);

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleProcess = async (decision: LoanApprovalDecision) => {
    if (!loan) return;

    try {
      setIsProcessing(true);
      const dto: ApproveLoanDto = {
        decision,
        notes: notes.trim() || undefined,
      };

      await loanService.processApproval(loan.id, dto);

      toast.success(
        decision === LoanApprovalDecision.APPROVED
          ? 'Pinjaman berhasil disetujui'
          : 'Pinjaman berhasil ditolak'
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

  const downloadAttachment = (url: string) => {
    window.open(url, '_blank');
  };

  const handleOpenReviseDialog = () => {
    setReviseDialogOpen(true);
  };

  const handleReviseSuccess = () => {
    setReviseDialogOpen(false);
    onSuccess?.();
  };

  return (
    <>  
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detail Pengajuan Pinjaman</DialogTitle>
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
                <DollarSign className="h-4 w-4 mr-2" />
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
                {loan.currentStep && (
                  <Badge variant="outline">
                    Step: {stepMap[loan.currentStep]}
                  </Badge>
                )}
              </div>

              {/* ADD THIS - Revise Button for DSP */}
              {canDSPRevise && (
                <div className="rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950/30 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-1">
                        Opsi Revisi Tersedia
                      </h4>
                      <p className="text-sm text-blue-800 dark:text-blue-400">
                        Sebagai Divisi Simpan Pinjam, Anda dapat merevisi jumlah pinjaman atau tenor sebelum menyetujui.
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleOpenReviseDialog}
                      className="shrink-0"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Revisi Pinjaman
                    </Button>
                  </div>
                </div>
              )}

              {/* Loan Number */}
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Nomor Pinjaman</p>
                <p className="text-lg font-bold font-mono">{loan.loanNumber}</p>
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
                    <p className="font-medium">{loan.user?.name}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Email</p>
                    <p className="font-medium">{loan.user?.email}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">No. Karyawan</p>
                    <p className="font-medium">{loan.user?.employee.employeeNumber}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Department</p>
                    <p className="font-medium">
                      {loan.user?.employee.department?.departmentName || '-'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Loan Details */}
              <div className="rounded-lg border p-4 space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Detail Pinjaman
                </h3>
                <Separator />
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Jumlah Pinjaman</p>
                    <p className="text-lg font-bold text-primary">
                      {formatCurrency(loan.loanAmount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Tenor</p>
                    <p className="font-medium">{loan.loanTenor} Bulan</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Suku Bunga</p>
                    <p className="font-medium">{loan.interestRate}% per tahun</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Cicilan per Bulan</p>
                    <p className="text-lg font-bold text-orange-600">
                      {loan.monthlyInstallment
                        ? formatCurrency(loan.monthlyInstallment)
                        : '-'}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-muted-foreground">Total Pembayaran</p>
                    <p className="font-bold">
                      {loan.totalRepayment ? formatCurrency(loan.totalRepayment) : '-'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Bank Account */}
              <div className="rounded-lg border p-4 space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Informasi Rekening
                </h3>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Nomor Rekening BCA</p>
                  <p className="text-lg font-mono font-medium">{loan.bankAccountNumber}</p>
                </div>
              </div>

              {/* Loan Purpose */}
              <div className="rounded-lg border p-4 space-y-3">
                <h3 className="font-semibold">Alasan Peminjaman</h3>
                <Separator />
                <p className="text-sm whitespace-pre-wrap">{loan.loanPurpose}</p>
              </div>

              {/* Attachments */}
              {loan.attachments && loan.attachments.length > 0 && (
                <div className="rounded-lg border p-4 space-y-3">
                  <h3 className="font-semibold">Lampiran Dokumen</h3>
                  <Separator />
                  <div className="space-y-2">
                    {loan.attachments.map((attachment, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => downloadAttachment(attachment)}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        <span className="truncate">{attachment.split('/').pop()}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Revision Info */}
              {loan.revisionCount > 0 && (
                <div className="rounded-lg border border-orange-200 bg-orange-50 dark:bg-orange-950/30 p-4 space-y-2">
                  <p className="font-semibold text-orange-900 dark:text-orange-300">
                    Pinjaman ini telah direvisi {loan.revisionCount}x
                  </p>
                  {loan.revisionNotes && (
                    <>
                      <Separator />
                      <p className="text-sm text-orange-800 dark:text-orange-400">
                        Catatan Revisi Terakhir:
                      </p>
                      <p className="text-sm">{loan.revisionNotes}</p>
                    </>
                  )}
                </div>
              )}

              {/* Rejection Reason */}
              {loan.status === LoanStatus.REJECTED && loan.rejectionReason && (
                <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-4 space-y-2">
                  <h3 className="font-semibold text-destructive">Alasan Penolakan</h3>
                  <p className="text-sm">{loan.rejectionReason}</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="timeline" className="space-y-6 mt-6">
              {/* Approval Timeline */}
              <div className="space-y-4">
                {loan.approvals.map((approval, index) => {
                  const isLast = index === loan.approvals.length - 1;
                  const isPending = !approval.decision;
                  const isApproved = approval.decision === LoanApprovalDecision.APPROVED;
                  const isRejected = approval.decision === LoanApprovalDecision.REJECTED;
                  const isRevised = approval.decision === LoanApprovalDecision.REVISED;

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
                                : isRevised
                                ? 'border-orange-500 bg-orange-50 text-orange-600 dark:bg-orange-950'
                                : 'border-gray-300 bg-gray-50 text-gray-400 dark:bg-gray-900'
                            }`}
                          >
                            {isApproved ? (
                              <CheckCircle2 className="h-5 w-5" />
                            ) : isRejected ? (
                              <XCircle className="h-5 w-5" />
                            ) : isRevised ? (
                              <FileText className="h-5 w-5" />
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
                            {isRevised && (
                              <Badge variant="outline" className="gap-1 border-orange-500 text-orange-600">
                                <FileText className="h-3 w-3" />
                                Direvisi
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

              {/* Disbursement Info */}
              {loan.disbursement && (
                <div className="rounded-lg border border-green-200 bg-green-50 dark:bg-green-950/30 p-4 space-y-3">
                  <h3 className="font-semibold text-green-900 dark:text-green-300 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    Informasi Pencairan
                  </h3>
                  <Separator />
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Tanggal Transaksi BCA</p>
                      <p className="font-medium">
                        {format(new Date(loan.disbursement.disbursementDate), 'dd MMMM yyyy', {
                          locale: id,
                        })}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Jam Transaksi</p>
                      <p className="font-medium">{loan.disbursement.disbursementTime}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-muted-foreground">Diproses oleh</p>
                      <p className="font-medium">{loan.disbursement.processedByUser.name}</p>
                    </div>
                    {loan.disbursement.notes && (
                      <div className="col-span-2">
                        <p className="text-muted-foreground">Catatan</p>
                        <p className="text-sm">{loan.disbursement.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Authorization Info */}
              {loan.authorization && (
                <div className="rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950/30 p-4 space-y-3">
                  <h3 className="font-semibold text-blue-900 dark:text-blue-300 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    Informasi Otorisasi
                  </h3>
                  <Separator />
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Tanggal Otorisasi</p>
                      <p className="font-medium">
                        {format(new Date(loan.authorization.authorizationDate), 'dd MMMM yyyy', {
                          locale: id,
                        })}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Jam Otorisasi</p>
                      <p className="font-medium">{loan.authorization.authorizationTime}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-muted-foreground">Diotorisasi oleh</p>
                      <p className="font-medium">{loan.authorization.authorizedByUser.name}</p>
                    </div>
                    {loan.authorization.notes && (
                      <div className="col-span-2">
                        <p className="text-muted-foreground">Catatan</p>
                        <p className="text-sm">{loan.authorization.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="calculation" className="space-y-4 mt-6">
              <div className="rounded-lg border p-6 space-y-6">
                <div>
                  <h3 className="font-semibold text-lg mb-4">Rincian Perhitungan Pinjaman</h3>
                  <Separator />
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2">
                    <span className="text-muted-foreground">Jumlah Pinjaman</span>
                    <span className="text-lg font-bold">{formatCurrency(loan.loanAmount)}</span>
                  </div>

                  <div className="flex justify-between items-center py-2">
                    <span className="text-muted-foreground">Tenor</span>
                    <span className="font-medium">{loan.loanTenor} Bulan</span>
                  </div>

                  <div className="flex justify-between items-center py-2">
                    <span className="text-muted-foreground">Suku Bunga</span>
                    <span className="font-medium">{loan.interestRate}% per tahun</span>
                  </div>

                  <Separator />

                  <div className="flex justify-between items-center py-2">
                    <span className="text-muted-foreground">Total Bunga</span>
                    <span className="font-medium text-orange-600">
                      {loan.totalRepayment
                        ? formatCurrency(loan.totalRepayment - loan.loanAmount)
                        : '-'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-2 bg-muted rounded-lg px-4">
                    <span className="font-semibold">Total Pembayaran</span>
                    <span className="text-lg font-bold">
                      {loan.totalRepayment ? formatCurrency(loan.totalRepayment) : '-'}
                    </span>
                  </div>

                  <Separator />

                  <div className="flex justify-between items-center py-2 bg-primary/5 rounded-lg px-4">
                    <span className="font-semibold text-primary">Cicilan per Bulan</span>
                    <span className="text-2xl font-bold text-primary">
                      {loan.monthlyInstallment
                        ? formatCurrency(loan.monthlyInstallment)
                        : '-'}
                    </span>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    <strong>Catatan:</strong> Perhitungan menggunakan metode bunga flat rate.
                    Cicilan akan dipotong langsung dari gaji setiap bulan.
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Action Buttons for Approvers */}
          {canApprove &&
            [LoanStatus.SUBMITTED, LoanStatus.UNDER_REVIEW_DSP, LoanStatus.UNDER_REVIEW_KETUA, LoanStatus.UNDER_REVIEW_PENGAWAS].includes(loan.status) &&
            loan.currentStep && (
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
                      onClick={() => handleProcess(LoanApprovalDecision.REJECTED)}
                      disabled={isProcessing}
                      className="flex-1"
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Tolak
                    </Button>
                    <Button
                      onClick={() => handleProcess(LoanApprovalDecision.APPROVED)}
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
      {/* ADD THIS - Revise Loan Dialog */}
      <ReviseLoanDialog
        loan={loan}
        open={reviseDialogOpen}
        onOpenChange={setReviseDialogOpen}
        onSuccess={handleReviseSuccess}
      />
    </>
  );
}
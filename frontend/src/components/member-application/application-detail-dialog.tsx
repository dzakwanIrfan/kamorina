'use client';

import { useState } from 'react';
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
import {
  MemberApplication,
  ApplicationStatus,
  ApprovalStep,
  ApprovalDecision,
} from '@/types/member-application.types';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { CheckCircle2, XCircle, Clock, User, Building2, Calendar, Award } from 'lucide-react';
import { memberApplicationService } from '@/services/member-application.service';
import { toast } from 'sonner';

interface ApplicationDetailDialogProps {
  application: MemberApplication | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  canApprove?: boolean;
}

const statusMap = {
  [ApplicationStatus.UNDER_REVIEW]: { label: 'Under Review', variant: 'default' as const, icon: Clock },
  [ApplicationStatus.APPROVED]: { label: 'Approved', variant: 'default' as const, icon: CheckCircle2 },
  [ApplicationStatus.REJECTED]: { label: 'Rejected', variant: 'destructive' as const, icon: XCircle },
};

const stepMap = {
  [ApprovalStep.DIVISI_SIMPAN_PINJAM]: 'Divisi Simpan Pinjam',
  [ApprovalStep.KETUA]: 'Ketua',
};

export function ApplicationDetailDialog({
  application,
  open,
  onOpenChange,
  onSuccess,
  canApprove = false,
}: ApplicationDetailDialogProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [notes, setNotes] = useState('');

  if (!application) return null;

  const status = statusMap[application.status];
  const StatusIcon = status.icon;

  const handleProcess = async (decision: ApprovalDecision) => {
    if (!application) return;

    try {
      setIsProcessing(true);
      await memberApplicationService.processApproval(application.id, {
        decision,
        notes: notes.trim() || undefined,
      });

      toast.success(
        decision === ApprovalDecision.APPROVED
          ? 'Pengajuan berhasil disetujui'
          : 'Pengajuan berhasil ditolak'
      );

      onSuccess?.();
      onOpenChange(false);
      setNotes('');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal memproses pengajuan');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detail Pengajuan Anggota</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status */}
          <div className="flex items-center justify-between">
            <Badge variant={status.variant} className="flex items-center gap-2">
              <StatusIcon className="h-4 w-4" />
              {status.label}
            </Badge>
            {application.currentStep && (
              <Badge variant="outline">
                Approval Step: {stepMap[application.currentStep]}
              </Badge>
            )}
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
                <p className="font-medium">{application.user?.name}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Email</p>
                <p className="font-medium">{application.user?.email}</p>
              </div>
              <div>
                <p className="text-muted-foreground">No. Karyawan</p>
                <p className="font-medium">{application.user?.employee.employeeNumber}</p>
              </div>
              <div>
                <p className="text-muted-foreground">NIK</p>
                <p className="font-medium">{application.user?.nik || '-'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">NPWP</p>
                <p className="font-medium">{application.user?.npwp || '-'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Tempat, Tanggal Lahir</p>
                <p className="font-medium">
                  {application.user?.birthPlace}
                  {application.user?.dateOfBirth &&
                    `, ${format(new Date(application.user.dateOfBirth), 'dd MMMM yyyy', { locale: id })}`}
                </p>
              </div>
            </div>
          </div>

          {/* Department & Employment Info */}
          <div className="rounded-lg border p-4 space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Informasi Pekerjaan
            </h3>
            <Separator />
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Department</p>
                <p className="font-medium">
                  {application.user?.employee?.department?.departmentName || '-'}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground flex items-center gap-1">
                  <Award className="h-3 w-3" />
                  Golongan
                </p>
                <p className="font-medium">
                  {application.user?.employee?.golongan?.golonganName || '-'}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Tanggal Pegawai Tetap</p>
                <p className="font-medium">
                  {application.user?.permanentEmployeeDate
                    ? format(new Date(application.user.permanentEmployeeDate), 'dd MMMM yyyy', { locale: id })
                    : '-'}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Rencana Cicilan</p>
                <p className="font-medium">{application.user?.installmentPlan || '-'}x per bulan</p>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="rounded-lg border p-4 space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Timeline Approval
            </h3>
            <Separator />
            <div className="space-y-4">
              {application.approvals.map((approval, index) => (
                <div key={approval.id} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div
                      className={`rounded-full p-2 ${
                        approval.decision === ApprovalDecision.APPROVED
                          ? 'bg-green-100 text-green-600'
                          : approval.decision === ApprovalDecision.REJECTED
                          ? 'bg-red-100 text-red-600'
                          : 'bg-gray-100 text-gray-400'
                      }`}
                    >
                      {approval.decision === ApprovalDecision.APPROVED ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : approval.decision === ApprovalDecision.REJECTED ? (
                        <XCircle className="h-4 w-4" />
                      ) : (
                        <Clock className="h-4 w-4" />
                      )}
                    </div>
                    {index < application.approvals.length - 1 && (
                      <div className="w-0.5 h-12 bg-gray-200" />
                    )}
                  </div>
                  <div className="flex-1 pb-4">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{stepMap[approval.step]}</p>
                      {approval.decision && (
                        <Badge
                          variant={
                            approval.decision === ApprovalDecision.APPROVED
                              ? 'default'
                              : 'destructive'
                          }
                        >
                          {approval.decision === ApprovalDecision.APPROVED
                            ? 'Approved'
                            : 'Rejected'}
                        </Badge>
                      )}
                    </div>
                    {approval.approver && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Oleh: {approval.approver.name}
                      </p>
                    )}
                    {approval.decidedAt && (
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(approval.decidedAt), 'dd MMM yyyy HH:mm', {
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
              ))}
            </div>
          </div>

          {/* Rejection Reason */}
          {application.status === ApplicationStatus.REJECTED && application.rejectionReason && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-4 space-y-2">
              <h3 className="font-semibold text-destructive">Alasan Penolakan</h3>
              <p className="text-sm">{application.rejectionReason}</p>
            </div>
          )}

          {/* Action Buttons for Approvers */}
          {canApprove &&
            application.status === ApplicationStatus.UNDER_REVIEW &&
            application.currentStep && (
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
                      onClick={() => handleProcess(ApprovalDecision.REJECTED)}
                      disabled={isProcessing}
                      className="flex-1"
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Tolak
                    </Button>
                    <Button
                      onClick={() => handleProcess(ApprovalDecision.APPROVED)}
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
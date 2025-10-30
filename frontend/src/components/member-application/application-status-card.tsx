'use client';

import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import {
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  User,
  Building2,
  Calendar,
  CreditCard,
  FileText,
  ArrowRight,
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import {
  MemberApplication,
  ApplicationStatus,
  ApprovalStep,
  ApprovalDecision,
} from '@/types/member-application.types';

interface ApplicationStatusCardProps {
  application: MemberApplication;
}

export function ApplicationStatusCard({ application }: ApplicationStatusCardProps) {
  const getStatusBadge = (status: ApplicationStatus) => {
    const config = {
      [ApplicationStatus.UNDER_REVIEW]: {
        variant: 'secondary' as const,
        label: 'Sedang Ditinjau',
        icon: Clock,
      },
      [ApplicationStatus.APPROVED]: {
        variant: 'default' as const,
        label: 'Disetujui',
        icon: CheckCircle2,
      },
      [ApplicationStatus.REJECTED]: {
        variant: 'destructive' as const,
        label: 'Ditolak',
        icon: XCircle,
      },
    };

    const { variant, label, icon: Icon } = config[status];

    return (
      <Badge variant={variant} className="text-sm gap-1">
        <Icon className="h-3 w-3" />
        {label}
      </Badge>
    );
  };

  const getStepLabel = (step: ApprovalStep) => {
    return step === ApprovalStep.DIVISI_SIMPAN_PINJAM
      ? 'Divisi Simpan Pinjam'
      : 'Ketua Koperasi';
  };

  const getApprovalProgress = () => {
    if (application.status === ApplicationStatus.APPROVED) return 100;
    if (application.status === ApplicationStatus.REJECTED) return 0;

    const approvedCount = application.approvals.filter(
      (a) => a.decision === ApprovalDecision.APPROVED
    ).length;
    const totalSteps = application.approvals.length;

    return (approvedCount / totalSteps) * 100;
  };

  const getCurrentStepMessage = () => {
    if (application.status === ApplicationStatus.APPROVED) {
      return {
        title: 'Selamat! Pendaftaran Anda Disetujui',
        description:
          'Anda sekarang adalah anggota resmi Koperasi Surya Niaga Kamorina. Anda dapat mengakses semua fitur sistem.',
        variant: 'default' as const,
      };
    }

    if (application.status === ApplicationStatus.REJECTED) {
      return {
        title: 'Pendaftaran Ditolak',
        description: application.rejectionReason || 'Tidak ada keterangan',
        variant: 'destructive' as const,
      };
    }

    const currentStepLabel = application.currentStep
      ? getStepLabel(application.currentStep)
      : 'Tidak diketahui';

    return {
      title: 'Pendaftaran Sedang Diproses',
      description: `Pendaftaran Anda sedang menunggu persetujuan dari ${currentStepLabel}.`,
      variant: 'default' as const,
    };
  };

  const currentMessage = getCurrentStepMessage();

  return (
    <div className="space-y-6">
      {/* Status Alert */}
      <Alert variant={currentMessage.variant}>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>{currentMessage.title}</AlertTitle>
        <AlertDescription>{currentMessage.description}</AlertDescription>
      </Alert>

      {/* Progress */}
      {application.status === ApplicationStatus.UNDER_REVIEW && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Progress Persetujuan</CardTitle>
            <CardDescription>
              {application.approvals.filter((a) => a.decision === ApprovalDecision.APPROVED)
                .length}{' '}
              dari {application.approvals.length} tahap selesai
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={getApprovalProgress()} className="h-2" />
          </CardContent>
        </Card>
      )}

      {/* Application Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Informasi Pendaftaran</CardTitle>
          <CardDescription>Data yang Anda submit untuk pendaftaran anggota</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Status Pendaftaran</span>
            {getStatusBadge(application.status)}
          </div>

          <Separator />

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                <span>Nama Lengkap</span>
              </div>
              <p className="font-medium">{application.user?.name}</p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CreditCard className="h-4 w-4" />
                <span>NIK</span>
              </div>
              <p className="font-medium">{application.user?.nik || '-'}</p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileText className="h-4 w-4" />
                <span>NPWP</span>
              </div>
              <p className="font-medium">{application.user?.npwp || '-'}</p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Building2 className="h-4 w-4" />
                <span>Department</span>
              </div>
              <p className="font-medium">
                {application.user?.department?.departmentName || '-'}
              </p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Tanggal Lahir</span>
              </div>
              <p className="font-medium">
                {application.user?.dateOfBirth
                  ? format(new Date(application.user.dateOfBirth), 'dd MMMM yyyy', {
                      locale: localeId,
                    })
                  : '-'}
              </p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Pegawai Tetap Sejak</span>
              </div>
              <p className="font-medium">
                {application.user?.permanentEmployeeDate
                  ? format(new Date(application.user.permanentEmployeeDate), 'dd MMMM yyyy', {
                      locale: localeId,
                    })
                  : '-'}
              </p>
            </div>
          </div>

          <Separator />

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Tanggal Submit</span>
            </div>
            <p className="font-medium">
              {application.submittedAt
                ? format(new Date(application.submittedAt), 'dd MMMM yyyy HH:mm', {
                    locale: localeId,
                  })
                : '-'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Approval Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Timeline Persetujuan</CardTitle>
          <CardDescription>Riwayat proses persetujuan pendaftaran Anda</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {application.approvals.map((approval, index) => {
              const isLast = index === application.approvals.length - 1;
              const isPending = !approval.decision;
              const isApproved = approval.decision === ApprovalDecision.APPROVED;
              const isRejected = approval.decision === ApprovalDecision.REJECTED;

              return (
                <div key={approval.id} className="relative">
                  <div className="flex items-start gap-4">
                    <div className="flex flex-col items-center">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${
                          isApproved
                            ? 'border-green-500 bg-green-50 text-green-600'
                            : isRejected
                            ? 'border-red-500 bg-red-50 text-red-600'
                            : 'border-gray-300 bg-gray-50 text-gray-400'
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
                        <h4 className="font-semibold">{getStepLabel(approval.step)}</h4>
                        {isPending && (
                          <Badge variant="outline" className="gap-1">
                            <Clock className="h-3 w-3" />
                            Menunggu
                          </Badge>
                        )}
                        {isApproved && (
                          <Badge variant="default" className="gap-1">
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
                            locale: localeId,
                          })}
                        </p>
                      )}

                      {approval.notes && (
                        <p className="text-sm italic text-muted-foreground">
                          Catatan: {approval.notes}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
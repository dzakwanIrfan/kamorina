"use client";

import { useState } from "react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CheckCircle2,
  XCircle,
  Clock,
  User,
  FileText,
  Download,
  History,
  CreditCard,
  Edit,
} from "lucide-react";
import { FaRupiahSign } from "react-icons/fa6";
import { toast } from "sonner";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  LoanApplication,
  LoanStatus,
  LoanApprovalStep,
  LoanApprovalDecision,
  ApproveLoanDto,
} from "@/types/loan.types";
import { loanService } from "@/services/loan.service";
import { handleApiError } from "@/lib/axios";
import { ReviseLoanDialog } from "@/components/loan/revise-loan-dialog";
import { usePermissions } from "@/hooks/use-permission";
import { LoanTypeDetails } from "./loan-type-details";
import {
  CalculationBreakdown,
  LoanRevisionsDisplay,
} from "./loan-detail-sections";

interface LoanDetailDialogProps {
  loan: LoanApplication | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  canApprove?: boolean;
  canRevise?: boolean;
}

const statusMap = {
  [LoanStatus.DRAFT]: {
    label: "Draft",
    variant: "secondary" as const,
    icon: Clock,
  },
  [LoanStatus.SUBMITTED]: {
    label: "Submitted",
    variant: "default" as const,
    icon: Clock,
  },
  [LoanStatus.UNDER_REVIEW_DSP]: {
    label: "Review DSP",
    variant: "default" as const,
    icon: Clock,
  },
  [LoanStatus.UNDER_REVIEW_KETUA]: {
    label: "Review Ketua",
    variant: "default" as const,
    icon: Clock,
  },
  [LoanStatus.UNDER_REVIEW_PENGAWAS]: {
    label: "Review Pengawas",
    variant: "default" as const,
    icon: Clock,
  },
  [LoanStatus.APPROVED_PENDING_DISBURSEMENT]: {
    label: "Menunggu Pencairan",
    variant: "default" as const,
    icon: Clock,
  },
  [LoanStatus.DISBURSEMENT_IN_PROGRESS]: {
    label: "Proses Pencairan",
    variant: "default" as const,
    icon: Clock,
  },
  [LoanStatus.PENDING_AUTHORIZATION]: {
    label: "Menunggu Otorisasi",
    variant: "default" as const,
    icon: Clock,
  },
  [LoanStatus.DISBURSED]: {
    label: "Telah Dicairkan",
    variant: "default" as const,
    icon: CheckCircle2,
  },
  [LoanStatus.REJECTED]: {
    label: "Ditolak",
    variant: "destructive" as const,
    icon: XCircle,
  },
  [LoanStatus.COMPLETED]: {
    label: "Selesai",
    variant: "default" as const,
    icon: CheckCircle2,
  },
  [LoanStatus.CANCELLED]: {
    label: "Dibatalkan",
    variant: "destructive" as const,
    icon: XCircle,
  },
};

const stepMap = {
  [LoanApprovalStep.DIVISI_SIMPAN_PINJAM]: "Divisi Simpan Pinjam",
  [LoanApprovalStep.KETUA]: "Ketua",
  [LoanApprovalStep.PENGAWAS]: "Pengawas",
};

export function LoanDetailDialog({
  loan,
  open,
  onOpenChange,
  onSuccess,
  canApprove = false,
}: LoanDetailDialogProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [notes, setNotes] = useState("");
  const [activeTab, setActiveTab] = useState("details");
  const [reviseDialogOpen, setReviseDialogOpen] = useState(false);
  const { hasRole } = usePermissions();

  if (!loan) return null;

  const status = statusMap[loan.status];
  const StatusIcon = status.icon;

  const isDSP = hasRole("divisi_simpan_pinjam");
  const canDSPRevise =
    isDSP &&
    loan.currentStep === LoanApprovalStep.DIVISI_SIMPAN_PINJAM &&
    (loan.status === LoanStatus.SUBMITTED ||
      loan.status === LoanStatus.UNDER_REVIEW_DSP);

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
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
          ? "Pinjaman berhasil disetujui"
          : "Pinjaman berhasil ditolak"
      );

      onSuccess?.();
      onOpenChange(false);
      setNotes("");
    } catch (error: any) {
      toast.error(handleApiError(error));
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadAttachment = (url: string) => {
    window.open(url, "_blank");
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
        <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detail Pengajuan Pinjaman</DialogTitle>
          </DialogHeader>

          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="details">
                <FileText className="h-4 w-4 mr-2" />
                Detail
              </TabsTrigger>
              <TabsTrigger value="timeline">
                <History className="h-4 w-4 mr-2" />
                Timeline
              </TabsTrigger>
              <TabsTrigger value="calculation">
                <FaRupiahSign className="h-4 w-4 mr-2" />
                Perhitungan
              </TabsTrigger>
              <TabsTrigger value="installments">
                <CreditCard className="h-4 w-4 mr-2" />
                Cicilan
              </TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-6 mt-6">
              {/* Status */}
              <div className="flex items-center justify-between">
                <Badge
                  variant={status.variant}
                  className="flex items-center gap-2"
                >
                  <StatusIcon className="h-4 w-4" />
                  {status.label}
                </Badge>
                {loan.currentStep && (
                  <Badge variant="outline">
                    Step: {stepMap[loan.currentStep]}
                  </Badge>
                )}
              </div>

              {/* Revise Button for DSP */}
              {canDSPRevise && (
                <div className="rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950/30 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-1">
                        Opsi Revisi Tersedia
                      </h4>
                      <p className="text-sm text-blue-800 dark:text-blue-400">
                        Sebagai Divisi Simpan Pinjam, Anda dapat merevisi jumlah
                        pinjaman atau tenor sebelum menyetujui.
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
                <p className="text-sm text-muted-foreground mb-1">
                  Nomor Pinjaman
                </p>
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
                    <p className="font-medium">
                      {loan.user?.employee?.fullName}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Email</p>
                    <p className="font-medium">{loan.user?.email}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">No. Karyawan</p>
                    <p className="font-medium">
                      {loan.user?.employee?.employeeNumber}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Department</p>
                    <p className="font-medium">
                      {loan.user?.employee?.department?.departmentName || "-"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Loan Type Details */}
              <LoanTypeDetails loan={loan} />

              {/* Update bagian Loan Details untuk menampilkan info yang lebih general */}
              <div className="rounded-lg border p-4 space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <FaRupiahSign className="h-4 w-4" />
                  Informasi Pembayaran
                </h3>
                <Separator />
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Tenor</p>
                    <p className="font-medium">{loan.loanTenor} Bulan</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Suku Bunga</p>
                    <p className="font-medium">
                      {loan.interestRate}% per tahun
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Cicilan per Bulan</p>
                    <p className="text-lg font-bold text-orange-600">
                      {loan.monthlyInstallment
                        ? formatCurrency(loan.monthlyInstallment)
                        : "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Total Pembayaran</p>
                    <p className="font-bold">
                      {loan.totalRepayment
                        ? formatCurrency(loan.totalRepayment)
                        : "-"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Loan Details */}
              <div className="rounded-lg border p-4 space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <FaRupiahSign className="h-4 w-4" />
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
                    <p className="font-medium">
                      {loan.interestRate}% per tahun
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Cicilan per Bulan</p>
                    <p className="text-lg font-bold text-orange-600">
                      {loan.monthlyInstallment
                        ? formatCurrency(loan.monthlyInstallment)
                        : "-"}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-muted-foreground">Total Pembayaran</p>
                    <p className="font-bold">
                      {loan.totalRepayment
                        ? formatCurrency(loan.totalRepayment)
                        : "-"}
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
                <div className="flex items-center gap-2">
                  <p className="text-sm text-muted-foreground mb-1">
                    Nomor Rekening
                  </p>
                  <p className="text-lg font-mono font-medium">
                    {loan.user?.employee?.bankAccountNumber}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-muted-foreground mb-1">
                    Nama Bank
                  </p>
                  <p className="text-lg font-mono font-medium">
                    {loan.user?.employee?.bankAccountName}
                  </p>
                </div>
              </div>

              {/* Loan Purpose */}
              <div className="rounded-lg border p-4 space-y-3">
                <h3 className="font-semibold">Alasan Peminjaman</h3>
                <Separator />
                <p className="text-sm whitespace-pre-wrap">
                  {loan.loanPurpose}
                </p>
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
                        <span className="truncate">
                          {attachment.split("/").pop()}
                        </span>
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Revision Info */}
              {loan.revisionCount > 0 && <LoanRevisionsDisplay loan={loan} />}

              {/* Rejection Reason */}
              {loan.status === LoanStatus.REJECTED && loan.rejectionReason && (
                <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-4 space-y-2">
                  <h3 className="font-semibold text-destructive">
                    Alasan Penolakan
                  </h3>
                  <p className="text-sm">{loan.rejectionReason}</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="timeline" className="space-y-6 mt-6">
              {/* Approval Timeline */}
              <div className="space-y-4">
                {(() => {
                  const timelineSteps = [
                    {
                      id: "dsp",
                      step: LoanApprovalStep.DIVISI_SIMPAN_PINJAM,
                      label: stepMap[LoanApprovalStep.DIVISI_SIMPAN_PINJAM],
                      type: "approval",
                    },
                    {
                      id: "ketua",
                      step: LoanApprovalStep.KETUA,
                      label: stepMap[LoanApprovalStep.KETUA],
                      type: "approval",
                    },
                    {
                      id: "pengawas",
                      step: LoanApprovalStep.PENGAWAS,
                      label: stepMap[LoanApprovalStep.PENGAWAS],
                      type: "approval",
                    },
                    {
                      id: "disbursement",
                      label: "Pencairan Dana (Kasir)",
                      type: "disbursement",
                    },
                    {
                      id: "authorization",
                      label: "Otorisasi Final (Ketua)",
                      type: "authorization",
                    },
                  ];

                  return timelineSteps.map((item, index) => {
                    const isLast = index === timelineSteps.length - 1;
                    let status:
                      | "completed"
                      | "rejected"
                      | "revised"
                      | "current"
                      | "waiting" = "waiting";
                    let data: any = null;
                    let date: string | null = null;
                    let actorName: string | null = null;
                    let notes: string | null = null;

                    // Determine status and data based on step type
                    if (item.type === "approval" && item.step) {
                      const approval = loan.approvals.find(
                        (a) => a.step === item.step
                      );
                      if (approval) {
                        if (approval.decision === LoanApprovalDecision.APPROVED)
                          status = "completed";
                        else if (
                          approval.decision === LoanApprovalDecision.REJECTED
                        )
                          status = "rejected";
                        else if (
                          approval.decision === LoanApprovalDecision.REVISED
                        )
                          status = "revised";
                        else status = "current"; // Should ideally be caught by approval logic, but fallback

                        data = approval;
                        date = approval.decidedAt;
                        actorName = approval.approver?.name || "-";
                        notes = approval.notes;
                      } else if (
                        loan.currentStep === item.step &&
                        loan.status !== LoanStatus.REJECTED &&
                        loan.status !== LoanStatus.CANCELLED
                      ) {
                        status = "current";
                      } else if (
                        loan.status === LoanStatus.REJECTED ||
                        loan.status === LoanStatus.CANCELLED
                      ) {
                        status = "waiting"; // effectively cancelled
                      }
                    } else if (item.type === "disbursement") {
                      if (loan.disbursement) {
                        status = "completed";
                        data = loan.disbursement;
                        date = loan.disbursement.disbursementDate; // Note: Date only string in interface usually
                        actorName = loan.disbursement.processedByUser.name;
                        notes = loan.disbursement.notes;
                      } else if (
                        (loan.status ===
                          LoanStatus.APPROVED_PENDING_DISBURSEMENT ||
                          loan.status ===
                            LoanStatus.DISBURSEMENT_IN_PROGRESS) &&
                        !loan.disbursement
                      ) {
                        status = "current";
                      }
                    } else if (item.type === "authorization") {
                      if (loan.authorization) {
                        status = "completed";
                        data = loan.authorization;
                        date = loan.authorization.authorizationDate;
                        actorName = loan.authorization.authorizedByUser.name;
                        notes = loan.authorization.notes;
                      } else if (
                        loan.status === LoanStatus.PENDING_AUTHORIZATION &&
                        !loan.authorization
                      ) {
                        status = "current";
                      }
                    }

                    const isCompleted = status === "completed";
                    const isRejected = status === "rejected";
                    const isRevised = status === "revised";
                    const isCurrent = status === "current";
                    const isWaiting = status === "waiting";

                    return (
                      <div key={item.id} className="relative">
                        <div className="flex items-start gap-4">
                          <div className="flex flex-col items-center">
                            <div
                              className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${
                                isCompleted
                                  ? "border-green-500 bg-green-50 text-green-600 dark:bg-green-950"
                                  : isRejected
                                  ? "border-red-500 bg-red-50 text-red-600 dark:bg-red-950"
                                  : isRevised
                                  ? "border-orange-500 bg-orange-50 text-orange-600 dark:bg-orange-950"
                                  : isCurrent
                                  ? "border-blue-500 bg-blue-50 text-blue-600 dark:bg-blue-950"
                                  : "border-gray-300 bg-gray-50 text-gray-400 dark:bg-gray-900"
                              }`}
                            >
                              {isRejected ? (
                                <XCircle className="h-5 w-5" />
                              ) : isRevised ? (
                                <FileText className="h-5 w-5" />
                              ) : item.type === "disbursement" ? (
                                <FaRupiahSign className="h-5 w-5" />
                              ) : isCompleted ? (
                                <CheckCircle2 className="h-5 w-5" />
                              ) : (
                                <Clock
                                  className={`h-5 w-5 ${
                                    isCurrent ? "animate-pulse" : ""
                                  }`}
                                />
                              )}
                            </div>
                            {!isLast && (
                              <div
                                className={`mt-2 h-full w-0.5 ${
                                  isCompleted ? "bg-green-500" : "bg-gray-200"
                                }`}
                                style={{ minHeight: "40px" }}
                              />
                            )}
                          </div>

                          <div className="flex-1 space-y-1 pb-8">
                            <div className="flex items-center justify-between">
                              <h4
                                className={`font-semibold ${
                                  isWaiting ? "text-muted-foreground" : ""
                                }`}
                              >
                                {item.label}
                              </h4>
                              {isCurrent && (
                                <Badge
                                  variant="outline"
                                  className="gap-1 border-blue-200 bg-blue-50 text-blue-700"
                                >
                                  <Clock className="h-3 w-3" />
                                  Sedang Proses
                                </Badge>
                              )}
                              {isCompleted && (
                                <Badge
                                  variant="default"
                                  className="gap-1 bg-green-600"
                                >
                                  <CheckCircle2 className="h-3 w-3" />
                                  Selesai
                                </Badge>
                              )}
                              {isRejected && (
                                <Badge variant="destructive" className="gap-1">
                                  <XCircle className="h-3 w-3" />
                                  Ditolak
                                </Badge>
                              )}
                              {isRevised && (
                                <Badge
                                  variant="outline"
                                  className="gap-1 border-orange-500 text-orange-600"
                                >
                                  <FileText className="h-3 w-3" />
                                  Direvisi
                                </Badge>
                              )}
                              {isWaiting && (
                                <Badge
                                  variant="outline"
                                  className="text-muted-foreground"
                                >
                                  Menunggu
                                </Badge>
                              )}
                            </div>

                            {!isWaiting && (
                              <>
                                {actorName && (
                                  <p className="text-sm text-muted-foreground">
                                    oleh {actorName}
                                  </p>
                                )}

                                {date && (
                                  <p className="text-sm text-muted-foreground">
                                    {format(
                                      new Date(date),
                                      "dd MMMM yyyy HH:mm",
                                      {
                                        locale: id,
                                      }
                                    )}
                                  </p>
                                )}

                                {notes && (
                                  <p className="text-sm mt-2 p-2 bg-muted rounded">
                                    {notes}
                                  </p>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  });
                })()}
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
                      <p className="text-muted-foreground">
                        Tanggal Transaksi BCA
                      </p>
                      <p className="font-medium">
                        {format(
                          new Date(loan.disbursement.disbursementDate),
                          "dd MMMM yyyy",
                          {
                            locale: id,
                          }
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Jam Transaksi</p>
                      <p className="font-medium">
                        {loan.disbursement.disbursementTime}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-muted-foreground">Diproses oleh</p>
                      <p className="font-medium">
                        {loan.disbursement.processedByUser.name}
                      </p>
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
                        {format(
                          new Date(loan.authorization.authorizationDate),
                          "dd MMMM yyyy",
                          {
                            locale: id,
                          }
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Jam Otorisasi</p>
                      <p className="font-medium">
                        {loan.authorization.authorizationTime}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-muted-foreground">Diotorisasi oleh</p>
                      <p className="font-medium">
                        {loan.authorization.authorizedByUser.name}
                      </p>
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
              <CalculationBreakdown loan={loan} />
            </TabsContent>

            <TabsContent value="installments" className="space-y-6 mt-6">
              {loan.loanInstallments && loan.loanInstallments.length > 0 ? (
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px] text-center">
                          No
                        </TableHead>
                        <TableHead>Jatuh Tempo</TableHead>
                        <TableHead className="text-right">Jumlah</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                        <TableHead>Tanggal Bayar</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loan.loanInstallments.map((installment) => (
                        <TableRow key={installment.id}>
                          <TableCell className="text-center font-medium">
                            {installment.installmentNumber}
                          </TableCell>
                          <TableCell>
                            {format(
                              new Date(installment.dueDate),
                              "dd MMMM yyyy",
                              { locale: id }
                            )}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {formatCurrency(installment.amount)}
                          </TableCell>
                          <TableCell className="text-center">
                            {installment.isPaid ? (
                              <Badge
                                variant="default"
                                className="bg-green-600 hover:bg-green-700"
                              >
                                Lunas
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="text-muted-foreground"
                              >
                                Belum Lunas
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {installment.paidAt ? (
                              <span className="text-sm text-muted-foreground">
                                {format(
                                  new Date(installment.paidAt),
                                  "dd MMM yyyy HH:mm",
                                  { locale: id }
                                )}
                              </span>
                            ) : (
                              "-"
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-8 text-center border rounded-lg border-dashed text-muted-foreground">
                  <CreditCard className="h-10 w-10 mb-4 opacity-50" />
                  <p className="font-semibold">Belum Ada Data Cicilan</p>
                  <p className="text-sm">
                    Jadwal cicilan akan muncul setelah pinjaman dicairkan.
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Action Buttons for Approvers */}
          {canApprove &&
            [
              LoanStatus.SUBMITTED,
              LoanStatus.UNDER_REVIEW_DSP,
              LoanStatus.UNDER_REVIEW_KETUA,
              LoanStatus.UNDER_REVIEW_PENGAWAS,
            ].includes(loan.status) &&
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
                      onClick={() =>
                        handleProcess(LoanApprovalDecision.REJECTED)
                      }
                      disabled={isProcessing}
                      className="flex-1"
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Tolak
                    </Button>
                    <Button
                      onClick={() =>
                        handleProcess(LoanApprovalDecision.APPROVED)
                      }
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
      {/* Revise Loan Dialog */}
      <ReviseLoanDialog
        loan={loan}
        open={reviseDialogOpen}
        onOpenChange={setReviseDialogOpen}
        onSuccess={handleReviseSuccess}
      />
    </>
  );
}

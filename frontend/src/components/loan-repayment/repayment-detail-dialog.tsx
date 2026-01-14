"use client";

import { useState } from "react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import {
  Clock,
  CheckCircle2,
  XCircle,
  User,
  CreditCard,
  Shield,
  Loader2,
  FileText,
  History,
  Info,
} from "lucide-react";
import { FaRupiahSign } from "react-icons/fa6";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import {
  LoanRepayment,
  ApprovalDecision,
  RepaymentApprovalStep,
  RepaymentStatus,
} from "@/types/loan-repayment.types";
import { loanRepaymentService } from "@/services/loan-repayment.service";
import { RepaymentStatusBadge } from "./repayment-status-badge";

const formatIDR = (value: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value);
};

interface RepaymentDetailDialogProps {
  repayment: LoanRepayment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isApprover?: boolean;
  currentUserId?: string;
  currentUserRoles?: string[];
  onSuccess?: () => void;
}

const approvalSchema = z.object({
  decision: z.nativeEnum(ApprovalDecision),
  notes: z.string().optional(),
});

const stepMap = {
  [RepaymentApprovalStep.DIVISI_SIMPAN_PINJAM]: "Divisi Simpan Pinjam",
  [RepaymentApprovalStep.KETUA]: "Ketua",
};

export function RepaymentDetailDialog({
  repayment,
  open,
  onOpenChange,
  isApprover = false,
  currentUserRoles,
  onSuccess,
}: RepaymentDetailDialogProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState("details");

  const form = useForm<z.infer<typeof approvalSchema>>({
    resolver: zodResolver(approvalSchema),
    defaultValues: {
      decision: ApprovalDecision.APPROVED,
      notes: "",
    },
  });

  if (!repayment) return null;

  const loan = repayment.loanApplication;
  const employee = loan?.user?.employee;

  // Determine if current user can approve
  const canApprove =
    isApprover &&
    repayment.status.startsWith("UNDER_REVIEW") &&
    (() => {
      if (
        repayment.currentStep === RepaymentApprovalStep.DIVISI_SIMPAN_PINJAM
      ) {
        return currentUserRoles?.includes("divisi_simpan_pinjam");
      }
      if (repayment.currentStep === RepaymentApprovalStep.KETUA) {
        return currentUserRoles?.includes("ketua");
      }
      return false;
    })();

  const onSubmitApproval = async (values: z.infer<typeof approvalSchema>) => {
    try {
      setIsProcessing(true);
      await loanRepaymentService.processApproval(repayment.id, values);
      toast.success("Approval berhasil diproses");
      onSuccess?.();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error processing approval:", error);
      toast.error(error.response?.data?.message || "Gagal memproses approval");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detail Pengajuan Pelunasan</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="details">
              <FileText className="h-4 w-4 mr-2" />
              Detail
            </TabsTrigger>
            <TabsTrigger value="timeline">
              <History className="h-4 w-4 mr-2" />
              Timeline Approval
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
              <RepaymentStatusBadge status={repayment.status} />
              {repayment.currentStep && (
                <Badge variant="outline">
                  Step: {stepMap[repayment.currentStep]}
                </Badge>
              )}
            </div>

            {/* Repayment Number */}
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">
                Nomor Pelunasan
              </p>
              <p className="text-lg font-bold font-mono">
                {repayment.repaymentNumber}
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
                  <p className="font-medium">
                    {employee?.fullName || loan?.user?.name || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Email</p>
                  <p className="font-medium">{loan?.user?.email || "-"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">No. Karyawan</p>
                  <p className="font-medium">
                    {employee?.employeeNumber || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Department</p>
                  <p className="font-medium">
                    {employee?.department?.departmentName || "-"}
                  </p>
                </div>
              </div>
            </div>

            {/* Loan Info */}
            <div className="rounded-lg border p-4 space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <FaRupiahSign className="h-4 w-4" />
                Informasi Pinjaman Awal
              </h3>
              <Separator />
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Nomor Pinjaman</p>
                  <p className="font-mono font-medium">
                    {loan?.loanNumber || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Jenis Pinjaman</p>
                  <p className="font-medium">
                    {loan?.loanType?.replace("_", " ") || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Jumlah Pinjaman Awal</p>
                  <p className="text-lg font-bold text-primary">
                    {formatIDR(loan?.loanAmount || 0)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Tenor</p>
                  <p className="font-medium">{loan?.loanTenor || 0} Bulan</p>
                </div>
              </div>
            </div>

            {/* Repayment Details */}
            <div className="rounded-lg border p-4 space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Detail Pelunasan
              </h3>
              <Separator />
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Tanggal Pengajuan</p>
                  <p className="font-medium">
                    {repayment.submittedAt
                      ? format(
                          new Date(repayment.submittedAt),
                          "dd MMMM yyyy HH:mm",
                          { locale: id }
                        )
                      : "-"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total Pelunasan</p>
                  <p className="text-lg font-bold text-primary">
                    {formatIDR(repayment.totalAmount)}
                  </p>
                </div>
                <div className="col-span-2">
                  <div className="flex items-center space-x-2 text-sm bg-green-50 dark:bg-green-900/20 p-2 rounded">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span>
                      Disetujui oleh anggota pada{" "}
                      {repayment.agreedAt
                        ? format(
                            new Date(repayment.agreedAt),
                            "dd MMM yyyy HH:mm",
                            { locale: id }
                          )
                        : "-"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Rejection Reason */}
            {repayment.status === RepaymentStatus.REJECTED &&
              repayment.rejectionReason && (
                <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-4 space-y-2">
                  <h3 className="font-semibold text-destructive">
                    Alasan Penolakan
                  </h3>
                  <p className="text-sm">{repayment.rejectionReason}</p>
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
                    step: RepaymentApprovalStep.DIVISI_SIMPAN_PINJAM,
                    label: stepMap[RepaymentApprovalStep.DIVISI_SIMPAN_PINJAM],
                  },
                  {
                    id: "ketua",
                    step: RepaymentApprovalStep.KETUA,
                    label: stepMap[RepaymentApprovalStep.KETUA],
                  },
                ];

                return timelineSteps.map((item, index) => {
                  const isLast = index === timelineSteps.length - 1;
                  let status: "completed" | "rejected" | "current" | "waiting" =
                    "waiting";
                  let data: any = null;
                  let date: string | null = null;
                  let actorName: string | null = null;
                  let notes: string | null = null;

                  const approval = repayment.approvals?.find(
                    (a) => a.step === item.step
                  );
                  if (approval) {
                    if (approval.decision === ApprovalDecision.APPROVED)
                      status = "completed";
                    else if (approval.decision === ApprovalDecision.REJECTED)
                      status = "rejected";
                    else status = "current";

                    data = approval;
                    date = approval.decidedAt;
                    actorName = approval.approver?.name || "-";
                    notes = approval.notes;
                  } else if (
                    repayment.currentStep === item.step &&
                    repayment.status !== RepaymentStatus.REJECTED
                  ) {
                    status = "current";
                  } else if (repayment.status === RepaymentStatus.REJECTED) {
                    status = "waiting";
                  }

                  const isCompleted = status === "completed";
                  const isRejected = status === "rejected";
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
                                : isCurrent
                                ? "border-blue-500 bg-blue-50 text-blue-600 dark:bg-blue-950"
                                : "border-gray-300 bg-gray-50 text-gray-400 dark:bg-gray-900"
                            }`}
                          >
                            {isRejected ? (
                              <XCircle className="h-5 w-5" />
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

            {/* Final Status Info */}
            {repayment.status === RepaymentStatus.COMPLETED && (
              <div className="rounded-lg border border-green-200 bg-green-50 dark:bg-green-950/30 p-4 space-y-3">
                <h3 className="font-semibold text-green-900 dark:text-green-300 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Pelunasan Disetujui
                </h3>
                <Separator />
                <div className="text-sm text-green-800 dark:text-green-200">
                  Pengajuan pelunasan telah disetujui. Pinjaman dengan nomor{" "}
                  <strong>{loan?.loanNumber}</strong> telah dinyatakan lunas.
                </div>
                {repayment.approvedAt && (
                  <div className="text-xs text-muted-foreground">
                    Disetujui pada:{" "}
                    {format(
                      new Date(repayment.approvedAt),
                      "dd MMMM yyyy HH:mm",
                      { locale: id }
                    )}
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="calculation" className="space-y-4 mt-6">
            {loan &&
            loan.interestRate &&
            loan.monthlyInstallment &&
            loan.totalRepayment ? (
              <Card>
                <CardHeader>
                  <CardTitle>Rincian Perhitungan Pinjaman</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-2">
                      <span className="text-muted-foreground">
                        Jumlah Pinjaman
                      </span>
                      <span className="text-lg font-bold">
                        {formatIDR(loan.loanAmount)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center py-2">
                      <span className="text-muted-foreground">Tenor</span>
                      <span className="font-medium">
                        {loan.loanTenor} Bulan
                      </span>
                    </div>

                    <div className="flex justify-between items-center py-2">
                      <span className="text-muted-foreground">Suku Bunga</span>
                      <span className="font-medium">
                        {loan.interestRate}% per tahun
                      </span>
                    </div>

                    <Separator />

                    <div className="flex justify-between items-center py-2">
                      <span className="text-muted-foreground">Total Bunga</span>
                      <span className="font-medium text-orange-600">
                        {formatIDR(loan.totalRepayment - loan.loanAmount)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center py-2 bg-muted rounded-lg px-4">
                      <span className="font-semibold">Total Pembayaran</span>
                      <span className="text-lg font-bold">
                        {formatIDR(loan.totalRepayment)}
                      </span>
                    </div>

                    <Separator />

                    <div className="flex justify-between items-center py-2 bg-primary/5 rounded-lg px-4">
                      <span className="font-semibold text-primary">
                        Cicilan per Bulan
                      </span>
                      <span className="text-2xl font-bold text-primary">
                        {formatIDR(loan.monthlyInstallment)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Perhitungan pinjaman tidak tersedia
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>

          <TabsContent value="installments" className="space-y-6 mt-6">
            {loan?.loanInstallments && loan.loanInstallments.length > 0 ? (
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px] text-center">No</TableHead>
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
                          {formatIDR(installment.amount)}
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
        {canApprove && (
          <>
            <Separator />
            <div className="space-y-4">
              <h4 className="font-semibold flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Proses Approval
              </h4>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmitApproval)}
                  className="space-y-4"
                >
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Catatan (Opsional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Masukkan catatan approval..."
                            className="resize-none"
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex gap-3">
                    <Button
                      variant="destructive"
                      onClick={() => {
                        form.setValue("decision", ApprovalDecision.REJECTED);
                        form.handleSubmit(onSubmitApproval)();
                      }}
                      disabled={isProcessing}
                      className="flex-1"
                      type="button"
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Tolak
                    </Button>
                    <Button
                      onClick={() => {
                        form.setValue("decision", ApprovalDecision.APPROVED);
                        form.handleSubmit(onSubmitApproval)();
                      }}
                      disabled={isProcessing}
                      className="flex-1"
                      type="button"
                    >
                      {isProcessing && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Setujui
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

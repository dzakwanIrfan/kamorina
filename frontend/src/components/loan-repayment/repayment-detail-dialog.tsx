"use client";

import { useState } from "react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import {
  FileText,
  Clock,
  Calendar,
  CheckCircle2,
  XCircle,
  User,
  CreditCard,
  Building,
  Shield,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  LoanRepayment,
  ApprovalDecision,
  RepaymentApprovalStep,
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
  repayment: LoanRepayment | null; // Pass full object if available, or fetch inside if only ID
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isApprover?: boolean; // If true, show approval actions
  currentUserId?: string;
  currentUserRoles?: string[];
  onSuccess?: () => void;
}

const approvalSchema = z.object({
  decision: z.nativeEnum(ApprovalDecision),
  notes: z.string().optional(),
});

export function RepaymentDetailDialog({
  repayment,
  open,
  onOpenChange,
  isApprover = false,
  currentUserRoles,
  onSuccess,
}: RepaymentDetailDialogProps) {
  const [isProcessing, setIsProcessing] = useState(false);

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
  // Mapping roles to steps is complex without strict types, but we can infer
  const canApprove =
    isApprover &&
    repayment.status.startsWith("UNDER_REVIEW") &&
    (() => {
      // Check if user has role corresponding to current step
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
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0">
        <DialogHeader className="p-6 pb-2">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl">Detail Pelunasan</DialogTitle>
            <RepaymentStatusBadge status={repayment.status} />
          </div>
          <DialogDescription>{repayment.repaymentNumber}</DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 p-6 pt-2">
          <div className="space-y-6">
            {/* Applicant Info */}
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1">
                <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center">
                  <User className="w-4 h-4 mr-2" />
                  Informasi Peminjam
                </h4>
                <div className="text-sm font-medium">
                  {loan?.user?.name || "-"}
                </div>
                <div className="text-xs text-muted-foreground">
                  {loan?.user?.email || "-"}
                </div>
                <div className="text-xs mt-1 bg-muted inline-block px-2 py-0.5 rounded">
                  {employee?.employeeNumber || "-"}
                </div>
              </div>

              <div className="space-y-1">
                <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center">
                  <CreditCard className="w-4 h-4 mr-2" />
                  Informasi Pinjaman
                </h4>
                <div className="text-sm font-medium">{loan?.loanNumber}</div>
                <div className="text-xs text-muted-foreground">
                  {loan?.loanType?.replace("_", " ")}
                </div>
                <div className="text-sm font-semibold mt-1">
                  Awal: {formatIDR(loan?.loanAmount || 0)}
                </div>
              </div>
            </div>

            <Separator />

            {/* Repayment Details */}
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center">
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Rincian Pelunasan
              </h4>
              <Card>
                <CardContent className="p-4 grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs text-muted-foreground block">
                      Tanggal Pengajuan
                    </span>
                    <span className="text-sm font-medium">
                      {repayment.submittedAt
                        ? format(
                            new Date(repayment.submittedAt),
                            "dd MMMM yyyy HH:mm",
                            { locale: id }
                          )
                        : "-"}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block">
                      Total Pelunasan
                    </span>
                    <span className="text-lg font-bold text-primary">
                      {formatIDR(repayment.totalAmount)}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <div className="flex items-center space-x-2 text-sm">
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
                </CardContent>
              </Card>
            </div>

            <Separator />

            {/* Approval Hisotry */}
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center">
                <Clock className="w-4 h-4 mr-2" />
                Riwayat Approval
              </h4>
              <div className="space-y-4">
                {repayment.approvals?.map((approval, index) => {
                  // Determine icon and color based on decision
                  let icon = <Clock className="w-4 h-4 text-gray-400" />;
                  let colorClass = "border-l-4 border-gray-300";
                  let bgClass = "bg-gray-50 dark:bg-gray-900";

                  if (approval.decision === ApprovalDecision.APPROVED) {
                    icon = <CheckCircle2 className="w-4 h-4 text-green-500" />;
                    colorClass = "border-l-4 border-green-500";
                    bgClass = "bg-green-50/50 dark:bg-green-900/10";
                  } else if (approval.decision === ApprovalDecision.REJECTED) {
                    icon = <XCircle className="w-4 h-4 text-red-500" />;
                    colorClass = "border-l-4 border-red-500";
                    bgClass = "bg-red-50/50 dark:bg-red-900/10";
                  }

                  // Determine Step Label
                  const stepLabel =
                    approval.step === RepaymentApprovalStep.DIVISI_SIMPAN_PINJAM
                      ? "Divisi Simpan Pinjam"
                      : "Ketua";

                  return (
                    <div
                      key={approval.id}
                      className={`relative pl-4 py-3 pr-4 rounded-r-md ${colorClass} ${bgClass} flex flex-col gap-1`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="font-semibold text-sm flex items-center gap-2">
                          {icon}
                          {stepLabel}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {approval.decidedAt
                            ? format(
                                new Date(approval.decidedAt),
                                "dd MMM HH:mm",
                                { locale: id }
                              )
                            : "Menunggu"}
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground pl-6">
                        {approval.approver?.name || "-"}
                      </div>
                      {approval.notes && (
                        <div className="mt-2 text-sm bg-background p-2 rounded border ml-6">
                          "{approval.notes}"
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Approval Form */}
            {canApprove && (
              <div className="pt-4 mt-6 border-t">
                <h4 className="text-sm font-medium mb-4 flex items-center">
                  <Shield className="w-4 h-4 mr-2" />
                  Proses Approval
                </h4>
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmitApproval)}
                    className="space-y-4"
                  >
                    <FormField
                      control={form.control}
                      name="decision"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Keputusan</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Pilih keputusan" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem
                                value={ApprovalDecision.APPROVED}
                                className="text-green-600 focus:text-green-600"
                              >
                                <div className="flex items-center">
                                  <CheckCircle2 className="w-4 h-4 mr-2" />{" "}
                                  Setujui
                                </div>
                              </SelectItem>
                              <SelectItem
                                value={ApprovalDecision.REJECTED}
                                className="text-red-600 focus:text-red-600"
                              >
                                <div className="flex items-center">
                                  <XCircle className="w-4 h-4 mr-2" /> Tolak
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
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
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isProcessing}
                    >
                      {isProcessing && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Kirim Keputusan
                    </Button>
                  </form>
                </Form>
              </div>
            )}
          </div>
        </ScrollArea>
        {!canApprove && (
          <DialogFooter className="p-6 pt-2">
            <Button onClick={() => onOpenChange(false)}>Tutup</Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

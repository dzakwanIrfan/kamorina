import { LoanStatus, LoanApprovalStep, LoanType } from "@/types/loan.types";
import { CheckCircle2, Clock, XCircle } from "lucide-react";

export const statusMap = {
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
  [LoanStatus.COMPLETED]: {
    label: "Selesai",
    variant: "default" as const,
    icon: CheckCircle2,
  },
  [LoanStatus.REJECTED]: {
    label: "Ditolak",
    variant: "destructive" as const,
    icon: XCircle,
  },
  [LoanStatus.CANCELLED]: {
    label: "Dibatalkan",
    variant: "destructive" as const,
    icon: XCircle,
  },
};

export const stepMap = {
  [LoanApprovalStep.DIVISI_SIMPAN_PINJAM]: "Divisi Simpan Pinjam",
  [LoanApprovalStep.KETUA]: "Ketua",
  [LoanApprovalStep.PENGAWAS]: "Pengawas",
};

export const loanTypeColors: Record<LoanType, string> = {
  [LoanType.CASH_LOAN]: "text-blue-600",
  [LoanType.GOODS_REIMBURSE]: "text-green-600",
  [LoanType.GOODS_ONLINE]: "text-purple-600",
  [LoanType.GOODS_PHONE]: "text-orange-600",
};

export const MAX_GOODS_LOAN_AMOUNT = 15000000;
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_FILES_COUNT = 5;

export const ACCEPTED_FILE_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "image/jpeg",
  "image/jpg",
  "image/png",
];

export const ACCEPTED_FILE_EXTENSIONS =
  ".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png";

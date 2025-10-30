export enum ApplicationStatus {
  UNDER_REVIEW = 'UNDER_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum ApprovalStep {
  DIVISI_SIMPAN_PINJAM = 'DIVISI_SIMPAN_PINJAM',
  KETUA = 'KETUA',
}

export enum ApprovalDecision {
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export interface ApplicationApproval {
  id: string;
  step: ApprovalStep;
  decision: ApprovalDecision | null;
  decidedAt: string | null;
  notes: string | null;
  createdAt: string;
  approver?: {
    id: string;
    name: string;
    email: string;
  } | null;
}

export interface MemberApplication {
  id: string;
  userId: string;
  status: ApplicationStatus;
  currentStep: ApprovalStep | null;
  submittedAt: string | null;
  approvedAt: string | null;
  rejectedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
    nik: string | null;
    npwp: string | null;
    dateOfBirth: string | null;
    birthPlace: string | null;
    permanentEmployeeDate: string | null;
    installmentPlan: number | null;
    employee: {
      id: string;
      employeeNumber: string;
      fullName: string;
    };
    department?: {
      id: string;
      departmentName: string;
    } | null;
  };
  approvals: ApplicationApproval[];
}

export interface SubmitApplicationRequest {
  nik: string;
  npwp: string;
  departmentId: string;
  dateOfBirth: string;
  birthPlace: string;
  permanentEmployeeDate: string;
  installmentPlan: number;
}

export interface ApproveRejectRequest {
  decision: ApprovalDecision;
  notes?: string;
}
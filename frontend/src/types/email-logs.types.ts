import { EmailConfig } from "./email-config.types";

export enum EmailStatus {
  PENDING = "PENDING",
  SENT = "SENT",
  FAILED = "FAILED",
}

export interface EmailLog {
  id: string;
  emailId?: string;
  recipient: string;
  subject: string;
  content?: string;
  status: EmailStatus;
  errorMessage?: string;
  retryCount: number;
  sentAt: string;
  email?: EmailConfig
}

export interface EmailLogQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: EmailStatus;
  startDate?: string;
  endDate?: string;
  emailId?: string;
}

export interface EmailLogResponse {
  data: EmailLog[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

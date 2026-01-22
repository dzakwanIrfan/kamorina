export interface EmailConfig {
  id: string;
  host: string;
  port: number;
  username: string;
  password?: string; // Only for input, not returned in list usually (or encrypted)
  fromName: string;
  isActive: boolean;
  label?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEmailConfigFn {
  host: string;
  port: number;
  username: string;
  password?: string;
  fromName: string;
  isActive?: boolean;
  label?: string;
}

export interface UpdateEmailConfigFn extends Partial<CreateEmailConfigFn> {}

export interface Employee {
  id: string;
  employeeNumber: string;
  fullName: string;
  employeeType: string;
  isActive: boolean;
  department?: {
    id: string;
    departmentName: string;
  };
  golongan?: {
    id: string;
    golonganName: string;
  };
  bankAccountNumber: string;
  permanentEmployeeDate?: Date;
}

export interface User {
  id: string;
  name: string;
  email: string;
  nik?: string;
  npwp?: string;
  avatar?: string;
  emailVerified: boolean;
  emailVerifiedAt?: Date;
  memberVerified: boolean;
  dateOfBirth?: Date;
  birthPlace?: string;
  installmentPlan?: number;
  departmentId?: string;
  employee?: Employee;
  department?: {
    id: string;
    name: string;
  };
  roles: string[];
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthResponse {
  message: string;
  accessToken?: string; // Made optional since we use httpOnly cookie
  user: User;
}

export interface RefreshTokenResponse {
  accessToken: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  employeeNumber: string;
  password: string;
  confPassword: string;
}

export interface LoginRequest {
  emailOrNik: string;
  password: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
  confPassword: string;
}

export interface VerifyEmailRequest {
  token: string;
}

export interface ApiErrorResponse {
  statusCode: number;
  message: string | string[];
  error: string;
}

export interface ExtendedApiError extends ApiErrorResponse {
  isNetworkError?: boolean;
  isAuthError?: boolean;
}
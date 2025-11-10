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
}

export interface User {
  id: string;
  name: string;
  email: string;
  nik?: string;
  avatar?: string; 
  bankAccountNumber?: string;
  emailVerified: boolean;
  emailVerifiedAt?: Date;
  memberVerified: boolean;
  dateOfBirth?: Date; 
  birthPlace?: string; 
  departmentId?: string;
  employee?: Employee; 
  department?: {
    id: string;
    name: string;
  };
  roles: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthResponse {
  message: string;
  accessToken: string;
  user: User;
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
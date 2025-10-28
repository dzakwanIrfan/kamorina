export interface User {
  id: string;
  name: string;
  email: string;
  nik?: string;
  emailVerified: boolean;
  emailVerifiedAt?: Date;
  memberVerified: boolean;
  departmentId?: string;
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
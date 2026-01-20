import {
  Employee,
  CreateEmployeeRequest,
  UpdateEmployeeRequest,
} from "./employee.types";

export interface User {
  id: string;
  name: string;
  email: string;
  nik?: string;
  npwp?: string;
  employeeId: string;
  employee?: Employee;
  emailVerified: boolean;
  memberVerified: boolean;
  dateOfBirth?: string;
  birthPlace?: string;
  installmentPlan?: number;
  lastLoginAt?: string;
  roles?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  nik?: string;
  npwp?: string;
  birthPlace?: string;
  dateOfBirth?: Date;
  employeeId?: string;
  newEmployee?: CreateEmployeeRequest;
  roles?: string[];
  memberVerified?: boolean;
  emailVerified?: boolean;
  installmentPlan?: number;
  avatar?: string;
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
  password?: string;
  nik?: string;
  npwp?: string;
  birthPlace?: string;
  dateOfBirth?: Date;
  employeeUpdates?: UpdateEmployeeRequest;
  roles?: string[];
  memberVerified?: boolean;
  emailVerified?: boolean;
  installmentPlan?: number;
  avatar?: string;
}

export interface QueryUserParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  role?: string;
  departmentId?: string;
  isActive?: boolean;
}

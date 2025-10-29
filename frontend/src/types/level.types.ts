export interface Level {
  id: string;
  levelName: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    userRoles: number;
  };
  userRoles?: UserRole[];
}

export interface CreateLevelRequest {
  levelName: string;
  description?: string;
}

export interface UpdateLevelRequest {
  levelName?: string;
  description?: string;
}

export interface QueryLevelParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  startDate?: string;
  endDate?: string;
  levelName?: string;
}

interface UserRole {
  id: string;
  user: {
    id: string;
    name: string;
    email: string;
    nik?: string;
  };
}
import { apiClient } from "@/lib/axios";
import { PaginatedResponse } from "@/types/pagination.types";
import { User } from "@/types/auth.types";

export interface QueryUserParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export const userService = {
  async getAll(params?: QueryUserParams): Promise<PaginatedResponse<User>> {
    const response = await apiClient.get("/users", { params });
    return response.data;
  },
};

import { apiClient } from "@/lib/axios";
import {
  Level,
  CreateLevelRequest,
  UpdateLevelRequest,
  QueryLevelParams,
  AssignUserRequest,
} from "@/types/level.types";
import { PaginatedResponse } from "@/types/pagination.types";

export const levelService = {
  async getAll(params?: QueryLevelParams): Promise<PaginatedResponse<Level>> {
    const response = await apiClient.get("/levels", { params });
    return response.data;
  },

  async getById(id: string): Promise<Level> {
    const response = await apiClient.get(`/levels/${id}`);
    return response.data;
  },

  async create(data: CreateLevelRequest): Promise<Level> {
    const response = await apiClient.post("/levels", data);
    return response.data;
  },

  async update(id: string, data: UpdateLevelRequest): Promise<Level> {
    const response = await apiClient.patch(`/levels/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<{ message: string }> {
    const response = await apiClient.delete(`/levels/${id}`);
    return response.data;
  },

  async assignUser(
    id: string,
    data: AssignUserRequest
  ): Promise<{ message: string }> {
    const response = await apiClient.post(`/levels/${id}/users`, data);
    return response.data;
  },

  async removeUser(id: string, userId: string): Promise<{ message: string }> {
    const response = await apiClient.delete(`/levels/${id}/users/${userId}`);
    return response.data;
  },
};

import { apiClient } from "@/lib/axios";
import {
  User,
  CreateUserRequest,
  UpdateUserRequest,
  QueryUserParams,
} from "@/types/user.types";
import { PaginatedResponse } from "@/types/pagination.types";

export const userService = {
  async getAll(params?: QueryUserParams): Promise<PaginatedResponse<User>> {
    const response = await apiClient.get("/users", { params });

    const data = response.data;
    if (data.data) {
      data.data = data.data.map((user: any) => ({
        ...user,
        roles:
          user.roles?.map((r: any) => r.level?.levelName || r.levelName || r) ||
          [],
      }));
    }
    return data;
  },

  async getById(id: string): Promise<User> {
    const response = await apiClient.get(`/users/${id}`);
    const user = response.data;
    if (user.roles) {
      user.roles = user.roles.map(
        (r: any) => r.level?.levelName || r.levelName || r
      );
    }
    return user;
  },

  async create(data: CreateUserRequest): Promise<User> {
    const response = await apiClient.post("/users", data);
    return response.data;
  },

  async update(id: string, data: UpdateUserRequest): Promise<User> {
    const response = await apiClient.patch(`/users/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<{ message: string }> {
    const response = await apiClient.delete(`/users/${id}`);
    return response.data;
  },
};

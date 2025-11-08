import { apiClient } from '@/lib/axios';
import { User } from '@/types/auth.types';

interface UpdateProfileData {
  name?: string;
  dateOfBirth?: string;
  birthPlace?: string;
}

interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export const profileService = {
  async getProfile(): Promise<User> {
    const response = await apiClient.get('/profile');
    return response.data;
  },

  async updateProfile(data: UpdateProfileData): Promise<{ message: string; user: User }> {
    const response = await apiClient.put('/profile', data);
    return response.data;
  },

  async uploadAvatar(file: File): Promise<{ message: string; user: User }> {
    const formData = new FormData();
    formData.append('avatar', file);

    const response = await apiClient.post('/profile/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async deleteAvatar(): Promise<{ message: string; user: User }> {
    const response = await apiClient.delete('/profile/avatar');
    return response.data;
  },

  async changePassword(data: ChangePasswordData): Promise<{ message: string }> {
    const response = await apiClient.put('/profile/password', data);
    return response.data;
  },
};
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

interface ProfileResponse {
  message: string;
  user: User;
}

export const profileService = {
  async getProfile(): Promise<User> {
    const response = await apiClient.get('/profile');
    return response.data;
  },

  async updateProfile(data: UpdateProfileData): Promise<ProfileResponse> {
    const response = await apiClient.put('/profile', data);
    
    // Update localStorage with new user data
    if (typeof window !== 'undefined' && response.data.user) {
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    
    return response.data;
  },

  async uploadAvatar(file: File): Promise<ProfileResponse> {
    const formData = new FormData();
    formData.append('avatar', file);

    const response = await apiClient.post('/profile/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    // Update localStorage with new user data
    if (typeof window !== 'undefined' && response.data.user) {
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    
    return response.data;
  },

  async deleteAvatar(): Promise<ProfileResponse> {
    const response = await apiClient.delete('/profile/avatar');
    
    // Update localStorage with new user data
    if (typeof window !== 'undefined' && response.data.user) {
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    
    return response.data;
  },

  async changePassword(data: ChangePasswordData): Promise<{ message: string }> {
    const response = await apiClient.put('/profile/password', data);
    return response.data;
  },
};
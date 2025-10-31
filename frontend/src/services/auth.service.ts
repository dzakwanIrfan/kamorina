import { apiClient } from '@/lib/axios';
import { syncTokenToCookie } from '@/lib/auth-client';
import {
  AuthResponse,
  RegisterRequest,
  LoginRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  VerifyEmailRequest,
  User,
} from '@/types/auth.types';

export const authService = {
  async register(data: RegisterRequest): Promise<{ message: string; email: string }> {
    const response = await apiClient.post('/auth/register', data);
    return response.data;
  },

  async verifyEmail(data: VerifyEmailRequest): Promise<{ message: string }> {
    const response = await apiClient.post('/auth/verify-email', data);
    return response.data;
  },

  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await apiClient.post('/auth/login', data);
    
    // Save to localStorage and cookie
    if (typeof window !== 'undefined') {
      localStorage.setItem('accessToken', response.data.accessToken);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      // Sync token to cookie for middleware
      syncTokenToCookie(response.data.accessToken);
    }
    
    return response.data;
  },

  async refreshUserSession(): Promise<User> {
    const response = await apiClient.get('/auth/me');
    
    // Update localStorage with fresh user data
    if (typeof window !== 'undefined') {
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    
    return response.data.user;
  },

  async forgotPassword(data: ForgotPasswordRequest): Promise<{ message: string }> {
    const response = await apiClient.post('/auth/forgot-password', data);
    return response.data;
  },

  async resetPassword(data: ResetPasswordRequest): Promise<{ message: string }> {
    const response = await apiClient.post('/auth/reset-password', data);
    return response.data;
  },

  logout() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      
      // Remove cookie
      syncTokenToCookie(null);
    }
  },

  getStoredUser() {
    if (typeof window !== 'undefined') {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user) : null;
    }
    return null;
  },

  getStoredToken() {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('accessToken');
    }
    return null;
  },
};
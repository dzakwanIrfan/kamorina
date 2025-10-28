import axios, { AxiosError } from 'axios';
import { ApiErrorResponse } from '@/types/auth.types';

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - HANYA handle token cleanup, JANGAN auto redirect
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorResponse>) => {
    // Handle 401 Unauthorized - cleanup saja, biar component yang handle redirect
    if (error.response?.status === 401) {
      // Hanya cleanup token jika benar-benar unauthorized
      // Tapi JANGAN redirect otomatis karena bisa jadi user salah password
      
      // Cek apakah ini error dari protected endpoint (ada token tapi invalid)
      // Bukan dari login/register endpoint
      const isAuthEndpoint = error.config?.url?.includes('/auth/');
      
      if (!isAuthEndpoint && typeof window !== 'undefined') {
        // Ini protected endpoint dengan token invalid - cleanup dan redirect
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        window.location.href = '/auth/login';
      }
      // Jika auth endpoint (login/register), biarkan error pass ke component
    }
    
    return Promise.reject(error);
  }
);

export const handleApiError = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const apiError = error as AxiosError<ApiErrorResponse>;
    
    if (apiError.response?.data?.message) {
      const message = apiError.response.data.message;
      return Array.isArray(message) ? message.join(', ') : message;
    }
    
    if (apiError.message) {
      return apiError.message;
    }
  }
  
  return 'Terjadi kesalahan yang tidak diketahui';
};
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { ApiErrorResponse } from '@/types/auth.types';

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
  withCredentials: true, // IMPORTANT: Send cookies with requests
});

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorResponse>) => {
    // Network error
    if (!error.response) {
      console.error('Network Error:', error.message);
      return Promise.reject({
        message: 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.',
        statusCode: 0,
      });
    }

    const status = error.response.status;
    
    // Handle 401 Unauthorized
    if (status === 401) {
      const isAuthEndpoint = error.config?.url?.includes('/auth/');
      
      if (!isAuthEndpoint && typeof window !== 'undefined') {
        // Protected endpoint with invalid token - redirect to login
        localStorage.removeItem('user');
        window.location.href = '/auth/login';
      }
    }
    
    // Handle 403 Forbidden
    if (status === 403) {
      console.error('Access Denied:', error.response.data.message);
    }
    
    // Handle 404 Not Found
    if (status === 404) {
      console.error('Not Found:', error.response.data.message);
    }
    
    // Handle 500 Server Error
    if (status >= 500) {
      console.error('Server Error:', error.response.data.message);
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
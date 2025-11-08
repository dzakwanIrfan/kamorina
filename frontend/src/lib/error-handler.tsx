import { AxiosError } from 'axios';
import { toast } from 'sonner';

export interface ApiError {
  statusCode: number;
  message: string | string[];
  error: string;
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    const apiError = error.response?.data as ApiError;
    
    if (apiError?.message) {
      return Array.isArray(apiError.message) 
        ? apiError.message.join(', ') 
        : apiError.message;
    }
    
    if (error.message) {
      return error.message;
    }
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return 'Terjadi kesalahan yang tidak diketahui';
}

export function handleApiError(error: unknown): void {
  const message = getErrorMessage(error);
  
  if (error instanceof AxiosError) {
    const status = error.response?.status;
    
    switch (status) {
      case 400:
        toast.error('Permintaan tidak valid', {
          description: message,
        });
        break;
      case 401:
        toast.error('Tidak terautentikasi', {
          description: 'Silakan login kembali',
        });
        break;
      case 403:
        toast.error('Akses ditolak', {
          description: message,
        });
        break;
      case 404:
        toast.error('Tidak ditemukan', {
          description: message,
        });
        break;
      case 409:
        toast.error('Konflik data', {
          description: message,
        });
        break;
      case 422:
        toast.error('Validasi gagal', {
          description: message,
        });
        break;
      case 500:
        toast.error('Kesalahan server', {
          description: 'Terjadi kesalahan pada server. Silakan coba lagi.',
        });
        break;
      case 503:
        toast.error('Layanan tidak tersedia', {
          description: 'Server sedang dalam pemeliharaan',
        });
        break;
      default:
        toast.error('Terjadi kesalahan', {
          description: message,
        });
    }
  } else {
    toast.error('Terjadi kesalahan', {
      description: message,
    });
  }
}

export function showSuccessToast(message: string, description?: string): void {
  toast.success(message, {
    description,
  });
}

export function showErrorToast(message: string, description?: string): void {
  toast.error(message, {
    description,
  });
}

export function showInfoToast(message: string, description?: string): void {
  toast.info(message, {
    description,
  });
}

export function showWarningToast(message: string, description?: string): void {
  toast.warning(message, {
    description,
  });
}
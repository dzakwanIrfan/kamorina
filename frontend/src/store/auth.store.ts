import { create } from 'zustand';
import { User } from '@/types/auth.types';
import { authService } from '@/services/auth.service';
import { clearAuthData } from '@/lib/axios';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  authError: string | null;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => Promise<void>;
  initializeAuth: () => Promise<void>;
  refreshUserSession: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  isInitialized: false,
  authError: null,

  setUser: (user) => {
    // Also update localStorage when setUser is called
    if (typeof window !== 'undefined') {
      if (user) {
        localStorage.setItem('user', JSON.stringify(user));
      } else {
        localStorage.removeItem('user');
      }
    }
    
    set({
      user,
      isAuthenticated: !!user,
      isLoading: false,
    });
  },

  setLoading: (loading) =>
    set({
      isLoading: loading,
    }),

  clearError: () =>
    set({
      authError: null,
    }),

  logout: async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      clearAuthData();
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        authError: null,
      });
    }
  },

  initializeAuth: async () => {
    // Prevent multiple initializations
    if (get().isInitialized) {
      return;
    }

    set({ isLoading: true });

    // ALWAYS try to validate with backend if we might have a cookie
    try {
      const validatedUser = await authService.validateSession();
      set({
        user: validatedUser,
        isAuthenticated: true,
        isLoading: false,
        isInitialized: true,
        authError: null,
      });
    } catch (error: any) {
      // Clear any stale data
      clearAuthData();
      
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        isInitialized: true,
        authError: null,
      });
    }
  },

  refreshUserSession: async () => {
    try {
      const updatedUser = await authService.refreshUserSession();
      
      set({
        user: updatedUser,
        isAuthenticated: true,
        authError: null,
      });
      
      return;
    } catch (error: any) {
      // Only clear auth if it's a 401 error
      if (error?.response?.status === 401 || error?.isAuthError) {
        clearAuthData();
        set({
          user: null,
          isAuthenticated: false,
          authError: 'Sesi Anda telah berakhir.',
        });
      }
      
      throw error;
    }
  },
}));
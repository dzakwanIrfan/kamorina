import { create } from 'zustand';
import { User } from '@/types/auth.types';
import { authService } from '@/services/auth.service';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => Promise<void>;
  initializeAuth: () => void;
  refreshUserSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  setUser: (user) =>
    set({
      user,
      isAuthenticated: !!user,
      isLoading: false,
    }),

  setLoading: (loading) =>
    set({
      isLoading: loading,
    }),

  logout: async () => {
    await authService.logout();
    set({
      user: null,
      isAuthenticated: false,
    });
  },

  initializeAuth: () => {
    const user = authService.getStoredUser();

    if (user) {
      set({
        user,
        isAuthenticated: true,
        isLoading: false,
      });
    } else {
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  refreshUserSession: async () => {
    try {
      set({ isLoading: true });
      const updatedUser = await authService.refreshUserSession();
      set({
        user: updatedUser,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      console.error('Failed to refresh user session:', error);
      set({ isLoading: false });
      throw error;
    }
  },
}));
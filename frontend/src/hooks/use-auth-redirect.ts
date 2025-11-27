'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';

interface UseAuthRedirectOptions {
  requireAuth?: boolean;
  requireRoles?: string[];
  redirectTo?: string;
}

export function useAuthRedirect(options: UseAuthRedirectOptions = {}) {
  const {
    requireAuth = true,
    requireRoles = [],
    redirectTo = '/auth/login',
  } = options;

  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading, isInitialized, authError } = useAuthStore();

  useEffect(() => {
    // Wait for auth to be initialized
    if (!isInitialized || isLoading) {
      return;
    }

    // Auth required but not authenticated
    if (requireAuth && !isAuthenticated) {
      const loginUrl = new URL(redirectTo, window.location.origin);
      if (pathname && pathname !== '/') {
        loginUrl.searchParams.set('redirect', pathname);
      }
      router.replace(loginUrl.toString());
      return;
    }

    // Check role requirements
    if (requireAuth && isAuthenticated && requireRoles.length > 0) {
      const userRoles = user?.roles || [];
      const hasRequiredRole = requireRoles.some(role => userRoles.includes(role));
      
      if (!hasRequiredRole) {
        router.replace('/dashboard/unauthorized');
        return;
      }
    }
  }, [
    isAuthenticated,
    isLoading,
    isInitialized,
    user,
    requireAuth,
    requireRoles,
    redirectTo,
    router,
    pathname,
  ]);

  return {
    user,
    isAuthenticated,
    isLoading: !isInitialized || isLoading,
    authError,
  };
}
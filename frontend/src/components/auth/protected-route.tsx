'use client';

import { useAuthStore } from '@/store/auth.store';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: string[];
  fallback?: React.ReactNode;
}

export function ProtectedRoute({
  children,
  requiredRoles = [],
  fallback,
}: ProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading, isInitialized } = useAuthStore();

  useEffect(() => {
    // Wait for initialization
    if (!isInitialized || isLoading) {
      return;
    }

    // Not authenticated - redirect to login
    if (!isAuthenticated) {
      const loginUrl = new URL('/auth/login', window.location.origin);
      if (pathname && pathname !== '/') {
        loginUrl.searchParams.set('redirect', pathname);
      }
      router.replace(loginUrl.toString());
      return;
    }

    // Check roles if required
    if (requiredRoles.length > 0) {
      const userRoles = user?.roles || [];
      const hasRequiredRole = requiredRoles.some(role => userRoles.includes(role));
      
      if (!hasRequiredRole) {
        router.replace('/dashboard/unauthorized');
      }
    }
  }, [isAuthenticated, isLoading, isInitialized, user, requiredRoles, router, pathname]);

  // Show loading while checking auth
  if (!isInitialized || isLoading) {
    return (
      fallback || (
        <div className="flex h-screen items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Memvalidasi akses...</p>
          </div>
        </div>
      )
    );
  }

  // Not authenticated - show nothing (redirect will happen)
  if (!isAuthenticated) {
    return null;
  }

  // Check roles
  if (requiredRoles.length > 0) {
    const userRoles = user?.roles || [];
    const hasRequiredRole = requiredRoles.some(role => userRoles.includes(role));
    
    if (!hasRequiredRole) {
      return null; // Redirect will happen
    }
  }

  return <>{children}</>;
}
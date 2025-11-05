import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtDecode } from 'jwt-decode';

interface JWTPayload {
  sub: string;
  email: string;
  roles: string[];
  iat: number;
  exp: number;
}

export function middleware(request: NextRequest) {
  const token = request.cookies.get('accessToken')?.value;
  const { pathname } = request.nextUrl;

  // Always allow these routes (no auth required, no redirect if logged in)
  const alwaysPublicRoutes = [
    '/auth/reset-password',
    '/auth/verify-email',
  ];

  // Public routes - redirect to dashboard if already logged in
  const publicAuthRoutes = [
    '/auth/login',
    '/auth/register',
    '/auth/forgot-password',
  ];

  // Protected routes pattern
  const protectedRoutesPattern = /^\/dashboard/;

  // Role-based routes
  const roleBasedRoutes: Record<string, string[]> = {
    '/dashboard/settings': ['ketua', 'divisi_simpan_pinjam'],
    '/dashboard/employees': ['ketua', 'divisi_simpan_pinjam'],
    '/dashboard/levels': ['ketua', 'divisi_simpan_pinjam', 'pengawas'],
    '/dashboard/departments': ['ketua', 'divisi_simpan_pinjam', 'pengawas', 'bendahara', 'payroll'],
    '/dashboard/member-application': ['ketua', 'divisi_simpan_pinjam', 'pengawas', 'payroll'],
  };

  // Check route type
  const isAlwaysPublic = alwaysPublicRoutes.some((route) => pathname.startsWith(route));
  const isPublicAuth = publicAuthRoutes.some((route) => pathname.startsWith(route));
  const isProtected = protectedRoutesPattern.test(pathname);

  // Root path - redirect based on auth status
  if (pathname === '/') {
    if (token) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  // Always public routes - allow everyone
  if (isAlwaysPublic) {
    return NextResponse.next();
  }

  // Public auth routes - redirect to dashboard if logged in
  if (isPublicAuth) {
    if (token) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }

  // Protected routes - require authentication
  if (isProtected) {
    if (!token) {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }

    // Check role-based access
    const roleBasedRoute = Object.keys(roleBasedRoutes).find((route) =>
      pathname.startsWith(route)
    );

    if (roleBasedRoute) {
      try {
        const decoded = jwtDecode<JWTPayload>(token);
        const requiredRoles = roleBasedRoutes[roleBasedRoute];
        const hasAccess = decoded.roles?.some((role) => requiredRoles.includes(role));

        if (!hasAccess) {
          // Redirect to dashboard with error message
          const url = new URL('/dashboard', request.url);
          url.searchParams.set('error', 'unauthorized');
          return NextResponse.redirect(url);
        }
      } catch (error) {
        // Invalid token, redirect to login
        return NextResponse.redirect(new URL('/auth/login', request.url));
      }
    }

    return NextResponse.next();
  }

  // Default: allow
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|_next).*)',
  ],
};
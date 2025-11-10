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

  const alwaysPublicRoutes = [
    '/auth/reset-password',
    '/auth/verify-email',
  ];

  const publicAuthRoutes = [
    '/auth/login',
    '/auth/register',
    '/auth/forgot-password',
  ];

  const protectedRoutesPattern = /^\/dashboard/;

  const roleBasedRoutes: Record<string, string[]> = {
    '/dashboard/settings': ['ketua', 'divisi_simpan_pinjam'],
    '/dashboard/employees': ['ketua', 'divisi_simpan_pinjam'],
    '/dashboard/levels': ['ketua', 'divisi_simpan_pinjam', 'pengawas'],
    '/dashboard/departments': ['ketua', 'divisi_simpan_pinjam', 'pengawas', 'bendahara', 'payroll'],
    '/dashboard/member-application': ['ketua', 'divisi_simpan_pinjam', 'pengawas', 'payroll'],
    '/dashboard/golongan': ['ketua', 'divisi_simpan_pinjam', 'pengawas', 'bendahara', 'payroll'],
    // ADD THESE - Loan routes
    '/dashboard/loans/approvals': ['ketua', 'divisi_simpan_pinjam', 'pengawas'],
    '/dashboard/loans/disbursement': ['shopkeeper'],
    '/dashboard/loans/authorization': ['ketua'],
  };

  const isAlwaysPublic = alwaysPublicRoutes.some((route) => pathname.startsWith(route));
  const isPublicAuth = publicAuthRoutes.some((route) => pathname.startsWith(route));
  const isProtected = protectedRoutesPattern.test(pathname);

  if (pathname === '/dashboard/unauthorized') {
    return NextResponse.next();
  }

  if (pathname === '/') {
    if (token) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  if (isAlwaysPublic) {
    return NextResponse.next();
  }

  if (isPublicAuth) {
    if (token) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }

  if (isProtected) {
    if (!token) {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }

    const roleBasedRoute = Object.keys(roleBasedRoutes).find((route) =>
      pathname.startsWith(route)
    );

    if (roleBasedRoute) {
      try {
        const decoded = jwtDecode<JWTPayload>(token);
        const requiredRoles = roleBasedRoutes[roleBasedRoute];
        const hasAccess = decoded.roles?.some((role) => requiredRoles.includes(role));

        if (!hasAccess) {
          return NextResponse.redirect(new URL('/dashboard/unauthorized', request.url));
        }
      } catch (error) {
        return NextResponse.redirect(new URL('/auth/login', request.url));
      }
    }

    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|_next).*)',
  ],
};
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

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

    // Role-based access will be handled by backend API
    // Middleware just checks if user is authenticated
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|_next).*)',
  ],
};
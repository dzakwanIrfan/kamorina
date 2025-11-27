import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('accessToken')?.value;
  const { pathname, searchParams } = request.nextUrl;

  // Routes that are always accessible (with or without auth)
  const alwaysPublicRoutes = [
    '/auth/reset-password',
    '/auth/verify-email',
  ];

  // Auth routes - redirect to dashboard if already logged in
  const publicAuthRoutes = [
    '/auth/login',
    '/auth/register',
    '/auth/forgot-password',
  ];

  // Protected routes pattern
  const protectedRoutesPattern = /^\/dashboard/;

  const isAlwaysPublic = alwaysPublicRoutes.some((route) => pathname.startsWith(route));
  const isPublicAuth = publicAuthRoutes.some((route) => pathname.startsWith(route));
  const isProtected = protectedRoutesPattern.test(pathname);

  // Always allow unauthorized page
  if (pathname === '/dashboard/unauthorized') {
    return NextResponse.next();
  }

  // Root path redirect
  if (pathname === '/') {
    if (token) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  // Always public routes - no redirect
  if (isAlwaysPublic) {
    return NextResponse.next();
  }

  // Public auth routes - redirect to dashboard if has token
  if (isPublicAuth) {
    if (token) {
      // Check if coming from expired session
      const sessionExpired = searchParams.get('session') === 'expired';
      if (sessionExpired) {
        // Clear the cookie and allow access to login
        const response = NextResponse.next();
        response.cookies.delete('accessToken');
        return response;
      }
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }

  // Protected routes - redirect to login if no token
  if (isProtected) {
    if (!token) {
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Token exists - allow access (actual validation happens in API calls)
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|_next).*)',
  ],
};
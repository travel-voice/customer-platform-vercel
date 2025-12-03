import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Skip middleware for static assets (images, fonts, etc.)
  const isFileRequest = /\.[^/]+$/.test(pathname);
  if (isFileRequest || pathname.startsWith('/_next')) {
    return NextResponse.next();
  }

  // Public routes that don't require authentication
  const publicRoutes = [
    '/auth/sign-in',
    '/auth/sign-up',
    '/auth/forgot-password',
    '/auth/reset-password',
    '/auth/verify-email',
    '/auth/verification/success',
    '/auth/callback',
    '/auth/accept-invite',
  ];

  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

  // Update session and get user
  const { user, supabaseResponse } = await updateSession(request);

  // Redirect to sign-in if not authenticated and trying to access protected route
  if (!user && !isPublicRoute) {
    return NextResponse.redirect(new URL('/auth/sign-in', request.url));
  }

  // Redirect to home if authenticated and trying to access auth pages
  if (user && isPublicRoute) {
    return NextResponse.redirect(new URL('/home', request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
}; 
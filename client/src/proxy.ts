import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  // Check for the presence of the jwt cookie
  const token = request.cookies.get('jwt')?.value;

  // Protect the dashboard routes
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    if (!token) {
      // If no token exists, redirect to login
      const loginUrl = new URL('/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Prevent logged-in users from accessing the auth pages (login, signup, etc)
  const authRoutes = ['/login', '/signup', '/forgot-password', '/reset-password'];
  if (authRoutes.some(route => request.nextUrl.pathname.startsWith(route))) {
    if (token) {
      // If token exists, redirect to dashboard
      const dashboardUrl = new URL('/dashboard', request.url);
      return NextResponse.redirect(dashboardUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/login',
    '/signup',
    '/forgot-password',
    '/reset-password',
  ],
};

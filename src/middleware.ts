import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const AUTH_COOKIE_NAME = 'vibe_pos_auth';

/**
 * Enterprise Route Protection Middleware
 * - Intercepts sensitive POS routes at the server/edge layer before rendering.
 * - Protects /, /admin, /cashier, /erp, /kds.
 * - Allows public routes: /login, /menu/:path* (QR table ordering), /api/..., and static assets.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Skip static assets, Next.js internal files, favicon, API routes, and public guest QR ordering
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/menu') ||
    pathname === '/favicon.ico' ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // 2. Validate authentication cookie
  const authCookie = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  let isAuthenticated = false;

  if (authCookie) {
    try {
      const parsed = JSON.parse(decodeURIComponent(authCookie));
      if (parsed && (parsed.id || parsed.username) && parsed.role) {
        isAuthenticated = true;
      }
    } catch {
      // Corrupted cookie: treat as unauthenticated
      isAuthenticated = false;
    }
  }

  // 3. Unauthenticated requests trying to access protected routes -> Redirect to /login
  if (!isAuthenticated) {
    if (pathname === '/login') {
      return NextResponse.next();
    }
    const loginUrl = new URL('/login', request.url);
    if (pathname !== '/') {
      loginUrl.searchParams.set('returnUrl', pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  // 4. Authenticated users visiting /login -> Redirect to POS Hub
  if (pathname === '/login') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/admin/:path*',
    '/cashier/:path*',
    '/erp/:path*',
    '/kds/:path*',
    '/login',
  ],
};

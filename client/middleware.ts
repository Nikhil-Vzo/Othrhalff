import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const maintenanceMode = process.env.MAINTENANCE_MODE === 'true';
  const isDev = process.env.NODE_ENV === 'development';
  
  // Bypass maintenance mode in local development (unless explicitly forced)
  const isLocalhost = request.nextUrl.hostname === 'localhost' || request.nextUrl.hostname === '127.0.0.1';
  const shouldBypass = isDev || isLocalhost;

  if (maintenanceMode && !shouldBypass) {
    const { pathname } = request.nextUrl;

    // Allow internal Next.js resources, static assets, API endpoints, and the maintenance page itself
    if (
      pathname.startsWith('/_next') ||
      pathname.startsWith('/api') ||
      pathname.startsWith('/static') ||
      pathname === '/maintenance' ||
      pathname.includes('.') // matches favicon.ico, images, fonts, etc.
    ) {
      return NextResponse.next();
    }

    // Redirect to /maintenance
    const url = request.nextUrl.clone();
    url.pathname = '/maintenance';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};

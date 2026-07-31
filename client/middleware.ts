import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const maintenanceMode = process.env.MAINTENANCE_MODE === 'true' || process.env.NEXT_PUBLIC_MAINTENANCE_MODE === 'true';

  if (maintenanceMode) {
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

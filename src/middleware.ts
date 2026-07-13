import { type NextRequest, NextResponse } from 'next/server';
import { isMaintenanceMode } from '@/lib/maintenance';
import { updateSession } from '@/lib/supabase-middleware';

function isMaintenancePassthrough(pathname: string): boolean {
  return (
    pathname === '/maintenance' ||
    pathname === '/robots.txt' ||
    pathname === '/icon' ||
    pathname.startsWith('/icon/') ||
    pathname === '/opengraph-image' ||
    pathname.startsWith('/opengraph-image/') ||
    pathname === '/twitter-image' ||
    pathname.startsWith('/twitter-image/')
  );
}

export async function middleware(request: NextRequest) {
  if (isMaintenanceMode()) {
    const { pathname } = request.nextUrl;

    // Allow the maintenance page + metadata images; rewrite every other
    // path so /rc, /projects, deep links, etc. all show the offline notice.
    if (isMaintenancePassthrough(pathname)) {
      return NextResponse.next();
    }

    const url = request.nextUrl.clone();
    url.pathname = '/maintenance';
    url.search = '';
    return NextResponse.rewrite(url);
  }

  return updateSession(request);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

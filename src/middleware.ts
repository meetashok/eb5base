import { type NextRequest, NextResponse } from 'next/server';
import {
  getMaintenanceBypassSecret,
  isMaintenanceMode,
  isValidMaintenanceBypassToken,
  MAINTENANCE_BYPASS_COOKIE,
} from '@/lib/maintenance';
import { updateSession } from '@/lib/supabase-middleware';

const BYPASS_MAX_AGE_SEC = 60 * 60 * 24 * 30; // 30 days

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

function setBypassCookie(response: NextResponse, secret: string, request: NextRequest) {
  response.cookies.set(MAINTENANCE_BYPASS_COOKIE, secret, {
    httpOnly: true,
    secure: request.nextUrl.protocol === 'https:',
    sameSite: 'lax',
    path: '/',
    maxAge: BYPASS_MAX_AGE_SEC,
  });
}

export async function middleware(request: NextRequest) {
  if (isMaintenanceMode()) {
    const { pathname } = request.nextUrl;
    const secret = getMaintenanceBypassSecret();
    const accessParam = request.nextUrl.searchParams.get('access');
    const bypassCookie = request.cookies.get(MAINTENANCE_BYPASS_COOKIE)?.value;
    const unlocked =
      isValidMaintenanceBypassToken(accessParam) ||
      isValidMaintenanceBypassToken(bypassCookie);

    // One-click unlock for owner/counsel: ?access=SECRET → set cookie, strip param.
    if (secret && isValidMaintenanceBypassToken(accessParam)) {
      const url = request.nextUrl.clone();
      url.searchParams.delete('access');
      if (!url.searchParams.toString()) {
        url.search = '';
      }
      const response = NextResponse.redirect(url);
      setBypassCookie(response, secret, request);
      return response;
    }

    if (unlocked) {
      return updateSession(request);
    }

    // Public: maintenance page + metadata images only.
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

import { type NextRequest, NextResponse } from 'next/server';
import {
  EB5BASE_ACCESS_COOKIE,
  getMaintenanceBypassSecret,
  isMaintenanceMode,
  isValidMaintenanceBypassToken,
  MAINTENANCE_BYPASS_COOKIE,
} from '@/lib/maintenance';
import { isNprmTabId, nprmTabHref } from '@/lib/nprm/tabs';
import { updateSession } from '@/lib/supabase-middleware';

const BYPASS_MAX_AGE_SEC = 60 * 60 * 24 * 30; // 30 days

function isMaintenancePassthrough(pathname: string): boolean {
  return (
    pathname === '/' ||
    pathname === '/maintenance' ||
    pathname === '/robots.txt' ||
    pathname === '/icon' ||
    pathname.startsWith('/icon/') ||
    pathname === '/opengraph-image' ||
    pathname.startsWith('/opengraph-image/') ||
    pathname === '/twitter-image' ||
    pathname.startsWith('/twitter-image/') ||
    // Public tools that should stay reachable during the directory pause.
    pathname === '/nprm' ||
    pathname.startsWith('/nprm/') ||
    pathname === '/nrpm' ||
    pathname.startsWith('/nrpm/') ||
    pathname === '/tracker' ||
    pathname.startsWith('/tracker/') ||
    pathname === '/status' ||
    pathname.startsWith('/status/') ||
    pathname === '/eb5status' ||
    pathname.startsWith('/eb5status/') ||
    pathname === '/about' ||
    pathname === '/resources' ||
    pathname.startsWith('/resources/') ||
    pathname === '/privacy' ||
    pathname === '/terms' ||
    pathname === '/contact' ||
    pathname === '/login' ||
    pathname.startsWith('/login/') ||
    pathname === '/auth' ||
    pathname.startsWith('/auth/')
  );
}

/** Legacy ?tab=comments → /nprm/comments (no leftover query). */
function redirectLegacyNprmTab(request: NextRequest): NextResponse | null {
  const { pathname } = request.nextUrl;
  if (pathname !== '/nprm' && pathname !== '/nprm/' && pathname !== '/nrpm' && pathname !== '/nrpm/') {
    return null;
  }
  const tab = request.nextUrl.searchParams.get('tab');
  if (!isNprmTabId(tab)) return null;

  const url = request.nextUrl.clone();
  url.pathname = nprmTabHref(tab);
  url.searchParams.delete('tab');
  if (!url.searchParams.toString()) {
    url.search = '';
  }
  return NextResponse.redirect(url);
}

function setBypassCookies(response: NextResponse, secret: string, request: NextRequest) {
  const secure = request.nextUrl.protocol === 'https:';
  response.cookies.set(MAINTENANCE_BYPASS_COOKIE, secret, {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/',
    maxAge: BYPASS_MAX_AGE_SEC,
  });
  // Non-httpOnly marker so client/share flows can see unlock state (review: eb5base_access=1).
  response.cookies.set(EB5BASE_ACCESS_COOKIE, '1', {
    httpOnly: false,
    secure,
    sameSite: 'lax',
    path: '/',
    maxAge: BYPASS_MAX_AGE_SEC,
  });
}

export async function middleware(request: NextRequest) {
  const legacyTab = redirectLegacyNprmTab(request);
  if (legacyTab) return legacyTab;

  if (isMaintenanceMode()) {
    const { pathname } = request.nextUrl;
    const secret = getMaintenanceBypassSecret();
    const accessParam = request.nextUrl.searchParams.get('access');
    const bypassCookie = request.cookies.get(MAINTENANCE_BYPASS_COOKIE)?.value;
    const unlocked =
      isValidMaintenanceBypassToken(accessParam) ||
      isValidMaintenanceBypassToken(bypassCookie);

    // One-click unlock for owner/counsel: ?access=SECRET → set cookies, strip param.
    if (secret && isValidMaintenanceBypassToken(accessParam)) {
      const url = request.nextUrl.clone();
      url.searchParams.delete('access');
      if (!url.searchParams.toString()) {
        url.search = '';
      }
      const response = NextResponse.redirect(url);
      setBypassCookies(response, secret, request);
      return response;
    }

    if (unlocked) {
      return updateSession(request);
    }

    // Public: maintenance page + metadata images + NPRM / status / tracker tools.
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

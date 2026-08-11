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

/**
 * Maintenance passthrough for public tools and crawler surfaces.
 * Intentionally does NOT inspect User-Agent: bots and browsers share the same SSR path.
 */
function isMaintenancePassthrough(pathname: string): boolean {
  return (
    pathname === '/' ||
    pathname === '/maintenance' ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml' ||
    pathname === '/llms.txt' ||
    pathname === '/debug' ||
    pathname.startsWith('/debug/') ||
    pathname === '/api/crawl-test' ||
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
    pathname === '/case-tracker' ||
    pathname === '/status' ||
    pathname.startsWith('/status/') ||
    pathname === '/status-update' ||
    pathname === '/eb5status' ||
    pathname.startsWith('/eb5status/') ||
    pathname === '/about' ||
    pathname === '/resources' ||
    pathname.startsWith('/resources/') ||
    pathname === '/privacy' ||
    pathname === '/terms' ||
    pathname === '/disclaimer' ||
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
  response.cookies.set(EB5BASE_ACCESS_COOKIE, '1', {
    httpOnly: false,
    secure,
    sameSite: 'lax',
    path: '/',
    maxAge: BYPASS_MAX_AGE_SEC,
  });
}

/**
 * Public surfaces that must never inspect User-Agent and should skip auth
 * session work so crawlers get the same fast HTML as browsers.
 */
function isCrawlFriendlyPublicPath(pathname: string): boolean {
  return (
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml' ||
    pathname === '/llms.txt' ||
    pathname === '/debug' ||
    pathname.startsWith('/debug/') ||
    pathname === '/api/crawl-test' ||
    pathname === '/nprm' ||
    pathname.startsWith('/nprm/') ||
    pathname === '/nrpm' ||
    pathname.startsWith('/nrpm/') ||
    pathname === '/icon' ||
    pathname.startsWith('/icon/') ||
    pathname === '/opengraph-image' ||
    pathname.startsWith('/opengraph-image/') ||
    pathname === '/twitter-image' ||
    pathname.startsWith('/twitter-image/')
  );
}

export async function middleware(request: NextRequest) {
  // No user-agent blocking. Crawlers receive the same HTML as browsers.
  const legacyTab = redirectLegacyNprmTab(request);
  if (legacyTab) return legacyTab;

  const { pathname } = request.nextUrl;

  // Static JSON/log under /data must stay public: NPRM SSR falls back to
  // HTTP when public/ is not on the serverless filesystem (Vercel).
  if (pathname.startsWith('/data/')) {
    return NextResponse.next();
  }

  if (isCrawlFriendlyPublicPath(pathname)) {
    // Skip Supabase session refresh on crawl/marketing surfaces.
    if (isMaintenanceMode() && !isMaintenancePassthrough(pathname)) {
      const url = request.nextUrl.clone();
      url.pathname = '/maintenance';
      url.search = '';
      return NextResponse.rewrite(url);
    }
    return NextResponse.next();
  }

  if (isMaintenanceMode()) {
    const secret = getMaintenanceBypassSecret();
    const accessParam = request.nextUrl.searchParams.get('access');
    const bypassCookie = request.cookies.get(MAINTENANCE_BYPASS_COOKIE)?.value;
    const unlocked =
      isValidMaintenanceBypassToken(accessParam) ||
      isValidMaintenanceBypassToken(bypassCookie);

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
    // Skip image + public data assets (json/log) so auth/maintenance never gate them.
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|json|log)$).*)',
  ],
};

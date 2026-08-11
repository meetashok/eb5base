import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { getSupabaseConfig, isSupabaseConfigured } from '@/lib/supabase-env';

const AUTH_ONLY_PREFIXES = ['/profile/setup'];

function isStaticOrApi(pathname: string): boolean {
  return (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    // First-party NPRM (and other) static datasets served from public/data.
    pathname.startsWith('/data/') ||
    pathname === '/favicon.ico' ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml' ||
    pathname === '/llms.txt' ||
    pathname === '/icon' ||
    pathname.startsWith('/icon/') ||
    pathname === '/opengraph-image' ||
    pathname.startsWith('/opengraph-image/') ||
    pathname === '/twitter-image' ||
    pathname.startsWith('/twitter-image/') ||
    /\.(?:svg|png|jpg|jpeg|gif|webp|txt|xml|json|log)$/.test(pathname)
  );
}

/** Browse + auth pages - no login required. */
function isPublicPath(pathname: string): boolean {
  if (
    [
      '/',
      '/about',
      '/resources',
      '/login',
      '/signup',
      '/privacy',
      '/terms',
      '/disclaimer',
      '/contact',
      '/rc',
      '/regional-centers',
      '/tracker',
      '/case-tracker',
      '/status',
      '/status-update',
      '/eb5status',
      '/nprm',
      '/maintenance',
      '/debug',
    ].includes(pathname)
  ) {
    return true;
  }
  if (pathname.startsWith('/auth')) return true;
  if (pathname.startsWith('/debug/')) return true;
  if (pathname.startsWith('/nprm/') || pathname.startsWith('/nrpm')) return true;
  if (pathname.startsWith('/status/') || pathname.startsWith('/eb5status/')) return true;
  if (pathname.startsWith('/resources/')) return true;

  // Brand browse/detail public; add form is public (auth gated client-side)
  if (pathname.startsWith('/rc/')) {
    if (pathname === '/rc/add' || pathname === '/rc/new') return true;
    if (pathname.endsWith('/edit')) return false;
    return true;
  }

  if (pathname.startsWith('/admin')) return false;

  // Legacy redirects stay public (they redirect to /rc)
  if (pathname.startsWith('/regional-centers')) return true;

  // Project list + detail are public; add form is public (auth gated client-side)
  if (pathname === '/projects') return true;
  if (pathname.startsWith('/projects/')) {
    if (pathname === '/projects/add' || pathname === '/projects/new') return true;
    if (pathname.endsWith('/edit')) return false;
    return true;
  }

  return false;
}

function isTrackerAppPath(pathname: string): boolean {
  return (
    pathname.startsWith('/tracker/timeline') ||
    pathname.startsWith('/tracker/insights') ||
    pathname.startsWith('/tracker/settings') ||
    pathname.startsWith('/tracker/onboarding')
  );
}

function isTrackerOnboardingPath(pathname: string): boolean {
  return pathname === '/tracker/onboarding' || pathname.startsWith('/tracker/onboarding/');
}

function needsProfileSetup(profile: { profile_completed?: boolean | null; role?: string | null } | null): boolean {
  return !profile?.profile_completed || !profile?.role;
}

function isAuthOnlyPath(pathname: string): boolean {
  return AUTH_ONLY_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + '/')
  );
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  if (!isSupabaseConfigured()) {
    return supabaseResponse;
  }

  const { url, key } = getSupabaseConfig();

  const supabase = createServerClient(
    url,
    key,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  if (isStaticOrApi(pathname) || isPublicPath(pathname)) {
    return supabaseResponse;
  }

  if (!user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Case Tracker app: gate on case-tracker onboarding, not directory profile setup.
  if (isTrackerAppPath(pathname)) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarding_complete')
      .eq('id', user.id)
      .maybeSingle();

    const onboardingComplete = Boolean(profile?.onboarding_complete);

    if (!onboardingComplete && !isTrackerOnboardingPath(pathname)) {
      const setupUrl = request.nextUrl.clone();
      setupUrl.pathname = '/tracker/onboarding';
      setupUrl.search = '';
      return NextResponse.redirect(setupUrl);
    }

    if (onboardingComplete && isTrackerOnboardingPath(pathname)) {
      const timelineUrl = request.nextUrl.clone();
      timelineUrl.pathname = '/tracker/timeline';
      timelineUrl.search = '';
      return NextResponse.redirect(timelineUrl);
    }

    return supabaseResponse;
  }

  if (isAuthOnlyPath(pathname)) {
    return supabaseResponse;
  }

  if (pathname.startsWith('/admin')) {
    const { data: adminProfile } = await supabase
      .from('profiles')
      .select('is_admin, profile_completed, role')
      .eq('id', user.id)
      .maybeSingle();

    if (needsProfileSetup(adminProfile)) {
      const setupUrl = request.nextUrl.clone();
      setupUrl.pathname = '/profile/setup';
      setupUrl.search = '';
      return NextResponse.redirect(setupUrl);
    }

    if (!adminProfile?.is_admin) {
      const profileUrl = request.nextUrl.clone();
      profileUrl.pathname = '/profile';
      profileUrl.search = '';
      return NextResponse.redirect(profileUrl);
    }

    return supabaseResponse;
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('profile_completed, role')
    .eq('id', user.id)
    .maybeSingle();

  if (needsProfileSetup(profile)) {
    const setupUrl = request.nextUrl.clone();
    setupUrl.pathname = '/profile/setup';
    setupUrl.search = '';
    return NextResponse.redirect(setupUrl);
  }

  return supabaseResponse;
}

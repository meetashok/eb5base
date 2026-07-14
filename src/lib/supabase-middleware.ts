import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { getSupabaseConfig, isSupabaseConfigured } from '@/lib/supabase-env';

function isStaticOrApi(pathname: string): boolean {
  return (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname === '/favicon.ico' ||
    pathname === '/robots.txt' ||
    /\.(?:svg|png|jpg|jpeg|gif|webp)$/.test(pathname)
  );
}

/** Public pages — no login required. */
function isPublicPath(pathname: string): boolean {
  if (
    ['/', '/about', '/login', '/signup', '/privacy', '/terms', '/contact'].includes(pathname)
  ) {
    return true;
  }
  if (pathname.startsWith('/auth')) return true;
  return false;
}

function isOnboardingPath(pathname: string): boolean {
  return pathname === '/onboarding' || pathname.startsWith('/onboarding/');
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  if (!isSupabaseConfigured()) {
    return supabaseResponse;
  }

  const { url, key } = getSupabaseConfig();

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Legacy redirects from directory-era routes
  if (
    pathname.startsWith('/projects') ||
    pathname.startsWith('/rc') ||
    pathname.startsWith('/regional-centers') ||
    pathname.startsWith('/admin')
  ) {
    const home = request.nextUrl.clone();
    home.pathname = '/';
    home.search = '';
    return NextResponse.redirect(home);
  }

  if (pathname === '/profile' || pathname.startsWith('/profile/')) {
    const dest = request.nextUrl.clone();
    dest.pathname = pathname.startsWith('/profile/setup') ? '/onboarding' : '/settings';
    dest.search = '';
    return NextResponse.redirect(dest);
  }

  if (isStaticOrApi(pathname) || isPublicPath(pathname)) {
    return supabaseResponse;
  }

  if (!user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('onboarding_complete')
    .eq('id', user.id)
    .maybeSingle();

  const onboardingComplete = Boolean(profile?.onboarding_complete);

  if (!onboardingComplete && !isOnboardingPath(pathname)) {
    const setupUrl = request.nextUrl.clone();
    setupUrl.pathname = '/onboarding';
    setupUrl.search = '';
    return NextResponse.redirect(setupUrl);
  }

  if (onboardingComplete && isOnboardingPath(pathname)) {
    const timelineUrl = request.nextUrl.clone();
    timelineUrl.pathname = '/timeline';
    timelineUrl.search = '';
    return NextResponse.redirect(timelineUrl);
  }

  return supabaseResponse;
}

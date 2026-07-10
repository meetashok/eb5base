import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const AUTH_ONLY_PREFIXES = ['/profile/setup'];

function isStaticOrApi(pathname: string): boolean {
  return (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname === '/favicon.ico' ||
    pathname === '/robots.txt' ||
    /\.(?:svg|png|jpg|jpeg|gif|webp)$/.test(pathname)
  );
}

/** Browse + auth pages — no login required. */
function isPublicPath(pathname: string): boolean {
  if (
    [
      '/',
      '/about',
      '/login',
      '/signup',
      '/privacy',
      '/contact',
      '/regional-centers',
    ].includes(pathname)
  ) {
    return true;
  }
  if (pathname.startsWith('/auth')) return true;
  if (pathname.startsWith('/regional-centers/')) return true;
  if (pathname.startsWith('/rc/')) return true;

  // Project list + detail are public; create/edit require auth + completed profile
  if (pathname === '/projects') return true;
  if (pathname.startsWith('/projects/')) {
    if (pathname === '/projects/new') return false;
    if (pathname.endsWith('/edit')) return false;
    return true;
  }

  return false;
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

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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

  if (isAuthOnlyPath(pathname)) {
    return supabaseResponse;
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('profile_completed')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile?.profile_completed) {
    const setupUrl = request.nextUrl.clone();
    setupUrl.pathname = '/profile/setup';
    setupUrl.search = '';
    return NextResponse.redirect(setupUrl);
  }

  return supabaseResponse;
}

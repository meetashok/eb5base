import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { getSupabaseConfig, isSupabaseConfigured } from '@/lib/supabase-env';
import { avatarFromAuthUser } from '@/lib/profile-avatar';
import { PREVIEW_DENIED_MESSAGE, isPreviewAllowed } from '@/lib/tracker/preview';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  // Default to directory profile setup; Case Tracker login passes /tracker/... via `next`
  let next = searchParams.get('next') ?? '/profile/setup';
  if (!next.startsWith('/')) next = '/profile/setup';

  if (!isSupabaseConfigured()) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent('Supabase is not configured. Add your project URL and anon key to .env.local.')}`
    );
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=auth`);
  }

  const cookieStore = cookies();
  const { url, key } = getSupabaseConfig();
  const forwardedHost = request.headers.get('x-forwarded-host');

  const buildUrl = (path: string) =>
    process.env.NODE_ENV === 'development'
      ? `${origin}${path}`
      : forwardedHost
        ? `https://${forwardedHost}${path}`
        : `${origin}${path}`;

  const redirectResponse = NextResponse.redirect(buildUrl(next));

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options);
          redirectResponse.cookies.set(name, value, options);
        });
      },
    },
  });

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    console.error('OAuth exchange failed:', error.message);
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(error.message)}`
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Private-preview gate: only allowlisted emails may hold a session while the
  // Case Tracker is invite-only. Everyone else is signed back out immediately.
  if (user && !isPreviewAllowed(user.email)) {
    const denied = NextResponse.redirect(
      buildUrl(`/login?error=${encodeURIComponent(PREVIEW_DENIED_MESSAGE)}`),
    );
    const signOutClient = createServerClient(url, key, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            denied.cookies.set(name, value, options);
          });
        },
      },
    });
    await signOutClient.auth.signOut();
    return denied;
  }

  if (user) {
    const avatar = avatarFromAuthUser(user);
    if (avatar) {
      await supabase.from('profiles').update({ avatar_url: avatar }).eq('id', user.id);
    }

    const isTrackerFlow = next.startsWith('/tracker');
    if (isTrackerFlow) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_complete')
        .eq('id', user.id)
        .maybeSingle();

      let resolvedNext = next;
      if (profile?.onboarding_complete) {
        if (next === '/tracker/onboarding' || next.startsWith('/tracker/onboarding')) {
          resolvedNext = '/tracker/timeline';
        }
      } else {
        resolvedNext = '/tracker/onboarding';
      }

      if (resolvedNext !== next) {
        const finalResponse = NextResponse.redirect(buildUrl(resolvedNext));
        redirectResponse.cookies.getAll().forEach((c) => {
          finalResponse.cookies.set(c.name, c.value);
        });
        return finalResponse;
      }
    }
  }

  return redirectResponse;
}

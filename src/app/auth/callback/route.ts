import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { getSupabaseConfig, isSupabaseConfigured } from '@/lib/supabase-env';
import { avatarFromAuthUser } from '@/lib/profile-avatar';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  let next = searchParams.get('next') ?? '/onboarding';
  if (!next.startsWith('/')) next = '/onboarding';
  if (next.startsWith('/profile/setup')) next = '/onboarding';
  if (next === '/profile') next = '/settings';

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

  if (user) {
    const avatar = avatarFromAuthUser(user);
    if (avatar) {
      await supabase.from('profiles').update({ avatar_url: avatar }).eq('id', user.id);
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarding_complete')
      .eq('id', user.id)
      .maybeSingle();

    let resolvedNext = next;
    if (profile?.onboarding_complete) {
      if (next === '/onboarding' || next.startsWith('/onboarding')) {
        resolvedNext = '/timeline';
      }
    } else {
      resolvedNext = '/onboarding';
    }

    if (resolvedNext !== next) {
      const finalResponse = NextResponse.redirect(buildUrl(resolvedNext));
      redirectResponse.cookies.getAll().forEach((c) => {
        finalResponse.cookies.set(c.name, c.value);
      });
      return finalResponse;
    }
  }

  return redirectResponse;
}

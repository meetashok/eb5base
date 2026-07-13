import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { getSupabaseConfig, isSupabaseConfigured } from '@/lib/supabase-env';
import { avatarFromAuthUser } from '@/lib/profile-avatar';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  // Default to setup; the setup page sends completed profiles home
  let next = searchParams.get('next') ?? '/profile/setup';
  if (!next.startsWith('/')) next = '/profile/setup';

  if (!isSupabaseConfigured()) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent('Supabase is not configured. Add your project URL and anon key to .env.local.')}`
    );
  }

  if (code) {
    const cookieStore = cookies();
    const { url, key } = getSupabaseConfig();
    const forwardedHost = request.headers.get('x-forwarded-host');
    const redirectUrl =
      process.env.NODE_ENV === 'development'
        ? `${origin}${next}`
        : forwardedHost
          ? `https://${forwardedHost}${next}`
          : `${origin}${next}`;

    const redirectResponse = NextResponse.redirect(redirectUrl);

    const supabase = createServerClient(
      url,
      key,
      {
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
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const avatar = avatarFromAuthUser(user);
      if (user && avatar) {
        await supabase.from('profiles').update({ avatar_url: avatar }).eq('id', user.id);
      }
      return redirectResponse;
    }

    console.error('OAuth exchange failed:', error.message);
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(error.message)}`
    );
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}

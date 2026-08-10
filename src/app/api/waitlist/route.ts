import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { getSupabaseConfig, isSupabaseConfigured } from '@/lib/supabase-env';
import { createServiceClient } from '@/lib/supabase-service';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SOURCES = new Set(['home', 'tracker', 'unknown']);

function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

function getWaitlistClient() {
  if (process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) {
    return createServiceClient();
  }
  const { url, key } = getSupabaseConfig();
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: 'Waitlist is temporarily unavailable. Email hello@eb5base.com instead.' },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const emailRaw =
    typeof body === 'object' && body && 'email' in body
      ? String((body as { email?: unknown }).email ?? '')
      : '';
  const sourceRaw =
    typeof body === 'object' && body && 'source' in body
      ? String((body as { source?: unknown }).source ?? 'unknown')
      : 'unknown';

  const email = emailRaw.trim();
  const emailNormalized = normalizeEmail(email);
  const source = SOURCES.has(sourceRaw) ? sourceRaw : 'unknown';

  if (!emailNormalized || !EMAIL_RE.test(emailNormalized) || emailNormalized.length > 254) {
    return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
  }

  try {
    const supabase = getWaitlistClient();
    const { error } = await supabase.from('case_tracker_waitlist').insert({
      email,
      email_normalized: emailNormalized,
      source,
    });

    if (error) {
      // Already subscribed - treat as success.
      if (error.code === '23505') {
        return NextResponse.json({ ok: true, already: true });
      }
      console.error('[waitlist]', error.code, error.message);
      return NextResponse.json(
        { error: 'Could not save your email. Try again in a moment.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[waitlist]', err);
    return NextResponse.json(
      { error: 'Could not save your email. Try again in a moment.' },
      { status: 500 }
    );
  }
}

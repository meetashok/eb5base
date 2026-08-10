import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-service';
import { isSupabaseConfigured } from '@/lib/supabase-env';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SOURCES = new Set(['home', 'tracker', 'unknown']);

function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: 'Waitlist is temporarily unavailable. Email hello@eb5base.com instead.' },
      { status: 503 }
    );
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) {
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
    const supabase = createServiceClient();
    const { error } = await supabase.from('case_tracker_waitlist').upsert(
      {
        email,
        email_normalized: emailNormalized,
        source,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'email_normalized', ignoreDuplicates: false }
    );

    if (error) {
      console.error('[waitlist]', error.message);
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

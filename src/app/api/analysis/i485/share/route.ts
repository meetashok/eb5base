import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import {
  generateShareId,
  prefsToSharePayload,
  sharePayloadToPrefs,
  shortShareUrl,
  type I485SharePayload,
} from '@/lib/analysis/i485ShareParams';
import { getSupabaseConfig, isSupabaseConfigured } from '@/lib/supabase-env';
import { createServiceClient } from '@/lib/supabase-service';

export const runtime = 'nodejs';

const MAX_PAYLOAD_BYTES = 8_000;

function getShareClient() {
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
      { error: 'Sharing is temporarily unavailable.' },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const parsed = sharePayloadToPrefs(body);
  if (!parsed) {
    return NextResponse.json({ error: 'Invalid share payload.' }, { status: 400 });
  }

  const payload: I485SharePayload = prefsToSharePayload(parsed.prefs, parsed.hide);
  const encoded = JSON.stringify(payload);
  if (encoded.length > MAX_PAYLOAD_BYTES) {
    return NextResponse.json({ error: 'Share payload is too large.' }, { status: 413 });
  }

  try {
    const supabase = getShareClient();
    let id = generateShareId();
    let inserted = false;

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const { error } = await supabase.from('i485_shares').insert({
        id,
        view: payload.view,
        payload,
      });
      if (!error) {
        inserted = true;
        break;
      }
      if (error.code === '23505') {
        id = generateShareId();
        continue;
      }
      console.error('[i485-share]', error.code, error.message);
      return NextResponse.json(
        { error: 'Could not create share link. Try again in a moment.' },
        { status: 500 },
      );
    }

    if (!inserted) {
      return NextResponse.json(
        { error: 'Could not create share link. Try again in a moment.' },
        { status: 500 },
      );
    }

    return NextResponse.json({
      ok: true,
      id,
      url: shortShareUrl(id),
      path: `/analysis/i485/s/${id}`,
    });
  } catch (err) {
    console.error('[i485-share]', err);
    return NextResponse.json(
      { error: 'Could not create share link. Try again in a moment.' },
      { status: 500 },
    );
  }
}

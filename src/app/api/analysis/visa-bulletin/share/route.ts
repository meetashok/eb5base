import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import {
  generateShareId,
  parseSharePayload,
  shortSharePath,
  shortShareUrl,
} from '@/lib/analysis/visaBulletinShareParams';
import { getSupabaseConfig, isSupabaseConfigured } from '@/lib/supabase-env';
import { createServiceClient } from '@/lib/supabase-service';

export const runtime = 'nodejs';

const MAX_PAYLOAD_BYTES = 4_000;

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
    return NextResponse.json({ error: 'Sharing is temporarily unavailable.' }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const payload = parseSharePayload(body);
  if (!payload) {
    return NextResponse.json({ error: 'Invalid share payload.' }, { status: 400 });
  }

  if (JSON.stringify(payload).length > MAX_PAYLOAD_BYTES) {
    return NextResponse.json({ error: 'Share payload is too large.' }, { status: 413 });
  }

  try {
    const supabase = getShareClient();
    let id = generateShareId();
    let inserted = false;

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const { error } = await supabase.from('visa_bulletin_shares').insert({ id, payload });
      if (!error) {
        inserted = true;
        break;
      }
      if (error.code === '23505') {
        id = generateShareId();
        continue;
      }
      console.error('[vb-share]', error.code, error.message);
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

    return NextResponse.json({ ok: true, id, url: shortShareUrl(id), path: shortSharePath(id) });
  } catch (err) {
    console.error('[vb-share]', err);
    return NextResponse.json(
      { error: 'Could not create share link. Try again in a moment.' },
      { status: 500 },
    );
  }
}

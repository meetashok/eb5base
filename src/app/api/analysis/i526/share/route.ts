import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import {
  chartPathWithParams,
  generateShareId,
  makeSharePayload,
  parseSharePayload,
  shortShareUrl,
  type I526SharePayload,
} from '@/lib/analysis/i526ShareParams';
import { getSupabaseConfig, isSupabaseConfigured } from '@/lib/supabase-env';
import { createServiceClient } from '@/lib/supabase-service';
import { SITE_URL } from '@/lib/constants';

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
    // Fallback: no Supabase, we can't mint short URLs but share still works with long URL.
    return NextResponse.json(
      { error: 'Short share unavailable; using long link.' },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const parsed = parseSharePayload(body);
  if (!parsed) {
    return NextResponse.json({ error: 'Invalid share payload.' }, { status: 400 });
  }

  const payload: I526SharePayload = makeSharePayload(parsed);
  const encoded = JSON.stringify(payload);
  if (encoded.length > MAX_PAYLOAD_BYTES) {
    return NextResponse.json({ error: 'Share payload is too large.' }, { status: 413 });
  }

  try {
    const supabase = getShareClient();
    let id = generateShareId();
    let inserted = false;

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const { error } = await supabase.from('i526_shares').insert({
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
      // Table does not exist (42P01) or other non-dup error: fall back to long URL in share button client.
      if (error.code === '42P01') {
        break;
      }
      console.error('[i526-share]', error.code, error.message);
      break;
    }

    if (inserted) {
      return NextResponse.json({
        ok: true,
        id,
        url: shortShareUrl(id),
        path: `/analysis/i526/s/${id}`,
      });
    }

    // Fallback: return a long-form canonical link so client can still copy/share it.
    const longUrl = `${SITE_URL}${chartPathWithParams(payload)}`;
    return NextResponse.json({
      ok: true,
      url: longUrl,
    });
  } catch (err) {
    console.error('[i526-share]', err);
    const longUrl = `${SITE_URL}${chartPathWithParams(payload)}`;
    return NextResponse.json({
      ok: true,
      url: longUrl,
    });
  }
}

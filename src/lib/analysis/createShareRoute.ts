import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { generateShareId } from '@/lib/analysis/shareId';
import { getSupabaseConfig, isSupabaseConfigured } from '@/lib/supabase-env';
import { createServiceClient } from '@/lib/supabase-service';

function getShareClient() {
  if (process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) {
    return createServiceClient();
  }
  const { url, key } = getSupabaseConfig();
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Build a POST handler that mints a short share link for an analysis view.
 * Each dataset supplies its table, payload validation, row shape, and URL
 * helpers - the retry/collision/error handling is shared.
 */
export function createShareRoute<TPayload>({
  table,
  logTag,
  parsePayload,
  buildRow,
  shortPath,
  shortUrl,
  maxBytes = 8_000,
  fallbackUrl,
}: {
  table: string;
  logTag: string;
  parsePayload: (body: unknown) => TPayload | null;
  buildRow: (id: string, payload: TPayload) => Record<string, unknown>;
  shortPath: (id: string) => string;
  shortUrl: (id: string) => string;
  maxBytes?: number;
  /** When set, failure returns { ok, url: long-form link } instead of an error. */
  fallbackUrl?: (payload: TPayload) => string;
}) {
  return async function POST(request: Request) {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: 'Sharing is temporarily unavailable.' }, { status: 503 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
    }

    const payload = parsePayload(body);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid share payload.' }, { status: 400 });
    }

    if (JSON.stringify(payload).length > maxBytes) {
      return NextResponse.json({ error: 'Share payload is too large.' }, { status: 413 });
    }

    try {
      const supabase = getShareClient();
      let id = generateShareId();
      let inserted = false;

      for (let attempt = 0; attempt < 5; attempt += 1) {
        const { error } = await supabase.from(table).insert(buildRow(id, payload));
        if (!error) {
          inserted = true;
          break;
        }
        if (error.code === '23505') {
          id = generateShareId();
          continue;
        }
        // 42P01 = table missing; other codes are unexpected. Stop and use fallback.
        if (error.code !== '42P01') console.error(`[${logTag}]`, error.code, error.message);
        break;
      }

      if (inserted) {
        return NextResponse.json({ ok: true, id, url: shortUrl(id), path: shortPath(id) });
      }
      if (fallbackUrl) {
        return NextResponse.json({ ok: true, url: fallbackUrl(payload) });
      }
      return NextResponse.json(
        { error: 'Could not create share link. Try again in a moment.' },
        { status: 500 },
      );
    } catch (err) {
      console.error(`[${logTag}]`, err);
      if (fallbackUrl) {
        return NextResponse.json({ ok: true, url: fallbackUrl(payload) });
      }
      return NextResponse.json(
        { error: 'Could not create share link. Try again in a moment.' },
        { status: 500 },
      );
    }
  };
}

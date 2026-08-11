import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { getSupabaseConfig, isSupabaseConfigured } from '@/lib/supabase-env';
import { createServiceClient } from '@/lib/supabase-service';

function getReadClient() {
  if (process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) {
    return createServiceClient();
  }
  const { url, key } = getSupabaseConfig();
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function getWriteClient() {
  // Increments must use the service role (RPC is not granted to anon).
  return createServiceClient();
}

async function readCopyCount(): Promise<number | null> {
  const supabase = getReadClient();
  const { data, error } = await supabase
    .from('nprm_prompt_stats')
    .select('copy_count')
    .eq('id', 1)
    .maybeSingle();

  if (error) {
    console.error('[nprm/prompt-use] read', error.code, error.message);
    return null;
  }
  const n = data?.copy_count;
  return typeof n === 'number' ? n : n != null ? Number(n) : 0;
}

/** Public aggregate: how many browsers have copied an NPRM prompt. */
export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ copy_count: null, available: false });
  }

  try {
    const copy_count = await readCopyCount();
    if (copy_count == null) {
      return NextResponse.json(
        { error: 'Could not load prompt-use count.' },
        { status: 500 }
      );
    }
    return NextResponse.json({ copy_count, available: true });
  } catch (err) {
    console.error('[nprm/prompt-use] GET', err);
    return NextResponse.json(
      { error: 'Could not load prompt-use count.' },
      { status: 500 }
    );
  }
}

/**
 * Increment once per successful client-side dedupe.
 * Body optional; no PII accepted.
 */
export async function POST() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: 'Prompt-use counter is temporarily unavailable.' },
      { status: 503 }
    );
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) {
    console.error('[nprm/prompt-use] missing SUPABASE_SERVICE_ROLE_KEY');
    return NextResponse.json(
      { error: 'Prompt-use counter is temporarily unavailable.' },
      { status: 503 }
    );
  }

  try {
    const supabase = getWriteClient();
    const { data, error } = await supabase.rpc('increment_nprm_prompt_copies');

    if (error) {
      console.error('[nprm/prompt-use] increment', error.code, error.message);
      return NextResponse.json(
        { error: 'Could not record prompt use.' },
        { status: 500 }
      );
    }

    const copy_count =
      typeof data === 'number' ? data : data != null ? Number(data) : null;

    return NextResponse.json({
      ok: true,
      copy_count: Number.isFinite(copy_count as number) ? copy_count : null,
    });
  } catch (err) {
    console.error('[nprm/prompt-use] POST', err);
    return NextResponse.json(
      { error: 'Could not record prompt use.' },
      { status: 500 }
    );
  }
}

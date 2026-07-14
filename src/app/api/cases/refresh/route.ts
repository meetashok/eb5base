import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { pollCases } from '@/lib/uscis/poller';

export async function POST() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('last_manual_refresh_at')
    .eq('id', user.id)
    .maybeSingle();

  const last = profile?.last_manual_refresh_at
    ? new Date(profile.last_manual_refresh_at).getTime()
    : 0;
  const hour = 60 * 60 * 1000;
  if (Date.now() - last < hour) {
    const retryAt = new Date(last + hour).toISOString();
    return NextResponse.json(
      { error: 'Rate limited', retryAt, message: 'You can check status once per hour.' },
      { status: 429 }
    );
  }

  if (!process.env.RECEIPT_ENCRYPTION_KEY || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json(
      { error: 'Server is missing encryption or service role configuration' },
      { status: 503 }
    );
  }

  try {
    const result = await pollCases({ userId: user.id });
    await supabase
      .from('profiles')
      .update({ last_manual_refresh_at: new Date().toISOString() })
      .eq('id', user.id);

    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error('refresh failed', err);
    return NextResponse.json({ error: 'Refresh failed' }, { status: 500 });
  }
}

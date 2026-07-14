import { NextResponse } from 'next/server';

function authorizeCron(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    return process.env.NODE_ENV !== 'production';
  }
  const auth = request.headers.get('authorization');
  return auth === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!authorizeCron(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { sendPendingDigests } = await import('@/lib/uscis/poller');
    const result = await sendPendingDigests();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error('digest cron failed', err);
    return NextResponse.json({ error: 'Digest failed' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  return GET(request);
}

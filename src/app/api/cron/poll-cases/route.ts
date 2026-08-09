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
    const { pollCases } = await import('@/lib/uscis/poller');
    const result = await pollCases();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error('cron poll failed', err);
    return NextResponse.json({ error: 'Poll failed' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  return GET(request);
}

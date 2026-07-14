import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createServiceClient } from '@/lib/supabase-service';
import { decryptReceiptNumber, maskReceiptNumber } from '@/lib/crypto/receipts';
import { writeAuditLog } from '@/lib/audit';

export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [{ data: profile }, { data: individuals }, { data: cases }, { data: wom }] =
    await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
      supabase.from('individuals').select('*').eq('user_id', user.id).order('display_order'),
      supabase.from('cases').select('*').eq('user_id', user.id),
      supabase.from('wom_cases').select('*').eq('user_id', user.id),
    ]);

  const caseIds = (cases || []).map((c) => c.id);
  let history: unknown[] = [];
  if (caseIds.length) {
    const { data: hist } = await supabase
      .from('case_status_history')
      .select('*')
      .in('case_id', caseIds)
      .order('detected_at', { ascending: false });
    history = hist || [];
  }

  const decryptedCases = [];
  for (const c of cases || []) {
    let receipt = '';
    try {
      receipt = decryptReceiptNumber(c.receipt_number_encrypted);
    } catch {
      receipt = '';
    }
    const { receipt_number_encrypted: _enc, ...rest } = c;
    void _enc;
    decryptedCases.push({
      ...rest,
      receipt_number: receipt,
      receipt_number_masked: receipt ? maskReceiptNumber(receipt) : null,
    });
  }

  await writeAuditLog({
    action: 'export_data',
    actor: 'user_session',
    userId: user.id,
  });

  const payload = {
    exported_at: new Date().toISOString(),
    profile,
    individuals,
    cases: decryptedCases,
    case_status_history: history,
    wom_cases: wom,
  };

  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="eb5base-export-${user.id.slice(0, 8)}.json"`,
    },
  });
}

export async function DELETE() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await writeAuditLog({
    action: 'delete_account',
    actor: 'user_session',
    userId: user.id,
  });

  // Cascade deletes via FKs when profile is removed; also remove auth user via service role
  const service = createServiceClient();

  // Delete profile (cascades to individuals, cases, history, wom)
  await service.from('profiles').delete().eq('id', user.id);

  try {
    await service.auth.admin.deleteUser(user.id);
  } catch (err) {
    console.error('auth delete failed', err);
  }

  return NextResponse.json({ ok: true });
}

import { createClient } from '@/lib/supabase-server';
import {
  decryptReceiptNumber,
  encryptReceiptNumber,
  extractServiceCenter,
  maskReceiptNumber,
} from '@/lib/crypto/receipts';
import { writeAuditLog } from '@/lib/audit';
import type {
  CaseStatusHistory,
  CaseWithReceipt,
  FormType,
  IndividualWithCases,
  Profile,
  WomCase,
} from '@/lib/types';

export async function getSessionUser() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function getOwnProfile(): Promise<Profile | null> {
  const { supabase, user } = await getSessionUser();
  if (!user) return null;
  const { data } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
  return data as Profile | null;
}

export async function loadTimelineData(userId: string): Promise<{
  individuals: IndividualWithCases[];
  historyByCase: Record<string, CaseStatusHistory[]>;
  wom: WomCase[];
  profile: Profile | null;
}> {
  const supabase = createClient();

  const [{ data: profile }, { data: individuals }, { data: cases }, { data: wom }] =
    await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
      supabase
        .from('individuals')
        .select('*')
        .eq('user_id', userId)
        .order('display_order', { ascending: true }),
      supabase.from('cases').select('*').eq('user_id', userId),
      supabase.from('wom_cases').select('*').eq('user_id', userId),
    ]);

  const caseIds = (cases || []).map((c) => c.id);
  let history: CaseStatusHistory[] = [];
  if (caseIds.length) {
    const { data: hist } = await supabase
      .from('case_status_history')
      .select('*')
      .in('case_id', caseIds)
      .order('detected_at', { ascending: false });
    history = (hist || []) as CaseStatusHistory[];
  }

  const historyByCase: Record<string, CaseStatusHistory[]> = {};
  for (const h of history) {
    (historyByCase[h.case_id] ||= []).push(h);
  }

  const casesWithReceipt: CaseWithReceipt[] = [];
  for (const c of cases || []) {
    let receipt = '';
    try {
      receipt = decryptReceiptNumber(c.receipt_number_encrypted);
      await writeAuditLog({
        action: 'decrypt',
        actor: 'user_session',
        userId,
        metadata: { case_id: c.id, reason: 'timeline_display' },
      });
    } catch {
      receipt = '';
    }
    const { receipt_number_encrypted: _enc, ...rest } = c;
    void _enc;
    casesWithReceipt.push({
      ...rest,
      form_type: c.form_type as FormType,
      receipt_number: receipt,
      receipt_number_masked: receipt ? maskReceiptNumber(receipt) : 'XXXXXXXXXXXXX',
    });
  }

  const individualsWithCases: IndividualWithCases[] = (individuals || []).map((ind) => ({
    ...ind,
    cases: casesWithReceipt
      .filter((c) => c.individual_id === ind.id)
      .sort((a, b) => a.form_type.localeCompare(b.form_type)),
  }));

  return {
    individuals: individualsWithCases,
    historyByCase,
    wom: (wom || []) as WomCase[],
    profile: profile as Profile | null,
  };
}

export function encryptCaseReceipt(receipt: string): {
  encrypted: string;
  serviceCenter: string | null;
} {
  const normalized = receipt.trim().toUpperCase();
  return {
    encrypted: encryptReceiptNumber(normalized),
    serviceCenter: extractServiceCenter(normalized),
  };
}

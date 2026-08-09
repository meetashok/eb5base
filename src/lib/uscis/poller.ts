import { decryptReceiptNumber, maskReceiptNumber } from '@/lib/crypto/receipts';
import { writeAuditLog } from '@/lib/audit';
import { getCaseStatus } from '@/lib/uscis/client';
import { sendImmediateStatusEmail } from '@/lib/email/resend';
import { createServiceClient } from '@/lib/supabase-service';
import { formatDate } from '@/lib/utils';

const DELAY_MS = 100;

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

type CasePollRow = {
  id: string;
  user_id: string;
  form_type: string;
  receipt_number_encrypted: string;
  current_status: string | null;
  individual_id: string;
};

export async function pollCases(options?: {
  userId?: string;
  caseIds?: string[];
}): Promise<{ checked: number; changed: number; errors: number }> {
  const supabase = createServiceClient();

  let query = supabase
    .from('cases')
    .select('id, user_id, form_type, receipt_number_encrypted, current_status, individual_id');

  if (options?.userId) {
    query = query.eq('user_id', options.userId);
  }
  if (options?.caseIds?.length) {
    query = query.in('id', options.caseIds);
  }

  const { data: cases, error } = await query;
  if (error) throw error;

  let checked = 0;
  let changed = 0;
  let errors = 0;

  const notifyQueue: Array<{
    userId: string;
    formType: string;
    receipt: string;
    previous: string;
    current: string;
    historyId: string;
    individualId: string;
  }> = [];

  for (const row of (cases || []) as CasePollRow[]) {
    checked += 1;
    let plaintext: string;
    try {
      plaintext = decryptReceiptNumber(row.receipt_number_encrypted);
      await writeAuditLog({
        action: 'decrypt',
        actor: 'system_poller',
        userId: row.user_id,
        metadata: { case_id: row.id, reason: 'poll' },
      });
    } catch {
      errors += 1;
      await supabase
        .from('cases')
        .update({
          poll_error: 'decrypt_failed',
          last_polled_at: new Date().toISOString(),
        })
        .eq('id', row.id);
      continue;
    }

    let result;
    try {
      result = await getCaseStatus(plaintext);
    } catch {
      errors += 1;
      await supabase
        .from('cases')
        .update({
          poll_error: 'upstream_error',
          last_polled_at: new Date().toISOString(),
        })
        .eq('id', row.id);
      await sleep(DELAY_MS);
      continue;
    }

    // Discard plaintext after API call (only keep masked for notifications)
    const masked = maskReceiptNumber(plaintext);
    plaintext = '';

    const now = new Date().toISOString();
    const statusText =
      result.error === 'not_found'
        ? 'Case not found. Please verify receipt number'
        : result.error === 'invalid'
          ? 'Invalid receipt number'
          : result.error === 'upstream'
            ? 'Unable to retrieve status'
            : result.status;

    const prev = row.current_status;
    const statusChanged = Boolean(statusText) && statusText !== prev;

    await supabase
      .from('cases')
      .update({
        current_status: statusText,
        status_updated_at: statusChanged ? now : undefined,
        last_polled_at: now,
        poll_error: result.error || null,
      })
      .eq('id', row.id);

    if (statusChanged) {
      changed += 1;
      const { data: hist } = await supabase
        .from('case_status_history')
        .insert({
          case_id: row.id,
          status: statusText,
          status_date: result.statusDate,
          detected_at: now,
          notified: false,
        })
        .select('id')
        .single();

      if (hist?.id) {
        notifyQueue.push({
          userId: row.user_id,
          formType: row.form_type,
          receipt: masked,
          previous: prev || 'n/a',
          current: statusText,
          historyId: hist.id,
          individualId: row.individual_id,
        });
      }
    } else if (!prev && statusText) {
      // First status: seed history without notifying as a "change"
      await supabase.from('case_status_history').insert({
        case_id: row.id,
        status: statusText,
        status_date: result.statusDate,
        detected_at: now,
        notified: true,
      });
    }

    await sleep(DELAY_MS);
  }

  // Notifications
  for (const item of notifyQueue) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, display_name, email_notifications, notify_mode')
      .eq('id', item.userId)
      .maybeSingle();

    if (!profile?.email_notifications) {
      await supabase
        .from('case_status_history')
        .update({ notified: true })
        .eq('id', item.historyId);
      continue;
    }

    if (profile.notify_mode === 'digest') {
      // Leave notified=false for digest cron
      continue;
    }

    try {
      await sendImmediateStatusEmail({
        to: profile.email || '',
        name: profile.display_name || 'there',
        formType: item.formType,
        receiptNumber: item.receipt,
        previousStatus: item.previous,
        currentStatus: item.current,
        updatedAt: formatDate(new Date().toISOString()),
      });
      await supabase
        .from('case_status_history')
        .update({ notified: true })
        .eq('id', item.historyId);
    } catch (err) {
      console.error('notify failed', err);
    }
  }

  return { checked, changed, errors };
}

export async function sendPendingDigests(): Promise<{ sent: number }> {
  const supabase = createServiceClient();

  const { data: pending } = await supabase
    .from('case_status_history')
    .select('id, case_id, status, cases!inner(user_id, form_type, receipt_number_encrypted, individual_id)')
    .eq('notified', false);

  if (!pending?.length) return { sent: 0 };

  type CaseJoin = {
    user_id: string;
    form_type: string;
    receipt_number_encrypted: string;
    individual_id: string;
  };

  type GroupItem = {
    historyIds: string[];
    lines: string[];
  };

  const byUser = new Map<string, GroupItem>();

  for (const row of pending) {
    const raw = row as {
      id: string;
      status: string;
      cases: CaseJoin | CaseJoin[];
    };
    const caseRow = Array.isArray(raw.cases) ? raw.cases[0] : raw.cases;
    if (!caseRow) continue;

    const userId = caseRow.user_id;
    let receiptMasked = 'XXXXXXXXXXXXX';
    try {
      const plain = decryptReceiptNumber(caseRow.receipt_number_encrypted);
      receiptMasked = maskReceiptNumber(plain);
      await writeAuditLog({
        action: 'decrypt',
        actor: 'system_poller',
        userId,
        metadata: { reason: 'digest_email' },
      });
    } catch {
      /* keep masked */
    }

    const { data: ind } = await supabase
      .from('individuals')
      .select('tag')
      .eq('id', caseRow.individual_id)
      .maybeSingle();

    const line = `${ind?.tag || 'Applicant'}:\n  ${caseRow.form_type} (${receiptMasked}): ${raw.status}`;

    const existing = byUser.get(userId) || { historyIds: [], lines: [] };
    existing.historyIds.push(raw.id);
    existing.lines.push(line);
    byUser.set(userId, existing);
  }

  let sent = 0;
  for (const [userId, group] of Array.from(byUser.entries())) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, display_name, email_notifications, notify_mode')
      .eq('id', userId)
      .maybeSingle();

    if (!profile?.email_notifications || profile.notify_mode !== 'digest' || !profile.email) {
      continue;
    }

    try {
      const { sendDigestEmail } = await import('@/lib/email/resend');
      await sendDigestEmail({
        to: profile.email,
        name: profile.display_name || 'there',
        changeCount: group.lines.length,
        lines: group.lines,
      });
      await supabase
        .from('case_status_history')
        .update({ notified: true })
        .in('id', group.historyIds);
      sent += 1;
    } catch (err) {
      console.error('digest failed', err);
    }
  }

  return { sent };
}

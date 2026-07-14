import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { encryptCaseReceipt } from '@/lib/cases';
import { isValidReceiptNumber } from '@/lib/receipt-validation';
import { writeAuditLog } from '@/lib/audit';
import type { FormType } from '@/lib/types';

export async function PATCH(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const allowed = [
    'project_name',
    'regional_center_name',
    'classification',
    'i956f_status',
    'i956f_approval_date',
    'country_of_birth',
    'attorney_name',
    'agent_name',
    'email_notifications',
    'notify_mode',
    'display_name',
  ] as const;

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const key of allowed) {
    if (key in body) patch[key] = body[key];
  }

  const { error } = await supabase.from('profiles').update(patch).eq('id', user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

/** Add individual / case / wom helpers via action field */
export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const action = body.action as string;

  if (action === 'add_individual') {
    const { count } = await supabase
      .from('individuals')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);
    const { data, error } = await supabase
      .from('individuals')
      .insert({
        user_id: user.id,
        tag: String(body.tag || 'Family member').trim(),
        is_primary: false,
        display_order: (count || 0) + 1,
      })
      .select('*')
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, individual: data });
  }

  if (action === 'update_individual') {
    const { error } = await supabase
      .from('individuals')
      .update({ tag: String(body.tag || '').trim() })
      .eq('id', body.id)
      .eq('user_id', user.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (action === 'delete_individual') {
    const { data: ind } = await supabase
      .from('individuals')
      .select('is_primary')
      .eq('id', body.id)
      .eq('user_id', user.id)
      .maybeSingle();
    if (ind?.is_primary) {
      return NextResponse.json({ error: 'Cannot remove the primary applicant' }, { status: 400 });
    }
    const { error } = await supabase
      .from('individuals')
      .delete()
      .eq('id', body.id)
      .eq('user_id', user.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (action === 'upsert_case') {
    const receiptNumber = String(body.receiptNumber || '').trim().toUpperCase();
    const formType = body.formType as FormType;
    if (!isValidReceiptNumber(receiptNumber)) {
      return NextResponse.json({ error: 'Invalid receipt number' }, { status: 400 });
    }
    const { encrypted, serviceCenter } = encryptCaseReceipt(receiptNumber);
    await writeAuditLog({
      action: 'encrypt',
      actor: 'user_session',
      userId: user.id,
      metadata: { form_type: formType },
    });

    if (body.caseId) {
      const { error } = await supabase
        .from('cases')
        .update({
          receipt_number_encrypted: encrypted,
          service_center: serviceCenter,
          form_type: formType,
          filed_date: body.filedDate || null,
        })
        .eq('id', body.caseId)
        .eq('user_id', user.id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    } else {
      const { error } = await supabase.from('cases').insert({
        individual_id: body.individualId,
        user_id: user.id,
        receipt_number_encrypted: encrypted,
        form_type: formType,
        service_center: serviceCenter,
        filed_date: body.filedDate || null,
      });
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  }

  if (action === 'delete_case') {
    const { error } = await supabase
      .from('cases')
      .delete()
      .eq('id', body.caseId)
      .eq('user_id', user.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (action === 'upsert_wom') {
    if (body.womId) {
      const { error } = await supabase
        .from('wom_cases')
        .update({
          related_form_type: body.relatedFormType,
          court_district: body.courtDistrict || null,
          filed_date: body.filedDate || null,
          wom_status: body.womStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', body.womId)
        .eq('user_id', user.id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    } else {
      const { error } = await supabase.from('wom_cases').insert({
        user_id: user.id,
        related_form_type: body.relatedFormType,
        court_district: body.courtDistrict || null,
        filed_date: body.filedDate || null,
        wom_status: body.womStatus,
      });
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  }

  if (action === 'delete_wom') {
    const { error } = await supabase
      .from('wom_cases')
      .delete()
      .eq('id', body.womId)
      .eq('user_id', user.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (action === 'mark_timeline_viewed') {
    await supabase
      .from('profiles')
      .update({ last_viewed_timeline_at: new Date().toISOString() })
      .eq('id', user.id);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}

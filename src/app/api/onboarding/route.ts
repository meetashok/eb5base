import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { encryptCaseReceipt } from '@/lib/cases';
import { isValidReceiptNumber } from '@/lib/receipt-validation';
import { writeAuditLog } from '@/lib/audit';
import { pollCases } from '@/lib/uscis/poller';
import type { FormType, WomStatus } from '@/lib/types';
import { DERIVATIVE_FORM_TYPES, PRIMARY_FORM_TYPES } from '@/lib/constants';

type ReceiptInput = {
  formType: FormType;
  receiptNumber: string;
  filedDate?: string | null;
};

type IndividualInput = {
  tag: string;
  isPrimary?: boolean;
  receipts: ReceiptInput[];
};

type OnboardingBody = {
  projectName?: string | null;
  regionalCenterName?: string | null;
  classification?: string | null;
  i956fStatus?: string | null;
  i956fApprovalDate?: string | null;
  countryOfBirth?: string | null;
  attorneyName?: string | null;
  agentName?: string | null;
  individuals: IndividualInput[];
  wom?: {
    relatedFormType: FormType;
    courtDistrict?: string | null;
    filedDate?: string | null;
    womStatus: WomStatus;
  } | null;
  consent: boolean;
};

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: OnboardingBody;
  try {
    body = (await request.json()) as OnboardingBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (!body.consent) {
    return NextResponse.json({ error: 'Consent required' }, { status: 400 });
  }

  if (!body.individuals?.length) {
    return NextResponse.json({ error: 'At least one individual is required' }, { status: 400 });
  }

  // Validate receipts
  for (const ind of body.individuals) {
    const allowed = ind.isPrimary ? PRIMARY_FORM_TYPES : DERIVATIVE_FORM_TYPES;
    for (const r of ind.receipts || []) {
      if (!r.receiptNumber?.trim()) continue;
      if (!allowed.includes(r.formType)) {
        return NextResponse.json(
          { error: `${r.formType} is not allowed for ${ind.tag}` },
          { status: 400 }
        );
      }
      if (!isValidReceiptNumber(r.receiptNumber)) {
        return NextResponse.json(
          { error: `Invalid receipt number for ${ind.tag} ${r.formType}` },
          { status: 400 }
        );
      }
    }
  }

  const hasAnyReceipt = body.individuals.some((i) =>
    (i.receipts || []).some((r) => r.receiptNumber?.trim())
  );
  if (!hasAnyReceipt) {
    return NextResponse.json({ error: 'Add at least one receipt number' }, { status: 400 });
  }

  // Update profile
  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      project_name: body.projectName?.trim() || null,
      regional_center_name: body.regionalCenterName?.trim() || null,
      classification: body.classification || null,
      i956f_status: body.i956fStatus || null,
      i956f_approval_date: body.i956fApprovalDate || null,
      country_of_birth: body.countryOfBirth || null,
      attorney_name: body.attorneyName?.trim() || null,
      agent_name: body.agentName?.trim() || null,
      onboarding_complete: true,
      profile_completed: true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id);

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  const caseIds: string[] = [];

  for (let i = 0; i < body.individuals.length; i++) {
    const ind = body.individuals[i];
    const { data: individual, error: indError } = await supabase
      .from('individuals')
      .insert({
        user_id: user.id,
        tag: ind.tag.trim(),
        is_primary: Boolean(ind.isPrimary) || i === 0,
        display_order: i,
      })
      .select('id')
      .single();

    if (indError || !individual) {
      return NextResponse.json({ error: indError?.message || 'Failed to create individual' }, { status: 500 });
    }

    for (const r of ind.receipts || []) {
      if (!r.receiptNumber?.trim()) continue;
      const { encrypted, serviceCenter } = encryptCaseReceipt(r.receiptNumber);
      await writeAuditLog({
        action: 'encrypt',
        actor: 'user_session',
        userId: user.id,
        metadata: { form_type: r.formType },
      });

      const { data: caseRow, error: caseError } = await supabase
        .from('cases')
        .insert({
          individual_id: individual.id,
          user_id: user.id,
          receipt_number_encrypted: encrypted,
          form_type: r.formType,
          service_center: serviceCenter,
          filed_date: r.filedDate || null,
        })
        .select('id')
        .single();

      if (caseError) {
        return NextResponse.json({ error: caseError.message }, { status: 500 });
      }
      if (caseRow) caseIds.push(caseRow.id);
    }
  }

  if (body.wom?.relatedFormType && body.wom.womStatus) {
    await supabase.from('wom_cases').insert({
      user_id: user.id,
      related_form_type: body.wom.relatedFormType,
      court_district: body.wom.courtDistrict || null,
      filed_date: body.wom.filedDate || null,
      wom_status: body.wom.womStatus,
    });
  }

  // Initial status poll (stub or live)
  try {
    if (process.env.RECEIPT_ENCRYPTION_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      await pollCases({ userId: user.id, caseIds });
    }
  } catch (err) {
    console.error('initial poll failed', err);
  }

  return NextResponse.json({ ok: true, redirect: '/tracker/timeline' });
}

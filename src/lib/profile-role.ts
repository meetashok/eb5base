import { createClient } from '@/lib/supabase';
import type { InvestorStage, UserRole } from '@/lib/types';

export type ApplyRoleChangeInput = {
  userId: string;
  role: UserRole;
  investorStage?: InvestorStage | null;
  brandId?: string;
};

export type ApplyRoleChangeResult =
  | { ok: true }
  | { ok: false; error: string };

export async function deactivateRcMemberships(userId: string): Promise<ApplyRoleChangeResult> {
  const supabase = createClient();
  const { error } = await supabase
    .from('rc_memberships')
    .update({ active: false })
    .eq('user_id', userId)
    .eq('active', true);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function requestRcMembership(
  userId: string,
  rcId: string
): Promise<ApplyRoleChangeResult> {
  const supabase = createClient();
  const { error } = await supabase.from('rc_memberships').insert({
    rc_id: rcId,
    user_id: userId,
    role: 'editor',
    active: true,
    verified_at: null,
  });

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/** Map a user-selected RC brand to a regional_centers row for rc_memberships.rc_id. */
export async function resolveRcEntityForBrand(
  brandId: string
): Promise<ApplyRoleChangeResult & { rcId?: string }> {
  const supabase = createClient();

  const { data: entities, error: fetchErr } = await supabase
    .from('regional_centers')
    .select('id')
    .eq('brand_id', brandId)
    .order('created_at', { ascending: true })
    .limit(1);

  if (fetchErr) return { ok: false, error: fetchErr.message };
  if (entities?.[0]) return { ok: true, rcId: entities[0].id };

  const { data: brand, error: brandErr } = await supabase
    .from('rc_brands')
    .select('id, name')
    .eq('id', brandId)
    .maybeSingle();

  if (brandErr || !brand) {
    return { ok: false, error: brandErr?.message || 'Regional center brand not found.' };
  }

  const { data: created, error: insertErr } = await supabase
    .from('regional_centers')
    .insert({ name: brand.name, brand_id: brandId })
    .select('id')
    .single();

  if (insertErr) return { ok: false, error: insertErr.message };
  return { ok: true, rcId: created.id };
}

export async function applyRoleChange({
  userId,
  role,
  investorStage,
  brandId,
}: ApplyRoleChangeInput): Promise<ApplyRoleChangeResult> {
  const supabase = createClient();

  if (role === 'investor' && !investorStage) {
    return { ok: false, error: 'Please select your investor stage.' };
  }

  if (role === 'rc_operator' && !brandId) {
    return { ok: false, error: 'Please select a regional center.' };
  }

  const deactivated = await deactivateRcMemberships(userId);
  if (!deactivated.ok) return deactivated;

  const profileUpdate = {
    role,
    investor_stage: role === 'investor' ? investorStage : null,
    profile_completed: true,
  };

  const { error: profileErr } = await supabase
    .from('profiles')
    .update(profileUpdate)
    .eq('id', userId);

  if (profileErr) return { ok: false, error: profileErr.message };

  if (role === 'rc_operator' && brandId) {
    const resolved = await resolveRcEntityForBrand(brandId);
    if (!resolved.ok || !resolved.rcId) return resolved;
    return requestRcMembership(userId, resolved.rcId);
  }

  return { ok: true };
}

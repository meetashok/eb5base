import { createClient } from '@/lib/supabase';
import type { InvestorStage, UserRole } from '@/lib/types';

export type ApplyRoleChangeInput = {
  userId: string;
  role: UserRole;
  investorStage?: InvestorStage | null;
  rcId?: string;
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

export async function applyRoleChange({
  userId,
  role,
  investorStage,
  rcId,
}: ApplyRoleChangeInput): Promise<ApplyRoleChangeResult> {
  const supabase = createClient();

  if (role === 'investor' && !investorStage) {
    return { ok: false, error: 'Please select your investor stage.' };
  }

  if (role === 'rc_operator' && !rcId) {
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

  if (role === 'rc_operator' && rcId) {
    return requestRcMembership(userId, rcId);
  }

  return { ok: true };
}

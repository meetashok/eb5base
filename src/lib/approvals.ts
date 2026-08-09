import { createClient } from '@/lib/supabase';
import type { ContentSubmission, ModerationStatus, Project } from '@/lib/types';

// v2 TODO: email/in-app notifications when submissions are approved/rejected
// or duplicate reports are resolved/dismissed.

type SupabaseClient = ReturnType<typeof createClient>;

export async function isAdmin(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  const { data } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', userId)
    .maybeSingle();
  return Boolean(data?.is_admin);
}

/** Verified RC rep for this project's brand / legacy rc entity. */
export async function isVerifiedRcRepForProject(
  supabase: SupabaseClient,
  userId: string,
  project: Pick<Project, 'brand_id' | 'rc_id'>
): Promise<boolean> {
  const rcIds: string[] = [];
  if (project.rc_id) rcIds.push(project.rc_id);

  if (project.brand_id) {
    const { data: entities } = await supabase
      .from('regional_centers')
      .select('id')
      .eq('brand_id', project.brand_id);
    for (const e of entities || []) rcIds.push(e.id);
  }

  if (!rcIds.length) return false;

  const { data } = await supabase
    .from('rc_memberships')
    .select('id')
    .eq('user_id', userId)
    .in('rc_id', rcIds)
    .eq('active', true)
    .not('verified_at', 'is', null)
    .is('revoked_at', null)
    .limit(1)
    .maybeSingle();

  return Boolean(data);
}

/** Verified RC rep for any USCIS entity under this brand. */
export async function isVerifiedRcRepForBrand(
  supabase: SupabaseClient,
  userId: string,
  brandId: string
): Promise<boolean> {
  const { data: entities } = await supabase
    .from('regional_centers')
    .select('id')
    .eq('brand_id', brandId);
  const rcIds = (entities || []).map((e) => e.id);
  if (!rcIds.length) return false;

  const { data } = await supabase
    .from('rc_memberships')
    .select('id')
    .eq('user_id', userId)
    .in('rc_id', rcIds)
    .eq('active', true)
    .not('verified_at', 'is', null)
    .is('revoked_at', null)
    .limit(1)
    .maybeSingle();

  return Boolean(data);
}

/** Admin or verified RC rep for this project - skip moderation queue. */
export async function shouldAutoApproveProjectAction(
  supabase: SupabaseClient,
  userId: string,
  project: Pick<Project, 'brand_id' | 'rc_id'>
): Promise<boolean> {
  if (await isAdmin(supabase, userId)) return true;
  return isVerifiedRcRepForProject(supabase, userId, project);
}

/** Admin or verified RC rep for this brand - skip moderation queue. */
export async function shouldAutoApproveBrandAction(
  supabase: SupabaseClient,
  userId: string,
  brandId: string
): Promise<boolean> {
  if (await isAdmin(supabase, userId)) return true;
  return isVerifiedRcRepForBrand(supabase, userId, brandId);
}

export async function createSubmission(
  supabase: SupabaseClient,
  input: {
    entity_type: 'project' | 'rc_brand';
    entity_id: string;
    action: 'create' | 'update';
    payload: Record<string, unknown>;
    submitted_by: string;
  }
): Promise<{ id: string } | { error: string }> {
  const { data, error } = await supabase
    .from('content_submissions')
    .insert({
      entity_type: input.entity_type,
      entity_id: input.entity_id,
      action: input.action,
      payload: input.payload,
      status: 'pending',
      submitted_by: input.submitted_by,
    })
    .select('id')
    .single();

  if (error || !data) {
    console.error('createSubmission failed:', error?.message);
    if (error && /content_submissions|schema cache/i.test(error.message)) {
      return { id: 'legacy' };
    }
    return { error: error?.message || 'Failed to record submission' };
  }
  return { id: data.id };
}

export function statusBadgeClass(status: ModerationStatus | null | undefined): string {
  if (status === 'approved') return 'bg-secondary text-secondary-content border-0';
  if (status === 'rejected') return 'bg-error text-white border-0';
  return 'bg-copper text-white border-0';
}

export function statusLabel(status: ModerationStatus | null | undefined): string {
  if (status === 'approved') return 'Approved';
  if (status === 'rejected') return 'Rejected';
  return 'Pending approval';
}

export function duplicateStatusBadgeClass(
  status: 'pending' | 'resolved' | 'dismissed' | null | undefined
): string {
  if (status === 'resolved') return 'bg-secondary text-secondary-content border-0';
  if (status === 'dismissed') return 'bg-neutral/30 text-neutral border-0';
  return 'bg-copper text-white border-0';
}

export function duplicateStatusLabel(
  status: 'pending' | 'resolved' | 'dismissed' | null | undefined
): string {
  if (status === 'resolved') return 'Resolved';
  if (status === 'dismissed') return 'Dismissed';
  return 'Pending review';
}

export type SubmissionListItem = ContentSubmission & {
  title: string;
  href: string | null;
};

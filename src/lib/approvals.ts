import { createClient } from '@/lib/supabase';
import type { ContentSubmission, ModerationStatus, Project } from '@/lib/types';

type SupabaseClient = ReturnType<typeof createClient>;

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
    // Table may not exist yet — don't block the main write
    console.error('createSubmission failed:', error?.message);
    if (error && /content_submissions|schema cache/i.test(error.message)) {
      return { id: 'legacy' };
    }
    return { error: error?.message || 'Failed to record submission' };
  }
  return { id: data.id };
}

export function statusBadgeClass(status: ModerationStatus | null | undefined): string {
  if (status === 'approved') return 'badge-success';
  if (status === 'rejected') return 'badge-error';
  return 'badge-warning';
}

export function statusLabel(status: ModerationStatus | null | undefined): string {
  if (status === 'approved') return 'Approved';
  if (status === 'rejected') return 'Rejected';
  return 'Pending approval';
}

export type SubmissionListItem = ContentSubmission & {
  title: string;
  href: string | null;
};

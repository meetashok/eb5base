import { createClient } from '@/lib/supabase-server';
import type { Project, ProjectImage } from '@/lib/types';

export async function loadProjectImages(projectId: string): Promise<ProjectImage[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('project_images')
    .select('*')
    .eq('project_id', projectId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) {
    if (/project_images|cover_image/i.test(error.message)) return [];
    console.error('loadProjectImages failed:', error.message);
    return [];
  }
  return (data as ProjectImage[]) || [];
}

export async function canManageProjectImagesServer(
  project: Pick<Project, 'id' | 'brand_id' | 'rc_id'>,
  userId: string | null
): Promise<boolean> {
  if (!userId) return false;
  const supabase = createClient();

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', userId)
    .maybeSingle();
  if (profile?.is_admin) return true;

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

  const { data: membership } = await supabase
    .from('rc_memberships')
    .select('id')
    .eq('user_id', userId)
    .in('rc_id', rcIds)
    .eq('active', true)
    .not('verified_at', 'is', null)
    .is('revoked_at', null)
    .limit(1)
    .maybeSingle();

  return Boolean(membership);
}

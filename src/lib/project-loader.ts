import { createClient } from '@/lib/supabase-server';
import type { Project } from '@/lib/types';
import { isUuid } from '@/lib/slugs';

const DETAIL_SELECT =
  '*, rc_brands!brand_id(id, name, website_url, slug), regional_centers(id, name, uscis_rc_id, website_url), profiles!added_by(display_name, avatar_url)';

async function hydrateProject(project: Project): Promise<Project> {
  const supabase = createClient();

  if (project.brand_id && !project.rc_brands) {
    const { data: brand } = await supabase
      .from('rc_brands')
      .select('id, name, website_url, slug')
      .eq('id', project.brand_id)
      .maybeSingle();
    project.rc_brands = brand;
  }

  if (project.rc_id && !project.regional_centers) {
    const { data: rc } = await supabase
      .from('regional_centers')
      .select('id, name, uscis_rc_id, website_url')
      .eq('id', project.rc_id)
      .maybeSingle();
    project.regional_centers = rc;
  }

  if (project.added_by && !project.profiles) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name, avatar_url')
      .eq('id', project.added_by)
      .maybeSingle();
    project.profiles = profile;
  }

  return project;
}

/** Load a project by UUID or slug (with brand join when possible). */
export async function loadProjectByParam(param: string): Promise<Project | null> {
  const supabase = createClient();
  const col = isUuid(param) ? 'id' : 'slug';

  const joined = await supabase
    .from('projects')
    .select(DETAIL_SELECT)
    .eq(col, param)
    .maybeSingle();

  if (!joined.error && joined.data) {
    return joined.data as Project;
  }

  if (joined.error) {
    console.error('Project detail joined select failed:', joined.error.message);
  }

  const basic = await supabase.from('projects').select('*').eq(col, param).maybeSingle();

  if (basic.error || !basic.data) {
    if (basic.error) console.error('Project detail basic select failed:', basic.error.message);
    return null;
  }

  return hydrateProject(basic.data as Project);
}

/** Load a project nested under a brand (by brand slug/id + project slug/id). */
export async function loadNestedProject(
  brandParam: string,
  projectParam: string
): Promise<{
  brand: { id: string; name: string; slug: string | null };
  project: Project;
} | null> {
  const supabase = createClient();
  const brandCol = isUuid(brandParam) ? 'id' : 'slug';
  const projectCol = isUuid(projectParam) ? 'id' : 'slug';

  const { data: brand } = await supabase
    .from('rc_brands')
    .select('id, name, slug')
    .eq(brandCol, brandParam)
    .maybeSingle();
  if (!brand) return null;

  const joined = await supabase
    .from('projects')
    .select(DETAIL_SELECT)
    .eq('brand_id', brand.id)
    .eq(projectCol, projectParam)
    .maybeSingle();

  if (!joined.error && joined.data) {
    return { brand, project: joined.data as Project };
  }

  const basic = await supabase
    .from('projects')
    .select('*')
    .eq('brand_id', brand.id)
    .eq(projectCol, projectParam)
    .maybeSingle();
  if (!basic.data) return null;

  const project = await hydrateProject(basic.data as Project);
  return { brand, project };
}

export async function canEditProject(
  project: Project,
  userId: string | null
): Promise<boolean> {
  if (!userId) return false;
  if (project.added_by === userId) return true;
  if (!project.rc_id) return false;

  const supabase = createClient();
  const { data: membership } = await supabase
    .from('rc_memberships')
    .select('id')
    .eq('rc_id', project.rc_id)
    .eq('user_id', userId)
    .eq('active', true)
    .not('verified_at', 'is', null)
    .is('revoked_at', null)
    .maybeSingle();

  return Boolean(membership);
}

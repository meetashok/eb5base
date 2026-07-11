import { createClient } from '@/lib/supabase-server';
import type { Project } from '@/lib/types';
import { PROJECT_SELECT, PROJECT_SELECT_LEGACY } from '@/lib/types';
import { ensureBrandSlug, ensureProjectSlug } from '@/lib/ensure-slugs';
import { isUuid, slugify } from '@/lib/slugs';

const DETAIL_SELECT = `${PROJECT_SELECT}, profiles!added_by(display_name, avatar_url)`;
const DETAIL_SELECT_LEGACY = `${PROJECT_SELECT_LEGACY}, profiles!added_by(display_name, avatar_url)`;

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

async function finalizeProject(project: Project): Promise<Project> {
  if (project.brand_id && project.rc_brands?.name) {
    project.rc_brands.slug = await ensureBrandSlug({
      id: project.rc_brands.id || project.brand_id,
      name: project.rc_brands.name,
      slug: project.rc_brands.slug,
    });
  }
  if (project.name) {
    project.slug = await ensureProjectSlug({
      id: project.id,
      name: project.name,
      slug: project.slug,
      brand_id: project.brand_id,
    });
  }
  return project;
}

async function selectProjectDetail(
  filters: Array<{ column: string; value: string }>
): Promise<Project | null> {
  const supabase = createClient();

  async function runSelect(select: string) {
    let query = supabase.from('projects').select(select);
    for (const f of filters) {
      query = query.eq(f.column, f.value);
    }
    return query.maybeSingle();
  }

  const joined = await runSelect(DETAIL_SELECT);
  if (!joined.error && joined.data) {
    return finalizeProject(joined.data as unknown as Project);
  }
  if (joined.error) {
    console.error('Project detail joined select failed:', joined.error.message);
    const legacy = await runSelect(DETAIL_SELECT_LEGACY);
    if (!legacy.error && legacy.data) {
      return finalizeProject(legacy.data as unknown as Project);
    }
  }

  const basic = await runSelect('*');
  if (basic.error || !basic.data) {
    if (basic.error) console.error('Project detail basic select failed:', basic.error.message);
    return null;
  }
  return finalizeProject(await hydrateProject(basic.data as unknown as Project));
}

/** Load a project by UUID or slug (with brand join when possible). */
export async function loadProjectByParam(param: string): Promise<Project | null> {
  const col = isUuid(param) ? 'id' : 'slug';
  return selectProjectDetail([{ column: col, value: param }]);
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

  const { data: initialBrand, error: brandError } = await supabase
    .from('rc_brands')
    .select('id, name, slug')
    .eq(brandCol, brandParam)
    .maybeSingle();

  let brand = initialBrand;

  if (brandError && /column .*\.slug does not exist/i.test(brandError.message)) {
    ({ data: brand } = await supabase
      .from('rc_brands')
      .select('id, name')
      .eq(isUuid(brandParam) ? 'id' : 'name', brandParam)
      .maybeSingle());
  }

  if (!brand && !isUuid(brandParam)) {
    const { data: unsluggified } = await supabase
      .from('rc_brands')
      .select('id, name, slug')
      .is('slug', null)
      .limit(100);
    brand =
      unsluggified?.find((row) => slugify(row.name) === brandParam) ||
      unsluggified?.find((row) => row.slug === brandParam) ||
      null;
  }

  if (!brand) return null;

  brand.slug = await ensureBrandSlug(brand);

  const projectCol = isUuid(projectParam) ? 'id' : 'slug';
  const project = await selectProjectDetail([
    { column: 'brand_id', value: brand.id },
    { column: projectCol, value: projectParam },
  ]);

  if (project) {
    return { brand, project };
  }

  if (!isUuid(projectParam)) {
    const { data: candidates } = await supabase
      .from('projects')
      .select('*')
      .eq('brand_id', brand.id)
      .is('slug', null)
      .limit(100);
    const match = candidates?.find((row) => slugify(row.name) === projectParam);
    if (match) {
      const hydrated = await finalizeProject(await hydrateProject(match as Project));
      return { brand, project: hydrated };
    }
  }

  return null;
}

export async function canEditProject(
  project: Project,
  userId: string | null
): Promise<boolean> {
  // Community directory: any signed-in user can edit (matches brands UPDATE policy).
  // Seeded rows often have added_by = null, so owner-only checks hid the button.
  return Boolean(userId);
}

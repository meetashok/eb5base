import { createClient } from '@/lib/supabase-server';
import { allocateUniqueSlug, slugify } from '@/lib/slugs';
import type { ProjectWithVotes, RcBrand } from '@/lib/types';

let slugColumnsAvailable = true;

function slugColumnMissing(message: string | undefined): boolean {
  return Boolean(message && /column .*\.slug does not exist/i.test(message));
}

/** Persist a brand slug when missing; returns the slug to use in URLs. */
export async function ensureBrandSlug(brand: {
  id: string;
  name: string;
  slug?: string | null;
}): Promise<string | null> {
  if (brand.slug) return brand.slug;
  const name = brand.name?.trim();
  if (!name) return null;

  const computed = slugify(name);
  if (!slugColumnsAvailable) return computed;

  const supabase = createClient();
  const slug = await allocateUniqueSlug(computed, async (candidate) => {
    const { data, error } = await supabase
      .from('rc_brands')
      .select('id')
      .eq('slug', candidate)
      .maybeSingle();
    if (slugColumnMissing(error?.message)) {
      slugColumnsAvailable = false;
      return false;
    }
    return Boolean(data && data.id !== brand.id);
  });

  if (!slugColumnsAvailable) return computed;

  const { error } = await supabase
    .from('rc_brands')
    .update({ slug })
    .eq('id', brand.id)
    .is('slug', null);

  if (error) {
    if (slugColumnMissing(error.message)) slugColumnsAvailable = false;
    return slug;
  }

  return slug;
}

/** Persist a project slug when missing; returns the slug to use in URLs. */
export async function ensureProjectSlug(project: {
  id: string;
  name: string;
  slug?: string | null;
  brand_id?: string | null;
}): Promise<string | null> {
  if (project.slug) return project.slug;
  const name = project.name?.trim();
  if (!name) return null;

  const computed = slugify(name);
  if (!slugColumnsAvailable) return computed;

  const supabase = createClient();
  const slug = await allocateUniqueSlug(computed, async (candidate) => {
    let query = supabase.from('projects').select('id').eq('slug', candidate);
    query = project.brand_id
      ? query.eq('brand_id', project.brand_id)
      : query.is('brand_id', null);
    const { data, error } = await query.maybeSingle();
    if (slugColumnMissing(error?.message)) {
      slugColumnsAvailable = false;
      return false;
    }
    return Boolean(data && data.id !== project.id);
  });

  if (!slugColumnsAvailable) return computed;

  const { error } = await supabase
    .from('projects')
    .update({ slug })
    .eq('id', project.id)
    .is('slug', null);

  if (error) {
    if (slugColumnMissing(error.message)) slugColumnsAvailable = false;
    return slug;
  }

  return slug;
}

/** Backfill missing slugs for a project list (cards, browse pages). */
export async function ensureSlugsForProjects<T extends ProjectWithVotes>(
  projects: T[]
): Promise<T[]> {
  if (!projects.length || !slugColumnsAvailable) return projects;

  const brandIds = new Set<string>();
  for (const p of projects) {
    if (p.brand_id && p.rc_brands?.id) brandIds.add(p.brand_id);
  }

  const brandSlugById = new Map<string, string>();
  for (const p of projects) {
    const brand = p.rc_brands;
    if (!brand?.id || !brand.name || brandSlugById.has(brand.id)) continue;
    const slug = await ensureBrandSlug({
      id: brand.id,
      name: brand.name,
      slug: brand.slug,
    });
    if (slug) brandSlugById.set(brand.id, slug);
  }

  for (const p of projects) {
    if (p.rc_brands?.id) {
      const slug = brandSlugById.get(p.rc_brands.id);
      if (slug) p.rc_brands = { ...p.rc_brands, slug };
    }
    if (!p.slug && p.name) {
      p.slug = await ensureProjectSlug({
        id: p.id,
        name: p.name,
        slug: p.slug,
        brand_id: p.brand_id,
      });
    }
  }

  return projects;
}

/** Backfill missing slugs for RC brand list cards. */
export async function ensureSlugsForBrands<T extends Pick<RcBrand, 'id' | 'name' | 'slug'>>(
  brands: T[]
): Promise<T[]> {
  if (!brands.length || !slugColumnsAvailable) return brands;

  for (const brand of brands) {
    if (!brand.slug && brand.name) {
      brand.slug = await ensureBrandSlug(brand);
    }
  }

  return brands;
}

/** URL slug helpers for brands and projects */

const RESERVED_SLUGS = new Set(['new', 'add', 'edit', 'projects', 'rc']);

export function slugify(input: string): string {
  let base = input
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
    .slice(0, 80);
  if (!base) base = 'item';
  if (RESERVED_SLUGS.has(base)) base = `${base}-rc`;
  return base;
}

/** Allocate a unique slug by probing an async taken-checker. */
export async function allocateUniqueSlug(
  base: string,
  isTaken: (candidate: string) => Promise<boolean>
): Promise<string> {
  let candidate = base;
  let n = 2;
  while (await isTaken(candidate)) {
    candidate = `${base}-${n}`.slice(0, 80);
    n += 1;
  }
  return candidate;
}

export function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

export function brandPath(brand: { slug?: string | null; id: string }): string {
  return `/rc/${brand.slug || brand.id}`;
}

export function brandEditPath(brand: { slug?: string | null; id: string }): string {
  return `/rc/${brand.slug || brand.id}/edit`;
}

export function projectPath(project: {
  slug?: string | null;
  id: string;
  brand_id?: string | null;
  rc_brands?: { slug?: string | null; id?: string } | null;
}): string {
  const brandSlug = project.rc_brands?.slug;
  const projectSlug = project.slug;
  if (brandSlug && projectSlug) {
    return `/rc/${brandSlug}/${projectSlug}`;
  }
  return `/projects/${projectSlug || project.id}`;
}

export function projectEditPath(project: {
  slug?: string | null;
  id: string;
}): string {
  return `/projects/${project.slug || project.id}/edit`;
}

/** Ensure unique slug against an existing set (or async checker). */
export function uniquifySlug(base: string, taken: Set<string>): string {
  let candidate = base;
  let n = 2;
  while (taken.has(candidate)) {
    candidate = `${base}-${n}`.slice(0, 80);
    n += 1;
  }
  return candidate;
}

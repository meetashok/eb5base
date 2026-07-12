import { AddRcLink } from '@/components/AuthGatedLinks';
import PageHero from '@/components/PageHero';
import BrandsClient from './BrandsClient';
import { createClient } from '@/lib/supabase-server';
import type { RcBrand } from '@/lib/types';
import { ensureSlugsForBrands } from '@/lib/ensure-slugs';
import { isMissingRcBrandMergedInto } from '@/lib/schema-compat';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Regional Centers',
};

type BrandRow = RcBrand & {
  projects?: { count: number }[] | null;
  regional_centers?: { count: number }[] | null;
};

async function loadBrands(): Promise<{ brands: BrandRow[]; error: string | null }> {
  const supabase = createClient();

  async function withCounts(filterMerged: boolean, approvedOnly: boolean) {
    let query = supabase
      .from('rc_brands')
      .select('*, projects!brand_id(count), regional_centers!brand_id(count)');
    if (approvedOnly) query = query.eq('status', 'approved');
    if (filterMerged) query = query.is('merged_into', null);
    return query.order('name');
  }

  async function basic(filterMerged: boolean) {
    let query = supabase.from('rc_brands').select('*');
    if (filterMerged) query = query.is('merged_into', null);
    return query.order('name');
  }

  let filterMerged = true;
  let withCountsRes = await withCounts(filterMerged, true);

  if (withCountsRes.error && isMissingRcBrandMergedInto(withCountsRes.error.message)) {
    filterMerged = false;
    withCountsRes = await withCounts(false, true);
  }

  if (!withCountsRes.error && withCountsRes.data) {
    return { brands: withCountsRes.data as BrandRow[], error: null };
  }

  if (withCountsRes.error) {
    console.error('rc_brands list (with counts) failed:', withCountsRes.error.message);
    let retry = await withCounts(filterMerged, false);
    if (retry.error && isMissingRcBrandMergedInto(retry.error.message)) {
      filterMerged = false;
      retry = await withCounts(false, false);
    }
    if (!retry.error && retry.data) {
      return { brands: retry.data as BrandRow[], error: null };
    }
  }

  let basicRes = await basic(filterMerged);
  if (basicRes.error && isMissingRcBrandMergedInto(basicRes.error.message)) {
    basicRes = await basic(false);
  }
  if (basicRes.error) {
    console.error('rc_brands list failed:', basicRes.error.message);
    return { brands: [], error: basicRes.error.message };
  }

  return { brands: (basicRes.data as BrandRow[]) || [], error: null };
}

export default async function RCBrandsPage() {
  const supabase = createClient();
  const { brands: rows, error } = await loadBrands();

  const brands = (await ensureSlugsForBrands(rows)).map((b) => ({
    ...b,
    project_count: b.projects?.[0]?.count ?? 0,
    entity_count: b.regional_centers?.[0]?.count ?? 0,
  }));

  let legacyEntityCount = 0;
  if (brands.length === 0 && !error) {
    const { count } = await supabase
      .from('regional_centers')
      .select('*', { count: 'exact', head: true });
    legacyEntityCount = count || 0;
  }

  return (
    <div>
      <PageHero
        eyebrow="Organizations"
        title="Regional Centers"
        subtitle="EB-5 regional center organizations and their active projects."
      >
        <AddRcLink className="btn btn-accent text-accent-content rounded-full shadow-soft hover:shadow-glow">
          + Add Regional Center
        </AddRcLink>
      </PageHero>

      <div className="max-w-6xl mx-auto py-8 px-4">
        {error && (
          <div className="alert alert-error mb-6 text-sm rounded-xl shadow-soft">
            <span>Could not load regional centers: {error}</span>
          </div>
        )}

        {!error && brands.length === 0 && legacyEntityCount > 0 && (
          <div className="alert-heritage-warning mb-6 text-sm px-4 py-3">
            <span>
              Found {legacyEntityCount} USCIS entit
              {legacyEntityCount === 1 ? 'y' : 'ies'} in <code>regional_centers</code>, but none
              in <code>rc_brands</code>. Run your RC seed / brand migration SQL in Supabase so
              brands appear here.
            </span>
          </div>
        )}

        <BrandsClient brands={brands} />
      </div>
    </div>
  );
}

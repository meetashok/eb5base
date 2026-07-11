import Link from 'next/link';
import BrandsClient from './BrandsClient';
import { createClient } from '@/lib/supabase-server';
import type { RcBrand } from '@/lib/types';

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

  // Explicit FK hints avoid PostgREST ambiguity / schema-cache misses
  const withCounts = await supabase
    .from('rc_brands')
    .select('*, projects!brand_id(count), regional_centers!brand_id(count)')
    .eq('status', 'approved')
    .order('name');

  if (!withCounts.error && withCounts.data) {
    return { brands: withCounts.data as BrandRow[], error: null };
  }

  if (withCounts.error) {
    console.error('rc_brands list (with counts) failed:', withCounts.error.message);
    // Fallback if status column not migrated yet
    const retry = await supabase
      .from('rc_brands')
      .select('*, projects!brand_id(count), regional_centers!brand_id(count)')
      .order('name');
    if (!retry.error && retry.data) {
      return { brands: retry.data as BrandRow[], error: null };
    }
  }

  const basic = await supabase.from('rc_brands').select('*').order('name');
  if (basic.error) {
    console.error('rc_brands list failed:', basic.error.message);
    return { brands: [], error: basic.error.message };
  }

  return { brands: (basic.data as BrandRow[]) || [], error: null };
}

export default async function RCBrandsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { brands: rows, error } = await loadBrands();

  const brands = rows.map((b) => ({
    ...b,
    project_count: b.projects?.[0]?.count ?? 0,
    entity_count: b.regional_centers?.[0]?.count ?? 0,
  }));

  // Help diagnose empty list: brands table empty vs legacy entities still present
  let legacyEntityCount = 0;
  if (brands.length === 0 && !error) {
    const { count } = await supabase
      .from('regional_centers')
      .select('*', { count: 'exact', head: true });
    legacyEntityCount = count || 0;
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-primary">Regional Centers</h1>
          <p className="text-neutral/60 mt-1">
            EB-5 regional center organizations and their projects
          </p>
        </div>
        {user && (
          <Link href="/rc/add" className="btn btn-primary rounded-full gap-2">
            + Add Regional Center
          </Link>
        )}
      </div>

      {error && (
        <div className="alert alert-error mb-6 text-sm">
          <span>Could not load regional centers: {error}</span>
        </div>
      )}

      {!error && brands.length === 0 && legacyEntityCount > 0 && (
        <div className="alert alert-warning mb-6 text-sm">
          <span>
            Found {legacyEntityCount} USCIS entit
            {legacyEntityCount === 1 ? 'y' : 'ies'} in <code>regional_centers</code>, but none
            in <code>rc_brands</code>. Run your RC seed / brand migration SQL in Supabase so
            brands appear here.
          </span>
        </div>
      )}

      <BrandsClient brands={brands} isLoggedIn={Boolean(user)} />
    </div>
  );
}

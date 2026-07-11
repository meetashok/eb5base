import Link from 'next/link';
import BrandsClient from './BrandsClient';
import { createClient } from '@/lib/supabase-server';
import type { RcBrand } from '@/lib/types';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Regional Centers',
};

export default async function RCBrandsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('rc_brands')
    .select('*, projects(count), regional_centers(count)')
    .order('name');

  if (error) {
    console.error('rc_brands list failed:', error.message);
  }

  const brands = ((data as RcBrand[]) || []).map((b) => ({
    ...b,
    project_count: b.projects?.[0]?.count ?? 0,
    entity_count: b.regional_centers?.[0]?.count ?? 0,
  }));

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
          <Link href="/rc/new" className="btn btn-primary rounded-full gap-2">
            + Add Regional Center
          </Link>
        )}
      </div>
      <BrandsClient brands={brands} isLoggedIn={Boolean(user)} />
    </div>
  );
}

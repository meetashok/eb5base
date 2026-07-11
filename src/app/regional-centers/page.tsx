import Link from 'next/link';
import RegionalCentersClient from './RegionalCentersClient';
import { createClient } from '@/lib/supabase-server';
import type { RegionalCenter } from '@/lib/types';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Regional Centers',
};

export default async function RegionalCentersPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data } = await supabase
    .from('regional_centers')
    .select('*, projects(count)')
    .order('name');

  const centers = ((data as RegionalCenter[]) || []).map((rc) => ({
    ...rc,
    project_count: rc.projects?.[0]?.count ?? 0,
  }));

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-primary">Regional Centers</h1>
          <p className="text-neutral/60 mt-1">
            USCIS-approved regional centers and their projects
          </p>
        </div>
        {user && (
          <Link href="/regional-centers/new" className="btn btn-primary rounded-full gap-2">
            + Add Regional Center
          </Link>
        )}
      </div>
      <RegionalCentersClient centers={centers} />
    </div>
  );
}

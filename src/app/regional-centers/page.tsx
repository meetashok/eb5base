import RegionalCentersClient from './RegionalCentersClient';
import { createClient } from '@/lib/supabase-server';
import type { RegionalCenter } from '@/lib/types';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Regional Centers',
};

export default async function RegionalCentersPage() {
  const supabase = createClient();
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
      <h1 className="text-2xl font-bold text-primary mb-2">Regional Centers</h1>
      <p className="text-sm text-neutral/70 mb-6">
        Browse USCIS-approved regional centers and their EB-5 projects.
      </p>
      <RegionalCentersClient centers={centers} />
    </div>
  );
}

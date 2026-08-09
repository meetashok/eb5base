import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import CaseTrackerNav from '@/components/CaseTrackerNav';
import InsightsClient from './InsightsClient';

export const metadata = { title: 'Insights · Case Tracker' };
export const dynamic = 'force-dynamic';

export default async function InsightsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/tracker/insights');

  const { data: profile } = await supabase
    .from('profiles')
    .select('project_name')
    .eq('id', user.id)
    .maybeSingle();

  return (
    <>
      <CaseTrackerNav />
      <InsightsClient projectName={profile?.project_name || null} />
    </>
  );
}

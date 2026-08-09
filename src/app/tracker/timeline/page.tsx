import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import { loadTimelineData } from '@/lib/cases';
import CaseTrackerNav from '@/components/CaseTrackerNav';
import TimelineClient from './TimelineClient';

export const metadata = { title: 'Timeline · Case Tracker' };
export const dynamic = 'force-dynamic';

export default async function TimelinePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/tracker/timeline');

  const data = await loadTimelineData(user.id);

  return (
    <>
      <CaseTrackerNav />
      <TimelineClient
        individuals={data.individuals}
        historyByCase={data.historyByCase}
        wom={data.wom}
        profile={data.profile}
      />
    </>
  );
}

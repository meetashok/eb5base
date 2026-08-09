import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import { loadTimelineData } from '@/lib/cases';
import CaseTrackerNav from '@/components/CaseTrackerNav';
import SettingsClient from './SettingsClient';
import type { Profile } from '@/lib/types';

export const metadata = { title: 'Settings · Case Tracker' };
export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/tracker/settings');

  const data = await loadTimelineData(user.id);
  if (!data.profile) redirect('/tracker/onboarding');

  return (
    <>
      <CaseTrackerNav />
      <SettingsClient
        profile={data.profile as Profile}
        individuals={data.individuals}
        wom={data.wom}
      />
    </>
  );
}

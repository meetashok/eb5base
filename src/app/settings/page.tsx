import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import { loadTimelineData } from '@/lib/cases';
import SettingsClient from './SettingsClient';
import type { Profile } from '@/lib/types';

export const metadata = { title: 'Settings' };
export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/settings');

  const data = await loadTimelineData(user.id);
  if (!data.profile) redirect('/onboarding');

  return (
    <SettingsClient
      profile={data.profile as Profile}
      individuals={data.individuals}
      wom={data.wom}
    />
  );
}

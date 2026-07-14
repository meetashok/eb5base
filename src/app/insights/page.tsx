import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import InsightsClient from './InsightsClient';

export const metadata = { title: 'Insights' };
export const dynamic = 'force-dynamic';

export default async function InsightsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/insights');

  const { data: profile } = await supabase
    .from('profiles')
    .select('project_name')
    .eq('id', user.id)
    .maybeSingle();

  return <InsightsClient projectName={profile?.project_name || null} />;
}

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import OnboardingClient from './OnboardingClient';

export const metadata = { title: 'Onboarding' };

export default async function OnboardingPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/onboarding');

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, email, onboarding_complete')
    .eq('id', user.id)
    .maybeSingle();

  if (profile?.onboarding_complete) redirect('/timeline');

  const displayName =
    profile?.display_name ||
    (user.user_metadata?.full_name as string | undefined) ||
    (user.user_metadata?.name as string | undefined) ||
    '';

  return (
    <OnboardingClient
      displayName={displayName}
      email={profile?.email || user.email || null}
    />
  );
}

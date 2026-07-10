'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { ROLE_OPTIONS } from '@/lib/constants';
import type { UserRole } from '@/lib/types';

export default function ProfileSetupPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<UserRole>('investor');
  const [investorStage, setInvestorStage] = useState('considering');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) {
        router.replace('/login?redirect=/profile/setup');
        return;
      }
      setUserId(data.user.id);
      const metaName =
        data.user.user_metadata?.full_name ||
        data.user.user_metadata?.name ||
        data.user.email?.split('@')[0] ||
        '';
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .maybeSingle();
      setDisplayName(profile?.display_name || metaName);
      if (profile?.role) setRole(profile.role);
      if (profile?.investor_stage) setInvestorStage(profile.investor_stage);
      setLoading(false);
    });
  }, [router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!userId) return;
    setSaving(true);
    setError(null);
    const supabase = createClient();
    const { error: err } = await supabase
      .from('profiles')
      .update({
        display_name: displayName.trim(),
        role,
        investor_stage: role === 'investor' ? investorStage : null,
      })
      .eq('id', userId);
    setSaving(false);
    if (err) {
      setError(err.message);
      return;
    }
    router.push('/');
    router.refresh();
  }

  if (loading) {
    return (
      <div className="max-w-md mx-auto px-4 py-12">
        <div className="skeleton-shimmer h-8 w-48 mb-4" />
        <div className="skeleton-shimmer h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold text-primary mb-2">Complete your profile</h1>
      <p className="text-sm text-neutral/70 mb-6">Tell us a bit about yourself to get started.</p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <label className="form-control">
          <span className="label-text mb-1">Display name</span>
          <input
            type="text"
            className="input input-bordered"
            required
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
        </label>

        <fieldset className="space-y-2">
          <legend className="label-text mb-1">Role</legend>
          {ROLE_OPTIONS.map((opt) => (
            <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="role"
                className="radio radio-primary"
                checked={role === opt.value}
                onChange={() => setRole(opt.value)}
              />
              <span className="text-sm">{opt.label}</span>
            </label>
          ))}
        </fieldset>

        {role === 'investor' && (
          <fieldset className="space-y-2">
            <legend className="label-text mb-1">Investor stage</legend>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="stage"
                className="radio radio-primary"
                checked={investorStage === 'considering'}
                onChange={() => setInvestorStage('considering')}
              />
              <span className="text-sm">Considering EB-5</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="stage"
                className="radio radio-primary"
                checked={investorStage === 'invested'}
                onChange={() => setInvestorStage('invested')}
              />
              <span className="text-sm">Already Invested</span>
            </label>
          </fieldset>
        )}

        {error && <p className="text-error text-sm">{error}</p>}

        <button type="submit" className="btn btn-primary w-full" disabled={saving}>
          {saving ? 'Saving…' : 'Get Started'}
        </button>
      </form>
    </div>
  );
}

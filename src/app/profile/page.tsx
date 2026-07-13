'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import CountrySelect from '@/components/CountrySelect';
import RolePicker from '@/components/profile/RolePicker';
import RcVerificationPanel, { type RcPick } from '@/components/profile/RcVerificationPanel';
import { ROLE_BADGE_LABELS } from '@/lib/constants';
import { findCountry } from '@/lib/countries';
import { applyRoleChange } from '@/lib/profile-role';
import type { InvestorStage, Profile, RcMembership, UserRole } from '@/lib/types';
import { formatDate } from '@/lib/utils';

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function InfoIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4M12 8h.01" strokeLinecap="round" />
    </svg>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [rcMembership, setRcMembership] = useState<RcMembership | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [roleDraft, setRoleDraft] = useState<UserRole | null>(null);
  const [investorStageDraft, setInvestorStageDraft] = useState<InvestorStage | null>(null);
  const [selectedRc, setSelectedRc] = useState<RcPick | null>(null);
  const [savingRole, setSavingRole] = useState(false);
  const [roleError, setRoleError] = useState<string | null>(null);

  async function loadProfile(userId: string) {
    const supabase = createClient();
    const [{ data: p }, { data: membership }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).single(),
      supabase
        .from('rc_memberships')
        .select('*, regional_centers(id, name)')
        .eq('user_id', userId)
        .eq('active', true)
        .maybeSingle(),
    ]);
    setProfile(p);
    setNameDraft(p?.display_name || '');
    setRoleDraft(p?.role || null);
    setInvestorStageDraft((p?.investor_stage as InvestorStage) || null);
    setRcMembership((membership as RcMembership) || null);
    if (membership?.regional_centers) {
      setSelectedRc({
        id: membership.rc_id,
        name: membership.regional_centers.name,
        uscis_rc_id: null,
      });
    } else {
      setSelectedRc(null);
    }
    setLoading(false);
  }

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const t = new URLSearchParams(window.location.search).get('tab');
    if (
      t === 'confirmations' ||
      t === 'projects' ||
      t === 'activity' ||
      t === 'submissions'
    ) {
      const params = new URLSearchParams();
      if (t === 'confirmations') params.set('filter', 'confirmations');
      else if (t === 'projects') params.set('filter', 'projects');
      else if (t === 'activity' || t === 'submissions') params.set('filter', 'reports');
      const qs = params.toString();
      router.replace(qs ? `/timeline?${qs}` : '/timeline');
    }
  }, [router]);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) {
        router.replace('/login?redirect=/profile');
        return;
      }
      await loadProfile(auth.user.id);
    })();
  }, [router]);

  async function saveProfile(updates: Partial<Profile>) {
    if (!profile) return;
    const supabase = createClient();
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', profile.id)
      .select('*')
      .single();
    if (error) {
      setMessage(error.message);
      return;
    }
    setProfile(data);
    setMessage('Saved');
  }

  async function handleRoleSelect(nextRole: UserRole) {
    if (!profile) return;
    setRoleError(null);
    setRoleDraft(nextRole);

    if (nextRole === profile.role) return;

    if (nextRole === 'attorney' || nextRole === 'agent') {
      setSavingRole(true);
      const result = await applyRoleChange({ userId: profile.id, role: nextRole });
      setSavingRole(false);
      if (!result.ok) {
        setRoleError(result.error);
        setRoleDraft(profile.role);
        return;
      }
      await loadProfile(profile.id);
      setMessage('Profile type updated');
      return;
    }

    if (nextRole === 'investor') {
      const stage = investorStageDraft || profile.investor_stage;
      if (stage) {
        setSavingRole(true);
        const result = await applyRoleChange({
          userId: profile.id,
          role: 'investor',
          investorStage: stage,
        });
        setSavingRole(false);
        if (!result.ok) {
          setRoleError(result.error);
          setRoleDraft(profile.role);
          return;
        }
        await loadProfile(profile.id);
        setMessage('Profile type updated');
      }
    }

    if (nextRole === 'rc_operator') {
      setSelectedRc(null);
    }
  }

  async function confirmInvestorRole() {
    if (!profile || !investorStageDraft) return;
    setSavingRole(true);
    setRoleError(null);
    const result = await applyRoleChange({
      userId: profile.id,
      role: 'investor',
      investorStage: investorStageDraft,
    });
    setSavingRole(false);
    if (!result.ok) {
      setRoleError(result.error);
      return;
    }
    await loadProfile(profile.id);
    setMessage('Profile type updated');
  }

  async function confirmRcRole() {
    if (!profile || !selectedRc) return;
    setSavingRole(true);
    setRoleError(null);
    const result = await applyRoleChange({
      userId: profile.id,
      role: 'rc_operator',
      rcId: selectedRc.id,
    });
    setSavingRole(false);
    if (!result.ok) {
      setRoleError(result.error);
      return;
    }
    await loadProfile(profile.id);
    setMessage('Profile type updated. Verification is pending.');
  }

  async function deleteAccount() {
    if (!confirm('Delete your account? This cannot be undone from this UI; contact support if needed.')) {
      return;
    }
    setMessage(
      'Account deletion requires admin action. Please email hello@eb5base.com to request deletion.'
    );
  }

  if (loading || !profile) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="skeleton-shimmer h-20 w-full mb-4" />
        <div className="skeleton-shimmer h-64 w-full" />
      </div>
    );
  }

  const roleLabel = profile.role ? ROLE_BADGE_LABELS[profile.role] : null;
  const roleChanged = roleDraft !== profile.role;
  const showRcConfirm = roleDraft === 'rc_operator' && roleChanged;

  return (
    <div>
      <section className="page-hero">
        <div className="page-hero-inner">
          <div className="flex flex-col sm:flex-row gap-4 items-start">
            {profile.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatar_url}
                alt=""
                className="w-16 h-16 rounded-full object-cover ring-2 ring-accent/50 shadow-soft"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-accent text-accent-content flex items-center justify-center text-xl font-bold shadow-soft">
                {(profile.display_name || profile.email || 'U').charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex-1 page-hero-copy w-full min-w-0">
              <p className="page-hero-eyebrow">Your profile</p>
              {editingName ? (
                <input
                  className="input input-bordered input-sm bg-base-100 text-neutral max-w-xs"
                  value={nameDraft}
                  autoFocus
                  onChange={(e) => setNameDraft(e.target.value)}
                  onBlur={() => {
                    setEditingName(false);
                    if (nameDraft.trim() && nameDraft !== profile.display_name) {
                      saveProfile({ display_name: nameDraft.trim() });
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                  }}
                />
              ) : (
                <button
                  type="button"
                  className="text-2xl font-bold text-primary text-left"
                  onClick={() => setEditingName(true)}
                >
                  {profile.display_name || 'Click to set display name'}
                </button>
              )}
              <div className="flex flex-wrap items-center gap-2 mt-1">
                {roleLabel && (
                  <span className="badge bg-secondary/15 text-secondary border border-secondary/30 rounded-full">
                    {roleLabel}
                  </span>
                )}
                {profile.is_admin && (
                  <Link href="/admin" className="badge bg-accent/20 text-accent border border-accent/40 rounded-full">
                    Admin
                  </Link>
                )}
              </div>
              <Link href="/timeline" className="link link-secondary text-sm mt-2 inline-block">
                View my timeline →
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="card-elevated p-6 mb-8 -mt-6 relative z-10 shadow-lift space-y-6">
          <div className="space-y-4">
            <div>
              <h2 className="font-semibold text-primary">Profile type</h2>
              <p className="text-sm text-neutral/60 mt-1">
                Choose how you use EB5 Base. You can change this later.
              </p>
            </div>

            <RolePicker value={roleDraft} onChange={handleRoleSelect} />

            {roleDraft === 'investor' && (roleChanged || profile.role === 'investor') && (
              <fieldset className="flex flex-col gap-3 text-sm">
                <legend className="font-medium text-sm mb-1">Where are you in your journey?</legend>
                {(
                  [
                    { value: 'considering' as const, title: 'Considering EB-5' },
                    { value: 'invested' as const, title: 'Already Invested' },
                  ] as const
                ).map((opt) => (
                  <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="role-investor-stage"
                      className="radio radio-sm radio-primary"
                      checked={investorStageDraft === opt.value}
                      onChange={() => setInvestorStageDraft(opt.value)}
                    />
                    {opt.title}
                  </label>
                ))}
                {roleChanged && (
                  <button
                    type="button"
                    className="btn btn-primary btn-sm rounded-full w-fit mt-2"
                    disabled={!investorStageDraft || savingRole}
                    onClick={confirmInvestorRole}
                  >
                    {savingRole ? <span className="loading loading-spinner loading-sm" /> : 'Save profile type'}
                  </button>
                )}
              </fieldset>
            )}

            {roleDraft === 'attorney' && roleChanged && (
              <div className="bg-base-200 rounded-xl p-4">
                <div className="flex gap-3 items-start">
                  <InfoIcon className="w-5 h-5 text-secondary mt-0.5 shrink-0" />
                  <p className="text-sm text-neutral/60">
                    Attorney features are coming soon. Your profile type will update right away.
                  </p>
                </div>
              </div>
            )}

            {roleDraft === 'agent' && roleChanged && (
              <div className="bg-base-200 rounded-xl p-4">
                <div className="flex gap-3 items-start">
                  <InfoIcon className="w-5 h-5 text-secondary mt-0.5 shrink-0" />
                  <p className="text-sm text-neutral/60">
                    Agent features are coming soon. Your profile type will update right away.
                  </p>
                </div>
              </div>
            )}

            {showRcConfirm && (
              <div className="border border-base-300 rounded-xl p-4">
                <RcVerificationPanel
                  selectedRc={selectedRc}
                  onSelectedRcChange={setSelectedRc}
                  onError={setRoleError}
                  title="Verify your regional center"
                />
                <button
                  type="button"
                  className="btn btn-primary btn-sm rounded-full mt-4"
                  disabled={!selectedRc || savingRole}
                  onClick={confirmRcRole}
                >
                  {savingRole ? (
                    <span className="loading loading-spinner loading-sm" />
                  ) : (
                    'Save profile type & request verification'
                  )}
                </button>
              </div>
            )}

            {roleError && <p className="text-error text-sm">{roleError}</p>}
          </div>

          {profile.role === 'rc_operator' && rcMembership && !showRcConfirm && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-neutral/70">
                {rcMembership.regional_centers?.name || 'Regional center'}
              </span>
              {rcMembership.verified_at ? (
                <span className="badge bg-secondary text-secondary-content badge-sm gap-1 rounded-full">
                  <CheckIcon className="w-3 h-3" />
                  Verified
                </span>
              ) : (
                <span className="badge bg-copper/15 text-copper border border-copper/30 badge-sm gap-1 rounded-full">
                  <ClockIcon className="w-3 h-3" />
                  Verification pending
                </span>
              )}
            </div>
          )}

          <textarea
            className="textarea textarea-bordered w-full text-sm"
            placeholder="Bio (optional)"
            rows={2}
            defaultValue={profile.bio || ''}
            onBlur={(e) => {
              if (e.target.value !== (profile.bio || '')) {
                saveProfile({ bio: e.target.value || null });
              }
            }}
          />

          {profile.role === 'investor' && !roleChanged && (
            <fieldset className="flex flex-wrap gap-4 text-sm">
              <legend className="sr-only">Investor stage</legend>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="stage"
                  className="radio radio-sm radio-primary"
                  checked={profile.investor_stage === 'considering'}
                  onChange={() => saveProfile({ investor_stage: 'considering' })}
                />
                Considering EB-5
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="stage"
                  className="radio radio-sm radio-primary"
                  checked={profile.investor_stage === 'invested'}
                  onChange={() => saveProfile({ investor_stage: 'invested' })}
                />
                Already Invested
              </label>
            </fieldset>
          )}

          <div className="form-control max-w-xs">
            <label className="label py-1">
              <span className="label-text text-meta">Country of birth</span>
            </label>
            <CountrySelect
              value={findCountry(profile.country_of_birth)?.code || profile.country_of_birth}
              onChange={(country) => {
                const next = country?.code || null;
                if (next !== profile.country_of_birth) {
                  saveProfile({ country_of_birth: next });
                }
              }}
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer text-sm">
            <input
              type="checkbox"
              className="toggle toggle-sm toggle-primary"
              checked={profile.show_profile_public}
              onChange={(e) => saveProfile({ show_profile_public: e.target.checked })}
            />
            Profile visible to others
          </label>

          <div className="border-t border-base-300/70 pt-6 space-y-4 max-w-md">
            <h2 className="font-semibold text-primary">Settings</h2>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                className="toggle toggle-primary"
                checked={profile.email_notifications}
                onChange={(e) => saveProfile({ email_notifications: e.target.checked })}
              />
              <span className="text-sm">Email notifications</span>
            </label>
            <div className="text-sm space-y-1">
              <p>
                <span className="text-neutral/50">Email:</span> {profile.email}
              </p>
              <p>
                <span className="text-neutral/50">Joined:</span> {formatDate(profile.created_at)}
              </p>
            </div>
            <button type="button" className="btn btn-error btn-outline btn-sm" onClick={deleteAccount}>
              Delete account
            </button>
          </div>
        </div>

        {message && <p className="text-sm text-success">{message}</p>}
      </div>
    </div>
  );
}

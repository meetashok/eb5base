'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { ROLE_OPTIONS } from '@/lib/constants';
import type { InvestorStage, RegionalCenter, UserRole } from '@/lib/types';

type RcPick = Pick<RegionalCenter, 'id' | 'name' | 'uscis_rc_id'>;

function ProgressDots({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex justify-center gap-2 mb-8">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={`w-8 h-1 rounded-full transition-colors duration-200 ${
            i + 1 <= step ? 'bg-primary' : 'bg-base-300'
          }`}
        />
      ))}
    </div>
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

function RoleIcon({ role }: { role: UserRole }) {
  const common = 'w-7 h-7 text-primary';
  if (role === 'investor') {
    return (
      <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
        <path d="M4 19V5M4 19h16M8 15l3-4 3 2 4-6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (role === 'rc_operator') {
    return (
      <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
        <path d="M3 21h18M5 21V8l7-4 7 4v13M9 21v-6h6v6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (role === 'attorney') {
    return (
      <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
        <path d="M12 3v3M7 8h10l-1.5 8h-7L7 8zM9 21h6M10 16v5M14 16v5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path
        d="M8 14a4 4 0 118 0M6 20a4 4 0 018 0M16 20a4 4 0 014 0M12 11a3 3 0 100-6 3 3 0 000 6zM18 10a2.5 2.5 0 100-5 2.5 2.5 0 000 5z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function ProfileSetupPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [displayName, setDisplayName] = useState('');
  const [countryOfBirth, setCountryOfBirth] = useState('');
  const [role, setRole] = useState<UserRole | null>(null);
  const [investorStage, setInvestorStage] = useState<InvestorStage | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const [rcSearch, setRcSearch] = useState('');
  const [rcResults, setRcResults] = useState<RcPick[]>([]);
  const [selectedRc, setSelectedRc] = useState<RcPick | null>(null);
  const [showAddRc, setShowAddRc] = useState(false);
  const [newRcName, setNewRcName] = useState('');
  const [newRcId, setNewRcId] = useState('');
  const [copied, setCopied] = useState(false);

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

      if (profile?.profile_completed) {
        router.replace('/');
        return;
      }

      setDisplayName(profile?.display_name || metaName);
      if (profile?.country_of_birth) setCountryOfBirth(profile.country_of_birth);
      if (profile?.role) setRole(profile.role);
      if (profile?.investor_stage) setInvestorStage(profile.investor_stage as InvestorStage);
      setLoading(false);
    });
  }, [router]);

  useEffect(() => {
    if (step !== 3 || role !== 'rc_operator') return;
    const q = rcSearch.trim();
    if (q.length < 2 || selectedRc?.name === q) {
      setRcResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('regional_centers')
        .select('id, name, uscis_rc_id')
        .ilike('name', `%${q}%`)
        .order('name')
        .limit(10);
      setRcResults(data || []);
    }, 250);
    return () => clearTimeout(timer);
  }, [rcSearch, step, role, selectedRc]);

  async function handleComplete() {
    if (!userId || !role) return;
    if (role === 'investor' && !investorStage) return;
    setSaving(true);
    setError(null);
    const supabase = createClient();
    const { error: err } = await supabase
      .from('profiles')
      .update({
        display_name: displayName.trim(),
        country_of_birth: countryOfBirth.trim() || null,
        role,
        investor_stage: role === 'investor' ? investorStage : null,
        profile_completed: true,
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

  async function handleCompleteRcOperator() {
    if (!userId || !selectedRc) return;
    setSaving(true);
    setError(null);
    const supabase = createClient();

    const { error: profileErr } = await supabase
      .from('profiles')
      .update({
        display_name: displayName.trim(),
        country_of_birth: countryOfBirth.trim() || null,
        role: 'rc_operator',
        investor_stage: null,
        profile_completed: true,
      })
      .eq('id', userId);

    if (profileErr) {
      setSaving(false);
      setError(profileErr.message);
      return;
    }

    const { error: membershipErr } = await supabase.from('rc_memberships').insert({
      rc_id: selectedRc.id,
      user_id: userId,
      role: 'editor',
      active: true,
      verified_at: null,
    });

    setSaving(false);
    if (membershipErr) {
      setError(membershipErr.message);
      return;
    }

    router.push('/');
    router.refresh();
  }

  async function addRegionalCenter() {
    if (!newRcName.trim()) return;
    setSaving(true);
    setError(null);
    const supabase = createClient();
    const { data, error: err } = await supabase
      .from('regional_centers')
      .insert({
        name: newRcName.trim(),
        uscis_rc_id: newRcId.trim() || null,
      })
      .select('id, name, uscis_rc_id')
      .single();
    setSaving(false);
    if (err) {
      setError(err.message);
      return;
    }
    if (data) {
      setSelectedRc(data);
      setRcSearch(data.name);
      setRcResults([]);
      setShowAddRc(false);
    }
  }

  async function copyVerifyEmail() {
    try {
      await navigator.clipboard.writeText('verify@eb5base.com');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Could not copy email address');
    }
  }

  if (loading) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16">
        <div className="skeleton-shimmer h-8 w-56 mx-auto mb-4" />
        <div className="skeleton-shimmer h-64 w-full" />
      </div>
    );
  }

  const totalSteps = 3;

  return (
    <div className="max-w-lg mx-auto px-4 py-16">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-primary">Welcome to EB5 Base</h1>
        <p className="text-neutral/60 mt-2">Let&apos;s set up your profile</p>
      </div>

      <ProgressDots step={step} total={totalSteps} />

      {step === 1 && (
        <div className="card card-bordered shadow-sm bg-base-100">
          <div className="card-body">
            <h2 className="text-lg font-bold text-primary mb-4">Tell us about yourself</h2>

            <div className="form-control mb-4">
              <label className="label">
                <span className="label-text font-medium">Display Name</span>
              </label>
              <input
                type="text"
                className="input input-bordered"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
              />
            </div>

            <div className="form-control mb-6">
              <label className="label">
                <span className="label-text font-medium">Country of Birth</span>
              </label>
              <input
                type="text"
                className="input input-bordered"
                value={countryOfBirth}
                onChange={(e) => setCountryOfBirth(e.target.value)}
                placeholder="Optional"
              />
              <label className="label">
                <span className="label-text-alt text-neutral/50">
                  Optional — not displayed publicly
                </span>
              </label>
            </div>

            <button
              type="button"
              className="btn btn-primary w-full"
              disabled={!displayName.trim()}
              onClick={() => setStep(2)}
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="card card-bordered shadow-sm bg-base-100">
          <div className="card-body">
            <h2 className="text-lg font-bold text-primary mb-2">What&apos;s your role?</h2>
            <p className="text-sm text-neutral/60 mb-6">This helps us tailor your experience</p>

            <div className="grid grid-cols-2 gap-3">
              {ROLE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setRole(opt.value)}
                  className={`card card-bordered p-4 text-left transition-all duration-150 hover:shadow-md cursor-pointer ${
                    role === opt.value
                      ? 'border-primary border-2 bg-primary/5'
                      : 'hover:border-primary/30'
                  }`}
                >
                  <div className="mb-2">
                    <RoleIcon role={opt.value} />
                  </div>
                  <h3 className="font-bold text-sm">{opt.label}</h3>
                  <p className="text-xs text-neutral/60 mt-1">{opt.description}</p>
                </button>
              ))}
            </div>

            <div className="flex gap-3 mt-6">
              <button type="button" className="btn btn-ghost flex-1" onClick={() => setStep(1)}>
                Back
              </button>
              <button
                type="button"
                className="btn btn-primary flex-1"
                disabled={!role}
                onClick={() => setStep(3)}
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {step === 3 && role === 'investor' && (
        <div className="card card-bordered shadow-sm bg-base-100">
          <div className="card-body">
            <h2 className="text-lg font-bold text-primary mb-2">Where are you in your journey?</h2>

            <div className="flex flex-col gap-3 my-4">
              {(
                [
                  {
                    value: 'considering' as const,
                    title: 'Considering EB-5',
                    desc: "I'm researching projects and regional centers",
                  },
                  {
                    value: 'invested' as const,
                    title: 'Already Invested',
                    desc: "I've made an EB-5 investment",
                  },
                ] as const
              ).map((opt) => (
                <label
                  key={opt.value}
                  className={`card card-bordered p-4 cursor-pointer transition-all ${
                    investorStage === opt.value
                      ? 'border-primary border-2 bg-primary/5'
                      : 'hover:border-primary/30'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="stage"
                      className="radio radio-primary"
                      checked={investorStage === opt.value}
                      onChange={() => setInvestorStage(opt.value)}
                    />
                    <div>
                      <span className="font-semibold">{opt.title}</span>
                      <p className="text-xs text-neutral/60">{opt.desc}</p>
                    </div>
                  </div>
                </label>
              ))}
            </div>

            {error && <p className="text-error text-sm mb-2">{error}</p>}

            <div className="flex gap-3 mt-4">
              <button type="button" className="btn btn-ghost flex-1" onClick={() => setStep(2)}>
                Back
              </button>
              <button
                type="button"
                className="btn btn-primary flex-1"
                disabled={!investorStage || saving}
                onClick={handleComplete}
              >
                {saving ? 'Saving…' : 'Complete Setup'}
              </button>
            </div>
          </div>
        </div>
      )}

      {step === 3 && (role === 'attorney' || role === 'agent') && (
        <div className="card card-bordered shadow-sm bg-base-100">
          <div className="card-body">
            <h2 className="text-lg font-bold text-primary mb-2">
              {role === 'attorney' ? 'Attorney Profile' : 'Agent Profile'}
            </h2>

            <div className="bg-base-200 rounded-xl p-5 my-4">
              <div className="flex gap-3 items-start">
                <InfoIcon className="w-6 h-6 text-secondary mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-sm">
                    {role === 'attorney' ? 'Attorney' : 'Agent'} features are coming soon
                  </p>
                  <p className="text-sm text-neutral/60 mt-1">
                    {role === 'attorney'
                      ? "You'll be able to claim your firm's profile, list your EB-5 expertise, and connect with investors. For now, you can browse projects and confirm subscription status like any other user."
                      : "You'll be able to create your agent profile, list the regional centers you represent, and connect with potential investors. For now, you can browse projects and confirm subscription status like any other user."}
                  </p>
                </div>
              </div>
            </div>

            {error && <p className="text-error text-sm mb-2">{error}</p>}

            <div className="flex gap-3 mt-4">
              <button type="button" className="btn btn-ghost flex-1" onClick={() => setStep(2)}>
                Back
              </button>
              <button
                type="button"
                className="btn btn-primary flex-1"
                disabled={saving}
                onClick={handleComplete}
              >
                {saving ? 'Saving…' : 'Complete Setup'}
              </button>
            </div>
          </div>
        </div>
      )}

      {step === 3 && role === 'rc_operator' && (
        <div className="card card-bordered shadow-sm bg-base-100">
          <div className="card-body">
            <h2 className="text-lg font-bold text-primary mb-4">Regional Center Verification</h2>

            <div className="form-control mb-4">
              <label className="label">
                <span className="label-text font-medium">
                  Which regional center do you work for?
                </span>
              </label>
              <input
                type="text"
                className="input input-bordered"
                placeholder="Search regional centers..."
                value={rcSearch}
                onChange={(e) => {
                  setRcSearch(e.target.value);
                  setSelectedRc(null);
                  setShowAddRc(false);
                }}
                autoComplete="off"
              />
              {rcResults.length > 0 && !selectedRc && (
                <ul className="menu bg-base-100 shadow-lg rounded-lg mt-1 border border-base-300 max-h-48 overflow-auto z-10">
                  {rcResults.map((rc) => (
                    <li key={rc.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedRc(rc);
                          setRcSearch(rc.name);
                          setRcResults([]);
                        }}
                      >
                        <span className="font-medium">{rc.name}</span>
                        {rc.uscis_rc_id && (
                          <span className="text-xs text-neutral/50 ml-2">{rc.uscis_rc_id}</span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {rcSearch.length > 2 && rcResults.length === 0 && !selectedRc && !showAddRc && (
                <div className="mt-2">
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm text-secondary"
                    onClick={() => {
                      setShowAddRc(true);
                      setNewRcName(rcSearch.trim());
                    }}
                  >
                    + Don&apos;t see your regional center? Add it
                  </button>
                </div>
              )}
            </div>

            {showAddRc && (
              <div className="bg-base-200 rounded-lg p-4 mb-4">
                <h3 className="text-sm font-semibold mb-3">Add your regional center</h3>
                <div className="form-control mb-3">
                  <label className="label">
                    <span className="label-text text-sm">RC Name</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered input-sm"
                    value={newRcName}
                    onChange={(e) => setNewRcName(e.target.value)}
                  />
                </div>
                <div className="form-control mb-3">
                  <label className="label">
                    <span className="label-text text-sm">USCIS RC ID</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered input-sm"
                    value={newRcId}
                    onChange={(e) => setNewRcId(e.target.value)}
                    placeholder="e.g. ID1031910107 (optional)"
                  />
                </div>
                <button
                  type="button"
                  className="btn btn-sm btn-secondary"
                  disabled={!newRcName.trim() || saving}
                  onClick={addRegionalCenter}
                >
                  Add Regional Center
                </button>
              </div>
            )}

            {selectedRc && (
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-5 my-4">
                <h3 className="font-bold text-sm text-primary mb-3">
                  Verify your role at {selectedRc.name}
                </h3>
                <p className="text-sm text-neutral/70 mb-4">
                  To confirm you work at this regional center, please send an email from your{' '}
                  <strong>work email address</strong> to:
                </p>

                <div className="bg-base-100 rounded-lg p-3 mb-4 flex items-center justify-between border border-base-300 gap-2">
                  <span className="font-mono text-sm font-semibold">verify@eb5base.com</span>
                  <button type="button" className="btn btn-ghost btn-xs" onClick={copyVerifyEmail}>
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>

                <div className="text-sm text-neutral/70 space-y-2">
                  <p>
                    <strong>Subject:</strong> Verify - {selectedRc.name}
                  </p>
                  <p>
                    <strong>Include:</strong> Your name and your position at the regional center
                  </p>
                </div>

                <div className="divider my-3" />

                <p className="text-xs text-neutral/50">
                  We&apos;ll review your request within 24-48 hours and notify you by email once
                  verified. You can use EB5 Base right away while verification is pending.
                </p>
              </div>
            )}

            {error && <p className="text-error text-sm mb-2">{error}</p>}

            <div className="flex gap-3 mt-4">
              <button type="button" className="btn btn-ghost flex-1" onClick={() => setStep(2)}>
                Back
              </button>
              <button
                type="button"
                className="btn btn-primary flex-1"
                disabled={!selectedRc || saving}
                onClick={handleCompleteRcOperator}
              >
                {saving ? 'Saving…' : 'Complete Setup'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

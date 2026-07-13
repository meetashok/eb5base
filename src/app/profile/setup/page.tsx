'use client';

import { useEffect, useState } from 'react';
import { BrandWordmark } from '@/components/Logo';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import CountrySelect from '@/components/CountrySelect';
import RolePicker from '@/components/profile/RolePicker';
import RcVerificationPanel, { type BrandPick } from '@/components/profile/RcVerificationPanel';
import { findCountry } from '@/lib/countries';
import { applyRoleChange } from '@/lib/profile-role';
import type { InvestorStage, UserRole } from '@/lib/types';

function ProgressDots({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex justify-center gap-2 mb-8">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={`w-8 h-1 rounded-full transition-all duration-300 ${
            i + 1 <= step ? 'bg-primary scale-100' : 'bg-base-300'
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

export default function ProfileSetupPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [displayName, setDisplayName] = useState('');
  const [countryOfBirth, setCountryOfBirth] = useState<string | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [investorStage, setInvestorStage] = useState<InvestorStage | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [signInEmail, setSignInEmail] = useState<string | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<BrandPick | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) {
        router.replace('/login?redirect=/profile/setup');
        return;
      }
      setUserId(data.user.id);
      setSignInEmail(data.user.email || null);
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

      if (profile?.profile_completed && profile?.role) {
        router.replace('/');
        return;
      }

      setDisplayName(profile?.display_name || metaName);
      if (profile?.country_of_birth) {
        const match = findCountry(profile.country_of_birth);
        setCountryOfBirth(match?.code || profile.country_of_birth);
      }
      if (profile?.investor_stage) setInvestorStage(profile.investor_stage as InvestorStage);
      setLoading(false);
    });
  }, [router]);

  async function saveBasics() {
    if (!userId) return;
    const supabase = createClient();
    await supabase
      .from('profiles')
      .update({
        display_name: displayName.trim(),
        country_of_birth: countryOfBirth || null,
      })
      .eq('id', userId);
  }

  async function handleComplete() {
    if (!userId || !role) return;
    if (role === 'investor' && !investorStage) return;
    setSaving(true);
    setError(null);
    await saveBasics();

    const result = await applyRoleChange({
      userId,
      role,
      investorStage: role === 'investor' ? investorStage : null,
    });

    setSaving(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.push('/');
    router.refresh();
  }

  async function handleCompleteRcOperator() {
    if (!userId || !selectedBrand) return;
    setSaving(true);
    setError(null);
    await saveBasics();

    const result = await applyRoleChange({
      userId,
      role: 'rc_operator',
      brandId: selectedBrand.id,
    });

    setSaving(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }

    router.push('/');
    router.refresh();
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
        <h1 className="text-3xl font-bold text-primary flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
          Welcome to <BrandWordmark variant="on-light" className="text-[1.05em]" />
        </h1>
        <p className="text-neutral/60 mt-2">Let&apos;s set up your profile</p>
      </div>

      <ProgressDots step={step} total={totalSteps} />

      {step === 1 && (
        <div className="card-elevated bg-base-100">
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
              <CountrySelect
                value={countryOfBirth}
                onChange={(country) => setCountryOfBirth(country?.code || null)}
              />
              <label className="label">
                <span className="label-text-alt text-neutral/50">
                  Optional. Not displayed publicly.
                </span>
              </label>
            </div>

            <button
              type="button"
              className="btn btn-primary w-full rounded-full"
              disabled={!displayName.trim()}
              onClick={() => setStep(2)}
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="card-elevated bg-base-100">
          <div className="card-body">
            <h2 className="text-lg font-bold text-primary mb-2">What&apos;s your role?</h2>
            <p className="text-sm text-neutral/60 mb-6">This helps us tailor your experience</p>

            <RolePicker value={role} onChange={setRole} />

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                className="btn btn-ghost flex-1 rounded-full"
                onClick={() => setStep(1)}
              >
                Back
              </button>
              <button
                type="button"
                className="btn btn-primary flex-1 rounded-full"
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
        <div className="card-elevated bg-base-100">
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
                  className={`card-elevated p-4 cursor-pointer transition-all duration-150 ${
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
                      <span className="font-semibold text-sm">{opt.title}</span>
                      <p className="text-xs text-neutral/60">{opt.desc}</p>
                    </div>
                  </div>
                </label>
              ))}
            </div>

            {error && <p className="text-error text-sm mb-2">{error}</p>}

            <div className="flex gap-3 mt-4">
              <button
                type="button"
                className="btn btn-ghost flex-1 rounded-full"
                onClick={() => setStep(2)}
              >
                Back
              </button>
              <button
                type="button"
                className="btn btn-primary flex-1 rounded-full"
                disabled={!investorStage || saving}
                onClick={handleComplete}
              >
                {saving ? <span className="loading loading-spinner loading-sm" /> : 'Complete Setup'}
              </button>
            </div>
          </div>
        </div>
      )}

      {step === 3 && (role === 'attorney' || role === 'agent') && (
        <div className="card-elevated bg-base-100">
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
              <button
                type="button"
                className="btn btn-ghost flex-1 rounded-full"
                onClick={() => setStep(2)}
              >
                Back
              </button>
              <button
                type="button"
                className="btn btn-primary flex-1 rounded-full"
                disabled={saving}
                onClick={handleComplete}
              >
                {saving ? <span className="loading loading-spinner loading-sm" /> : 'Complete Setup'}
              </button>
            </div>
          </div>
        </div>
      )}

      {step === 3 && role === 'rc_operator' && (
        <div className="card-elevated bg-base-100">
          <div className="card-body">
            <RcVerificationPanel
              selectedBrand={selectedBrand}
              onSelectedBrandChange={setSelectedBrand}
              onError={setError}
              signInEmail={signInEmail}
            />

            {error && <p className="text-error text-sm mb-2">{error}</p>}

            <div className="flex gap-3 mt-4">
              <button
                type="button"
                className="btn btn-ghost flex-1 rounded-full"
                onClick={() => setStep(2)}
              >
                Back
              </button>
              <button
                type="button"
                className="btn btn-primary flex-1 rounded-full"
                disabled={!selectedBrand || saving}
                onClick={handleCompleteRcOperator}
              >
                {saving ? <span className="loading loading-spinner loading-sm" /> : 'Complete Setup'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

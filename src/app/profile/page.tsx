'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import CountrySelect from '@/components/CountrySelect';
import { ROLE_BADGE_LABELS } from '@/lib/constants';
import { findCountry } from '@/lib/countries';
import type {
  ContentSubmission,
  Profile,
  Project,
  ProjectVote,
  RcBrand,
  RcMembership,
} from '@/lib/types';
import { PROJECT_SELECT } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import { brandPath, projectEditPath, projectPath } from '@/lib/slugs';
import { statusBadgeClass, statusLabel } from '@/lib/approvals';

type Tab = 'confirmations' | 'projects' | 'submissions' | 'investments' | 'settings';

interface ConfirmationRow extends ProjectVote {
  projects?: {
    id: string;
    name: string;
    slug?: string | null;
    brand_id?: string | null;
    rc_brands?: { id: string; slug?: string | null } | null;
  } | null;
}

interface SubmissionRow extends ContentSubmission {
  title: string;
}

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

export default function ProfilePage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('confirmations');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [rcMembership, setRcMembership] = useState<RcMembership | null>(null);
  const [confirmations, setConfirmations] = useState<ConfirmationRow[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [brands, setBrands] = useState<RcBrand[]>([]);
  const [submissions, setSubmissions] = useState<SubmissionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const t = new URLSearchParams(window.location.search).get('tab');
    if (
      t === 'confirmations' ||
      t === 'projects' ||
      t === 'submissions' ||
      t === 'investments' ||
      t === 'settings'
    ) {
      setTab(t);
    }
  }, []);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) {
        router.replace('/login?redirect=/profile');
        return;
      }
      const [
        { data: p },
        { data: v },
        { data: myProjects },
        { data: membership },
        brandsRes,
        subsRes,
      ] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', auth.user.id).single(),
        supabase
          .from('project_votes')
          .select('*, projects:project_id(id, name, slug, brand_id, rc_brands!brand_id(id, slug))')
          .eq('user_id', auth.user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('projects')
          .select(PROJECT_SELECT)
          .eq('added_by', auth.user.id)
          .is('merged_into', null)
          .order('created_at', { ascending: false }),
        supabase
          .from('rc_memberships')
          .select('*, regional_centers(id, name)')
          .eq('user_id', auth.user.id)
          .eq('active', true)
          .maybeSingle(),
        supabase
          .from('rc_brands')
          .select('*')
          .eq('added_by', auth.user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('content_submissions')
          .select('*')
          .eq('submitted_by', auth.user.id)
          .order('created_at', { ascending: false }),
      ]);
      setProfile(p);
      setNameDraft(p?.display_name || '');
      setConfirmations((v as ConfirmationRow[]) || []);
      setProjects((myProjects as Project[]) || []);
      setRcMembership((membership as RcMembership) || null);
      setBrands(brandsRes.error ? [] : ((brandsRes.data as RcBrand[]) || []));

      const subRows = subsRes.error ? [] : ((subsRes.data as ContentSubmission[]) || []);
      const enriched: SubmissionRow[] = [];
      for (const s of subRows) {
        let title =
          typeof s.payload?.name === 'string'
            ? s.payload.name
            : `${s.entity_type} ${s.entity_id.slice(0, 8)}`;
        if (s.entity_type === 'project') {
          const match = (myProjects as Project[] | null)?.find((x) => x.id === s.entity_id);
          if (match?.name) title = match.name;
        } else {
          const match = (brandsRes.data as RcBrand[] | null)?.find((x) => x.id === s.entity_id);
          if (match?.name) title = match.name;
        }
        enriched.push({ ...s, title });
      }
      setSubmissions(enriched);
      setLoading(false);
    })();
  }, [router]);

  const investments = useMemo(
    () => confirmations.filter((v) => v.invested),
    [confirmations]
  );

  const confirmationsByMonth = useMemo(() => {
    const groups = new Map<string, ConfirmationRow[]>();
    for (const v of confirmations) {
      const d = new Date(v.created_at);
      const key = d.toLocaleString('en-US', { month: 'long', year: 'numeric' });
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(v);
    }
    return Array.from(groups.entries());
  }, [confirmations]);

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

  const tabs: { id: Tab; label: string }[] = [
    { id: 'confirmations', label: 'My Confirmations' },
    { id: 'projects', label: 'My Projects' },
    { id: 'submissions', label: 'My Submissions' },
    { id: 'investments', label: 'My Investments' },
    { id: 'settings', label: 'Settings' },
  ];

  const roleLabel = profile.role ? ROLE_BADGE_LABELS[profile.role] : null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row gap-4 items-start mb-8">
        {profile.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.avatar_url}
            alt=""
            className="w-16 h-16 rounded-full object-cover"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-primary text-primary-content flex items-center justify-center text-xl font-bold">
            {(profile.display_name || profile.email || 'U').charAt(0).toUpperCase()}
          </div>
        )}
        <div className="flex-1 space-y-3 w-full">
          <div className="flex flex-wrap items-center gap-2">
            {editingName ? (
              <input
                className="input input-bordered input-sm"
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
            {roleLabel && (
              <span className="badge badge-primary badge-outline rounded-full">{roleLabel}</span>
            )}
            {profile.is_admin && (
              <Link href="/admin" className="badge badge-secondary rounded-full">
                Admin
              </Link>
            )}
          </div>

          {profile.role === 'rc_operator' && rcMembership && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-neutral/70">
                {rcMembership.regional_centers?.name || 'Regional center'}
              </span>
              {rcMembership.verified_at ? (
                <span className="badge badge-success badge-sm gap-1 rounded-full">
                  <CheckIcon className="w-3 h-3" />
                  Verified
                </span>
              ) : (
                <span className="badge badge-warning badge-outline badge-sm gap-1 rounded-full">
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

          {profile.role === 'investor' && (
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
              value={
                findCountry(profile.country_of_birth)?.code || profile.country_of_birth
              }
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
        </div>
      </div>

      {message && <p className="text-sm text-success mb-4">{message}</p>}

      <div className="tabs tabs-bordered mb-6 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`tab ${tab === t.id ? 'tab-active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'confirmations' && (
        <div className="space-y-6">
          {confirmations.length === 0 ? (
            <p className="text-neutral/60">You haven&apos;t confirmed any project statuses yet.</p>
          ) : (
            confirmationsByMonth.map(([month, rows]) => (
              <div key={month}>
                <h3 className="font-semibold text-primary mb-2">{month}</h3>
                <ul className="space-y-2">
                  {rows.map((v) => (
                    <li
                      key={v.id}
                      className="flex flex-wrap gap-2 justify-between text-sm border-b border-base-300 py-2"
                    >
                      <Link
                        href={
                          v.projects
                            ? projectPath(v.projects)
                            : `/projects/${v.project_id}`
                        }
                        className="link link-secondary font-medium"
                      >
                        {v.projects?.name || 'Project'}
                      </Link>
                      <span>
                        confirmed {v.subscription_status === 'open' ? 'Open' : 'Closed'}
                        {v.invested ? ' · invested' : ''} · {formatDate(v.created_at)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'projects' && (
        <ul className="space-y-2">
          {projects.length === 0 ? (
            <p className="text-neutral/60">
              No projects yet.{' '}
              <Link href="/projects/add" className="link link-secondary">
                Add one
              </Link>
              .
            </p>
          ) : (
            projects.map((p) => (
              <li
                key={p.id}
                className="flex flex-wrap items-center justify-between gap-2 border-b border-base-300 py-3"
              >
                <div>
                  <Link href={projectPath(p)} className="link link-secondary font-medium">
                    {p.name}
                  </Link>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span className={`badge badge-sm rounded-full ${statusBadgeClass(p.status)}`}>
                      {statusLabel(p.status)}
                    </span>
                    <p className="text-meta text-neutral/50">Added {formatDate(p.created_at)}</p>
                  </div>
                  {p.status === 'rejected' && p.rejection_reason && (
                    <p className="text-sm text-error mt-1">Reason: {p.rejection_reason}</p>
                  )}
                </div>
                <Link
                  href={projectEditPath(p)}
                  className="btn btn-outline btn-sm transition-all duration-150"
                >
                  Edit
                </Link>
              </li>
            ))
          )}
        </ul>
      )}

      {tab === 'submissions' && (
        <ul className="space-y-2">
          {submissions.length === 0 && brands.length === 0 ? (
            <p className="text-neutral/60">
              No submissions yet. When you add or edit a project or regional center, it will
              show up here for review.
            </p>
          ) : (
            <>
              {submissions.map((s) => (
                <li
                  key={s.id}
                  className="border-b border-base-300 py-3 space-y-1"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-medium text-primary">{s.title}</p>
                      <p className="text-meta text-neutral/50">
                        {s.action === 'create' ? 'Created' : 'Edited'}{' '}
                        {s.entity_type === 'project' ? 'project' : 'regional center'}
                        {' · '}
                        {formatDate(s.created_at)}
                      </p>
                    </div>
                    <span className={`badge badge-sm rounded-full ${statusBadgeClass(s.status)}`}>
                      {statusLabel(s.status)}
                    </span>
                  </div>
                  {s.status === 'rejected' && s.rejection_reason && (
                    <p className="text-sm text-error">Reason: {s.rejection_reason}</p>
                  )}
                  {s.status === 'pending' && (
                    <p className="text-sm text-neutral/50">
                      Waiting for an admin to review your submission.
                    </p>
                  )}
                </li>
              ))}
              {brands.map((b) => (
                <li
                  key={`brand-${b.id}`}
                  className="border-b border-base-300 py-3 space-y-1"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <Link href={brandPath(b)} className="font-medium link link-secondary">
                        {b.name}
                      </Link>
                      <p className="text-meta text-neutral/50">
                        Regional center · {formatDate(b.created_at)}
                      </p>
                    </div>
                    <span className={`badge badge-sm rounded-full ${statusBadgeClass(b.status)}`}>
                      {statusLabel(b.status)}
                    </span>
                  </div>
                  {b.status === 'rejected' && b.rejection_reason && (
                    <p className="text-sm text-error">Reason: {b.rejection_reason}</p>
                  )}
                </li>
              ))}
            </>
          )}
        </ul>
      )}

      {tab === 'investments' && (
        <ul className="space-y-2">
          {investments.length === 0 ? (
            <p className="text-neutral/60">No investments reported yet.</p>
          ) : (
            investments.map((v) => (
              <li
                key={v.id}
                className="flex flex-wrap justify-between gap-2 border-b border-base-300 py-3 text-sm"
              >
                <Link
                  href={
                    v.projects ? projectPath(v.projects) : `/projects/${v.project_id}`
                  }
                  className="link link-secondary font-medium"
                >
                  {v.projects?.name || 'Project'}
                </Link>
                <span>
                  Invested {formatDate(v.investment_date)} · reported {formatDate(v.created_at)}
                </span>
              </li>
            ))
          )}
        </ul>
      )}

      {tab === 'settings' && (
        <div className="space-y-6 max-w-md">
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
      )}
    </div>
  );
}

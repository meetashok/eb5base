'use client';

import Link from 'next/link';
import { AddProjectLink } from '@/components/AuthGatedLinks';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import CountrySelect from '@/components/CountrySelect';
import { ROLE_BADGE_LABELS } from '@/lib/constants';
import { findCountry } from '@/lib/countries';
import type {
  ContentSubmission,
  DuplicateReportGroup,
  Profile,
  Project,
  ProjectVote,
  RcBrand,
  RcMembership,
} from '@/lib/types';
import { PROJECT_SELECT } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import { brandPath, projectEditPath, projectPath } from '@/lib/slugs';
import {
  duplicateStatusBadgeClass,
  duplicateStatusLabel,
  statusBadgeClass,
  statusLabel,
} from '@/lib/approvals';

type Tab = 'confirmations' | 'projects' | 'activity' | 'settings';

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

interface DuplicateReportRow extends DuplicateReportGroup {
  title: string;
  duplicate_titles: string[];
}

type ActivityKind = 'submission' | 'duplicate' | 'brand';

interface ActivityRow {
  id: string;
  kind: ActivityKind;
  title: string;
  subtitle: string;
  status: string | null;
  statusClass: string;
  statusText: string;
  created_at: string;
  rejection_reason?: string | null;
  href?: string | null;
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
  const [duplicateReports, setDuplicateReports] = useState<DuplicateReportRow[]>([]);
  const [claimedProjects, setClaimedProjects] = useState<Project[]>([]);
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
      t === 'activity' ||
      t === 'submissions' ||
      t === 'settings'
    ) {
      setTab(t === 'submissions' ? 'activity' : (t as Tab));
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
        dupRes,
        claimedRes,
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
        supabase
          .from('duplicate_report_groups')
          .select('*')
          .eq('reported_by', auth.user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('projects')
          .select(PROJECT_SELECT)
          .eq('claimed_by', auth.user.id)
          .is('merged_into', null)
          .order('claimed_at', { ascending: false }),
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
      setClaimedProjects((claimedRes.data as Project[]) || []);

      const dupRows = dupRes.error ? [] : ((dupRes.data as DuplicateReportGroup[]) || []);
      const enrichedDups: DuplicateReportRow[] = [];
      for (const d of dupRows) {
        const table = d.entity_type === 'project' ? 'projects' : 'rc_brands';
        const { data: reported } = await supabase
          .from(table)
          .select('name')
          .eq('id', d.reported_entity_id)
          .maybeSingle();
        const duplicateTitles: string[] = [];
        for (const dupId of d.duplicate_entity_ids || []) {
          const { data: dup } = await supabase
            .from(table)
            .select('name')
            .eq('id', dupId)
            .maybeSingle();
          if (dup?.name) duplicateTitles.push(dup.name);
        }
        enrichedDups.push({
          ...d,
          title: reported?.name || d.reported_entity_id.slice(0, 8),
          duplicate_titles: duplicateTitles,
        });
      }
      setDuplicateReports(enrichedDups);
      setLoading(false);
    })();
  }, [router]);

  const tabs: { id: Tab; label: string }[] = [
    { id: 'confirmations', label: 'My Confirmations' },
    { id: 'projects', label: 'My Projects' },
    { id: 'activity', label: 'My Activity' },
    { id: 'settings', label: 'Settings' },
  ];

  const activityRows = useMemo((): ActivityRow[] => {
    const rows: ActivityRow[] = [];

    for (const s of submissions) {
      rows.push({
        id: `sub-${s.id}`,
        kind: 'submission',
        title: s.title,
        subtitle: `${s.action === 'create' ? 'Created' : 'Edited'} ${
          s.entity_type === 'project' ? 'project' : 'regional center'
        }`,
        status: s.status,
        statusClass: statusBadgeClass(s.status),
        statusText: statusLabel(s.status),
        created_at: s.created_at,
        rejection_reason: s.rejection_reason,
        href:
          s.entity_type === 'project'
            ? projectPath({ id: s.entity_id, slug: null })
            : brandPath({ id: s.entity_id, slug: null }),
      });
    }

    for (const b of brands) {
      if (submissions.some((s) => s.entity_type === 'rc_brand' && s.entity_id === b.id)) {
        continue;
      }
      rows.push({
        id: `brand-${b.id}`,
        kind: 'brand',
        title: b.name,
        subtitle: 'Regional center',
        status: b.status,
        statusClass: statusBadgeClass(b.status),
        statusText: statusLabel(b.status),
        created_at: b.created_at,
        rejection_reason: b.rejection_reason,
        href: brandPath(b),
      });
    }

    for (const d of duplicateReports) {
      rows.push({
        id: `dup-${d.id}`,
        kind: 'duplicate',
        title: d.title,
        subtitle: `Duplicate report${
          d.duplicate_titles.length ? `: ${d.duplicate_titles.join(', ')}` : ''
        } · ${d.entity_type === 'project' ? 'Project' : 'Regional center'}`,
        status: d.status,
        statusClass: duplicateStatusBadgeClass(d.status),
        statusText: duplicateStatusLabel(d.status),
        created_at: d.created_at,
        href:
          d.entity_type === 'project'
            ? projectPath({ id: d.reported_entity_id, slug: null })
            : brandPath({ id: d.reported_entity_id, slug: null }),
      });
    }

    return rows.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [submissions, brands, duplicateReports]);

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

  const roleLabel = profile.role ? ROLE_BADGE_LABELS[profile.role] : null;

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
            <div className="flex-1 space-y-2 w-full">
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
              <div className="flex flex-wrap items-center gap-2">
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
            </div>
          </div>
        </div>
      </section>

    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="card-elevated p-6 mb-8 -mt-6 relative z-10 shadow-lift">
      <div className="space-y-4">

          {profile.role === 'rc_operator' && rcMembership && (
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

      <div className="tabs tabs-bordered mb-6 overflow-x-auto [&_.tab-active]:text-secondary [&_.tab-active]:border-secondary">
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
                        confirmed {v.subscription_status === 'open' ? 'Open' : 'Closed'} ·{' '}
                        {formatDate(v.created_at)}
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
        <div className="space-y-8">
          <ul className="space-y-2">
            {projects.length === 0 ? (
              <p className="text-neutral/60">
                No projects yet.{' '}
                <AddProjectLink className="link link-secondary">
                  Add one
                </AddProjectLink>
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
                      {p.rc_verified_at && (
                        <span className="badge badge-sm bg-secondary/15 text-secondary border border-secondary/30 rounded-full">
                          RC verified
                        </span>
                      )}
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

          {claimedProjects.length > 0 && (
            <div>
              <h3 className="font-semibold text-primary mb-3">Projects I&apos;ve claimed</h3>
              <ul className="space-y-2">
                {claimedProjects.map((p) => (
                  <li
                    key={`claimed-${p.id}`}
                    className="flex flex-wrap items-center justify-between gap-2 border-b border-base-300 py-3"
                  >
                    <div>
                      <Link href={projectPath(p)} className="link link-secondary font-medium">
                        {p.name}
                      </Link>
                      <p className="text-meta text-neutral/50 mt-1">
                        Claimed {p.claimed_at ? formatDate(p.claimed_at) : '—'}
                      </p>
                    </div>
                    <Link
                      href={projectEditPath(p)}
                      className="btn btn-outline btn-sm transition-all duration-150"
                    >
                      Edit
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {tab === 'activity' && (
        <ul className="space-y-2">
          {activityRows.length === 0 ? (
            <p className="text-neutral/60">
              No activity yet. When you add or edit a project, report a duplicate, or submit a
              regional center, it will show up here.
            </p>
          ) : (
            activityRows.map((row) => (
              <li key={row.id} className="border-b border-base-300 py-3 space-y-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    {row.href ? (
                      <Link href={row.href} className="font-medium link link-secondary">
                        {row.title}
                      </Link>
                    ) : (
                      <p className="font-medium text-primary">{row.title}</p>
                    )}
                    <p className="text-meta text-neutral/50">
                      {row.subtitle} · {formatDate(row.created_at)}
                    </p>
                  </div>
                  <span className={`badge badge-sm rounded-full ${row.statusClass}`}>
                    {row.statusText}
                  </span>
                </div>
                {row.rejection_reason && (
                  <p className="text-sm text-error">Reason: {row.rejection_reason}</p>
                )}
                {row.kind !== 'duplicate' && row.status === 'pending' && (
                  <p className="text-sm text-neutral/50">
                    Waiting for an admin to review your submission.
                  </p>
                )}
                {row.kind === 'duplicate' && row.status === 'pending' && (
                  <p className="text-sm text-neutral/50">
                    An admin will review this duplicate report.
                  </p>
                )}
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
    </div>
  );
}

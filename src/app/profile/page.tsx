'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import type { Profile, Project, ProjectVote } from '@/lib/types';
import { PROJECT_SELECT } from '@/lib/types';
import { formatDate } from '@/lib/utils';

type Tab = 'votes' | 'projects' | 'investments' | 'settings';

interface VoteRow extends ProjectVote {
  projects?: Pick<Project, 'id' | 'name'> | null;
}

export default function ProfilePage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('votes');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [votes, setVotes] = useState<VoteRow[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) {
        router.replace('/login?redirect=/profile');
        return;
      }
      const [{ data: p }, { data: v }, { data: myProjects }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', auth.user.id).single(),
        supabase
          .from('project_votes')
          .select('*, projects:project_id(id, name)')
          .eq('user_id', auth.user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('projects')
          .select('*')
          .eq('added_by', auth.user.id)
          .is('merged_into', null)
          .order('created_at', { ascending: false }),
      ]);
      setProfile(p);
      setNameDraft(p?.display_name || '');
      setVotes((v as VoteRow[]) || []);
      setProjects((myProjects as Project[]) || []);
      setLoading(false);
    })();
  }, [router]);

  const investments = useMemo(() => votes.filter((v) => v.invested), [votes]);

  const votesByMonth = useMemo(() => {
    const groups = new Map<string, VoteRow[]>();
    for (const v of votes) {
      const d = new Date(v.created_at);
      const key = d.toLocaleString('en-US', { month: 'long', year: 'numeric' });
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(v);
    }
    return Array.from(groups.entries());
  }, [votes]);

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
    { id: 'votes', label: 'My Votes' },
    { id: 'projects', label: 'My Projects' },
    { id: 'investments', label: 'My Investments' },
    { id: 'settings', label: 'Settings' },
  ];

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
            <span className="badge badge-ghost rounded-full capitalize">
              {profile.role?.replace('_', ' ')}
            </span>
          </div>

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

          <label className="form-control max-w-xs">
            <span className="label-text text-meta mb-1">Country of birth</span>
            <input
              type="text"
              className="input input-bordered input-sm"
              defaultValue={profile.country_of_birth || ''}
              onBlur={(e) => {
                if (e.target.value !== (profile.country_of_birth || '')) {
                  saveProfile({ country_of_birth: e.target.value || null });
                }
              }}
            />
          </label>

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

      {tab === 'votes' && (
        <div className="space-y-6">
          {votes.length === 0 ? (
            <p className="text-neutral/60">You haven&apos;t cast any votes yet.</p>
          ) : (
            votesByMonth.map(([month, rows]) => (
              <div key={month}>
                <h3 className="font-semibold text-primary mb-2">{month}</h3>
                <ul className="space-y-2">
                  {rows.map((v) => (
                    <li
                      key={v.id}
                      className="flex flex-wrap gap-2 justify-between text-sm border-b border-base-300 py-2"
                    >
                      <Link
                        href={`/projects/${v.projects?.id || v.project_id}`}
                        className="link link-secondary font-medium"
                      >
                        {v.projects?.name || 'Project'}
                      </Link>
                      <span>
                        voted {v.subscription_status === 'open' ? 'Open' : 'Closed'}
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
              <Link href="/projects/new" className="link link-secondary">
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
                  <Link href={`/projects/${p.id}`} className="link link-secondary font-medium">
                    {p.name}
                  </Link>
                  <p className="text-meta text-neutral/50">Added {formatDate(p.created_at)}</p>
                </div>
                <Link
                  href={`/projects/${p.id}/edit`}
                  className="btn btn-outline btn-sm transition-all duration-150"
                >
                  Edit
                </Link>
              </li>
            ))
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
                  href={`/projects/${v.projects?.id || v.project_id}`}
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

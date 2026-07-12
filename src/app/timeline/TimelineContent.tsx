'use client';

import Link from 'next/link';
import { AddProjectLink } from '@/components/AuthGatedLinks';
import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import PageHero from '@/components/PageHero';
import {
  buildTimelineEvents,
  fetchUserContributions,
  filterTimelineEvents,
  type TimelineEvent,
  type TimelineFilter,
} from '@/lib/user-contributions';

const FILTERS: { id: TimelineFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'confirmations', label: 'Confirmations' },
  { id: 'projects', label: 'Projects' },
  { id: 'reports', label: 'Reports' },
];

function kindLabel(kind: TimelineEvent['kind']): string {
  switch (kind) {
    case 'confirmation':
      return 'Confirmation';
    case 'project_added':
      return 'Project added';
    case 'project_claimed':
      return 'Project claimed';
    case 'submission':
      return 'Submission';
    case 'duplicate':
      return 'Duplicate report';
    case 'brand':
      return 'Regional center';
    default:
      return 'Activity';
  }
}

export default function TimelineContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const filterParam = searchParams.get('filter');
  const filter: TimelineFilter =
    filterParam === 'confirmations' ||
    filterParam === 'projects' ||
    filterParam === 'reports'
      ? filterParam
      : 'all';

  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) {
        router.replace('/login?redirect=/timeline');
        return;
      }
      const data = await fetchUserContributions(supabase, auth.user.id);
      setEvents(buildTimelineEvents(data));
      setLoading(false);
    })();
  }, [router]);

  const filtered = useMemo(
    () => filterTimelineEvents(events, filter),
    [events, filter]
  );

  function setFilter(next: TimelineFilter) {
    const params = new URLSearchParams();
    if (next !== 'all') params.set('filter', next);
    const qs = params.toString();
    router.push(qs ? `/timeline?${qs}` : '/timeline');
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="skeleton-shimmer h-16 w-full mb-6" />
        <div className="skeleton-shimmer h-48 w-full" />
      </div>
    );
  }

  return (
    <div>
      <PageHero
        eyebrow="Your contributions"
        title="My Timeline"
        subtitle="Confirmations, projects, and reports — everything you've added to the community directory."
      />

      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex flex-wrap gap-2 mb-6">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              className={`btn btn-sm rounded-full ${
                filter === f.id ? 'btn-secondary' : 'btn-outline border-base-300'
              }`}
              onClick={() => setFilter(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="card-elevated py-12 text-center px-6">
            <h2 className="text-lg font-bold text-neutral/80">Nothing here yet</h2>
            <p className="text-sm text-neutral/50 mt-2 mb-4">
              Browse projects, confirm subscription status, or add a project the community is
              missing.
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              <Link href="/projects" className="btn btn-primary btn-sm rounded-full">
                Browse projects
              </Link>
              <AddProjectLink className="btn btn-outline btn-sm rounded-full">
                Add a project
              </AddProjectLink>
            </div>
          </div>
        ) : (
          <ul className="space-y-0 divide-y divide-base-300/70">
            {filtered.map((row) => (
              <li key={row.id} className="py-4 first:pt-0">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-widest text-neutral/45 font-semibold mb-1">
                      {kindLabel(row.kind)}
                    </p>
                    {row.href ? (
                      <Link href={row.href} className="font-semibold text-primary link link-secondary">
                        {row.title}
                      </Link>
                    ) : (
                      <p className="font-semibold text-primary">{row.title}</p>
                    )}
                    <p className="text-sm text-neutral/55 mt-0.5">{row.subtitle}</p>
                  </div>
                  {row.statusText && row.statusClass && (
                    <span className={`badge badge-sm rounded-full shrink-0 ${row.statusClass}`}>
                      {row.statusText}
                    </span>
                  )}
                </div>
                {row.rejection_reason && (
                  <p className="text-sm text-error mt-2">Reason: {row.rejection_reason}</p>
                )}
              </li>
            ))}
          </ul>
        )}

        <p className="text-sm text-neutral/50 mt-8 text-center">
          <Link href="/profile" className="link link-secondary">
            Profile and settings
          </Link>
        </p>
      </div>
    </div>
  );
}

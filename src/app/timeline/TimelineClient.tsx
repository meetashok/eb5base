'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import CopyButton from '@/components/CopyButton';
import StatusBadge from '@/components/StatusBadge';
import { WOM_STATUS_OPTIONS } from '@/lib/constants';
import { caseStatusVariant, formatDate, timeAgo } from '@/lib/utils';
import type {
  CaseStatusHistory,
  IndividualWithCases,
  Profile,
  WomCase,
} from '@/lib/types';

export default function TimelineClient({
  individuals,
  historyByCase,
  wom,
  profile,
}: {
  individuals: IndividualWithCases[];
  historyByCase: Record<string, CaseStatusHistory[]>;
  wom: WomCase[];
  profile: Profile | null;
}) {
  const router = useRouter();
  const primaryIdx = Math.max(
    0,
    individuals.findIndex((i) => i.is_primary)
  );
  const [tab, setTab] = useState(primaryIdx);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const active = individuals[tab] || individuals[0];

  const lastChecked = useMemo(() => {
    const times = (active?.cases || [])
      .map((c) => c.last_polled_at)
      .filter(Boolean) as string[];
    if (!times.length) return null;
    return times.sort().reverse()[0];
  }, [active]);

  useEffect(() => {
    fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'mark_timeline_viewed' }),
    }).catch(() => {});
  }, []);

  async function checkNow() {
    setRefreshing(true);
    setMessage(null);
    try {
      const res = await fetch('/api/cases/refresh', { method: 'POST' });
      const json = await res.json();
      if (res.status === 429) {
        setMessage(json.message || 'Please wait before checking again.');
      } else if (!res.ok) {
        setMessage(json.error || 'Refresh failed');
      } else {
        setMessage(`Checked ${json.checked} case(s). ${json.changed} updated.`);
        router.refresh();
      }
    } catch {
      setMessage('Network error');
    } finally {
      setRefreshing(false);
    }
  }

  const lastViewed = profile?.last_viewed_timeline_at
    ? new Date(profile.last_viewed_timeline_at).getTime()
    : 0;

  if (!individuals.length) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="alert alert-info">No cases yet. Add receipt numbers in Settings.</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] font-semibold text-secondary mb-2">
            My timeline
          </p>
          <h1 className="text-3xl font-bold text-primary">Case status</h1>
          <p className="text-sm text-neutral/60 mt-1">
            Last checked: {lastChecked ? timeAgo(lastChecked) : 'never'}
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary rounded-full"
          onClick={checkNow}
          disabled={refreshing}
        >
          {refreshing ? <span className="loading loading-spinner loading-sm" /> : 'Check now'}
        </button>
      </div>

      {message && <div className="alert mb-4 text-sm">{message}</div>}

      <div className="tabs tabs-boxed bg-base-200/60 p-1 mb-6 flex-wrap">
        {individuals.map((ind, idx) => (
          <button
            key={ind.id}
            type="button"
            className={`tab ${tab === idx ? 'tab-active' : ''}`}
            onClick={() => setTab(idx)}
          >
            {ind.tag}
          </button>
        ))}
      </div>

      <div className="space-y-5">
        {(active?.cases || []).map((c) => {
          const hist = historyByCase[c.id] || [];
          const isNew =
            c.status_updated_at && new Date(c.status_updated_at).getTime() > lastViewed;
          return (
            <div key={c.id} className="card-elevated">
              <div className="card-body gap-3">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="font-bold text-primary text-lg">{c.form_type}</h2>
                      {isNew && (
                        <span className="badge badge-accent badge-sm text-accent-content">NEW</span>
                      )}
                      {c.poll_error && (
                        <StatusBadge label="Needs attention" variant="warning" />
                      )}
                    </div>
                    <div className="flex items-center gap-1 mt-1 font-mono text-sm text-neutral/80">
                      <span>{c.receipt_number || c.receipt_number_masked}</span>
                      {c.receipt_number && <CopyButton value={c.receipt_number} />}
                    </div>
                  </div>
                  <p className="text-sm text-neutral/50">Filed: {formatDate(c.filed_date)}</p>
                </div>

                <div className="border-l-2 border-secondary/40 pl-4 space-y-3 mt-2">
                  {hist.length === 0 && (
                    <p className="text-sm text-neutral/50">No status history yet.</p>
                  )}
                  {hist.map((h, idx) => (
                    <div key={h.id} className="relative">
                      <div className="absolute -left-[1.35rem] top-1.5 w-2.5 h-2.5 rounded-full bg-secondary" />
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm text-neutral/50">
                          {formatDate(h.status_date || h.detected_at)}
                        </span>
                        {idx === 0 && (
                          <StatusBadge
                            label="current"
                            variant={caseStatusVariant(h.status)}
                            className="badge-sm"
                          />
                        )}
                      </div>
                      <p className="text-sm font-medium text-neutral mt-0.5">{h.status}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
        {!active?.cases?.length && (
          <div className="alert">No receipt numbers for this person yet.</div>
        )}
      </div>

      {wom.length > 0 && (
        <div className="mt-10">
          <h2 className="text-xl font-bold text-primary mb-3">Writ of Mandamus</h2>
          <div className="space-y-3">
            {wom.map((w) => (
              <div key={w.id} className="card-elevated">
                <div className="card-body text-sm gap-1">
                  <p>
                    <strong>{w.related_form_type}</strong> ·{' '}
                    {WOM_STATUS_OPTIONS.find((o) => o.value === w.wom_status)?.label || w.wom_status}
                  </p>
                  <p className="text-neutral/60">
                    {w.court_district || 'Court not listed'} · Filed {formatDate(w.filed_date)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

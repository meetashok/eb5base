'use client';

import Link from 'next/link';
import CountdownBadge from '@/components/nprm/CountdownBadge';
import VolumeChart from '@/components/nprm/VolumeChart';
import NprmDisclaimer from '@/components/nprm/NprmDisclaimer';
import type { NprmLastCheck, NprmStats } from '@/lib/nprm/types';
import {
  DOCKET_URL,
  DOCUMENT_URL,
  FR_CITATION,
  RIN,
  commentsSince,
  dailyVolume,
} from '@/lib/nprm/utils';
import type { NprmComment, NprmTheme } from '@/lib/nprm/types';
import { FEED_SHARE } from '@/lib/nprm/fetch';

interface Props {
  stats: NprmStats;
  themes: NprmTheme[];
  comments: NprmComment[];
  lastCheck: NprmLastCheck | null;
  feedSource: 'remote' | 'local';
  onWrite: () => void;
}

export default function OverviewTab({
  stats,
  themes,
  comments,
  lastCheck,
  feedSource,
  onWrite,
}: Props) {
  const volume = dailyVolume(comments);
  const sinceAug3 = commentsSince(comments, '2026-08-03');
  const fr =
    lastCheck?.metadata.federal_register_citation || FR_CITATION;
  const rin = lastCheck?.metadata.rin || RIN;
  const ends =
    stats.comment_period_ends ||
    lastCheck?.metadata.comment_period_ends ||
    'Aug 31, 2026 11:59 PM EDT';

  return (
    <div className="space-y-8 animate-[fadeIn_0.35s_ease-out]">
      <header className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 space-y-2">
            <p className="text-xs uppercase tracking-[0.2em] font-semibold text-secondary">
              USCIS EB-5 NPRM Tracker
            </p>
            <h2 className="text-2xl md:text-3xl font-bold text-primary leading-tight">
              Docket {stats.docket_id}
            </h2>
            <p className="text-sm text-neutral/70 leading-relaxed max-w-2xl">
              {lastCheck?.metadata.document_title ||
                'EB-5 Reform and Integrity Act of 2022; Ensuring the Integrity of the EB-5 Program; Automatic Revocation of Petitions for Immigrant Classification'}
            </p>
            <div className="flex flex-wrap gap-2 text-xs text-neutral/60">
              <span className="badge badge-ghost border border-base-300 font-medium">
                {fr}
              </span>
              <span className="badge badge-ghost border border-base-300 font-medium">
                RIN {rin}
              </span>
              <a
                href={DOCUMENT_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="badge badge-ghost border border-base-300 font-medium hover:border-secondary hover:text-secondary"
              >
                Proposed rule
              </a>
            </div>
          </div>
          <CountdownBadge endsLabel={ends} />
        </div>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Comments', value: String(stats.total_comments) },
          {
            label: 'Since Aug 3',
            value: sinceAug3 > 0 ? `+${sinceAug3}` : String(sinceAug3),
          },
          { label: 'Themes', value: String(themes.length) },
          { label: 'Last pull', value: stats.last_pull },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-lg border border-base-300/80 bg-base-100/80 px-3 py-3"
          >
            <p className="text-[11px] uppercase tracking-wider text-neutral/50 font-semibold">
              {stat.label}
            </p>
            <p className="mt-1 text-lg font-bold text-primary tabular-nums leading-tight">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <section className="rounded-xl border border-base-300/80 bg-surface-warm p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3 mb-4">
          <h3 className="font-semibold text-primary">Daily comment volume</h3>
          <span className="text-xs text-neutral/50">
            {comments.length} plotted
          </span>
        </div>
        <VolumeChart data={volume} />
      </section>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between rounded-xl border border-secondary/25 bg-secondary/5 px-4 py-4">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-primary">Trust & source</p>
          <p className="text-sm text-neutral/65 leading-relaxed">
            Source: {stats.source}. Feed{' '}
            <span className="font-medium">
              {feedSource === 'remote' ? 'live' : 'local seed'}
            </span>
            . Docket{' '}
            <a
              href={DOCKET_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="link link-hover text-secondary"
            >
              regulations.gov/{stats.docket_id}
            </a>
            . Public data share:{' '}
            <a
              href={FEED_SHARE}
              target="_blank"
              rel="noopener noreferrer"
              className="link link-hover text-secondary break-all"
            >
              agent.meta.ai space
            </a>
            .
          </p>
        </div>
        <button
          type="button"
          onClick={onWrite}
          className="btn btn-accent text-accent-content shadow-soft shrink-0"
        >
          Write a distinct comment
        </button>
      </div>

      <NprmDisclaimer />
      <p className="text-xs text-neutral/45">
        Prefer tabs over scrolling — jump to Themes, Comments, Write, or About.{' '}
        <Link href="/nprm?tab=about" className="link link-hover">
          How to file
        </Link>
      </p>
    </div>
  );
}

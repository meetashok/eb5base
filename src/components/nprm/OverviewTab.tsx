'use client';

import CountdownBadge from '@/components/nprm/CountdownBadge';
import VolumeChart from '@/components/nprm/VolumeChart';
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
  onAbout: () => void;
}

export default function OverviewTab({
  stats,
  themes,
  comments,
  lastCheck,
  feedSource,
  onWrite,
  onAbout,
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
      <header className="space-y-4 rounded-xl border-2 border-base-300 bg-base-100 p-4 sm:p-5 shadow-soft">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 space-y-2">
            <p className="text-xs uppercase tracking-[0.18em] font-bold text-secondary">
              What this NPRM covers
            </p>
            <h2 className="text-xl md:text-2xl font-bold text-primary leading-tight">
              <a
                href={DOCKET_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline underline-offset-4 decoration-secondary/40"
              >
                {stats.docket_id}
              </a>
            </h2>
            <p className="text-sm text-neutral leading-relaxed max-w-2xl">
              {lastCheck?.metadata.document_title ||
                'EB-5 Reform and Integrity Act of 2022; Ensuring the Integrity of the EB-5 Program; Automatic Revocation of Petitions for Immigrant Classification'}
            </p>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="inline-flex items-center rounded-md border border-base-300 bg-base-200 px-2.5 py-1 font-semibold text-neutral">
                {fr}
              </span>
              <span className="inline-flex items-center rounded-md border border-base-300 bg-base-200 px-2.5 py-1 font-semibold text-neutral">
                RIN {rin}
              </span>
              <a
                href={DOCUMENT_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center rounded-md border border-secondary/40 bg-secondary/10 px-2.5 py-1 font-semibold text-secondary hover:bg-secondary/15"
              >
                Read proposed rule ↗
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
            className="rounded-xl border-2 border-base-300 bg-base-100 px-3 py-3 shadow-sm"
          >
            <p className="text-[11px] uppercase tracking-wider text-neutral/70 font-bold">
              {stat.label}
            </p>
            <p className="mt-1 text-lg font-bold text-primary tabular-nums leading-tight">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <section className="rounded-xl border-2 border-base-300 bg-base-100 p-4 sm:p-5 shadow-soft">
        <div className="flex items-center justify-between gap-3 mb-4">
          <h3 className="font-bold text-primary">Daily comment volume</h3>
          <span className="text-xs font-medium text-neutral/70">
            {comments.length} plotted
          </span>
        </div>
        <VolumeChart data={volume} />
      </section>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between rounded-xl border-2 border-secondary/30 bg-secondary/10 px-4 py-4">
        <div className="space-y-1">
          <p className="text-sm font-bold text-primary">Trust & source</p>
          <p className="text-sm text-neutral leading-relaxed">
            Source: {stats.source}. Feed{' '}
            <span className="font-semibold">
              {feedSource === 'remote' ? 'live' : 'local seed'}
            </span>
            . Docket{' '}
            <a
              href={DOCKET_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-secondary underline underline-offset-2"
            >
              regulations.gov/{stats.docket_id}
            </a>
            . Public data:{' '}
            <a
              href={FEED_SHARE}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-secondary underline underline-offset-2 break-all"
            >
              agent.meta.ai space
            </a>
            .
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 shrink-0">
          <button
            type="button"
            onClick={onWrite}
            className="btn btn-accent text-accent-content shadow-soft"
          >
            Write a distinct comment
          </button>
          <button
            type="button"
            onClick={onAbout}
            className="btn btn-outline border-neutral/30"
          >
            About & disclaimer
          </button>
        </div>
      </div>
    </div>
  );
}

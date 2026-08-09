'use client';

import CountdownBadge from '@/components/nprm/CountdownBadge';
import VolumeChart from '@/components/nprm/VolumeChart';
import WhyComment from '@/components/nprm/WhyComment';
import type {
  NprmComment,
  NprmLastCheck,
  NprmProposalSummary,
  NprmStats,
} from '@/lib/nprm/types';
import {
  DOCKET_URL,
  FR_CITATION,
  RIN,
  dailyVolume,
  formatLastPull,
  plainDash,
} from '@/lib/nprm/utils';
import { FEED_SHARE } from '@/lib/nprm/fetch';

interface Props {
  stats: NprmStats;
  comments: NprmComment[];
  proposal: NprmProposalSummary | null;
  lastCheck: NprmLastCheck | null;
  feedSource: 'remote' | 'local';
  onThemes: () => void;
  onComments: () => void;
  onWrite: () => void;
  onAbout: () => void;
}

function Chevron({ open }: { open?: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={`h-5 w-5 shrink-0 text-neutral/50 transition-transform ${
        open ? 'rotate-180' : ''
      }`}
      aria-hidden
    >
      <path
        fillRule="evenodd"
        d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export default function OverviewTab({
  stats,
  comments,
  proposal,
  lastCheck,
  feedSource,
  onThemes,
  onComments,
  onWrite,
  onAbout,
}: Props) {
  const volume = dailyVolume(comments);
  const ends =
    stats.comment_period_ends ||
    lastCheck?.metadata?.comment_period_ends ||
    proposal?.comment_deadline ||
    'Aug 31, 2026 11:59 PM EDT';
  const lastPullLabel = formatLastPull(stats.last_pull);
  const sourceUrl =
    proposal?.source_url ||
    'https://www.govinfo.gov/content/pkg/FR-2026-07-02/pdf/2026-13392.pdf';
  const frHtml = 'https://www.federalregister.gov/d/2026-13392';
  const short = proposal?.short_summary;
  const longThemes = proposal?.long_summary_by_theme ?? [];
  const whyComment = proposal?.why_comment || proposal?.why_participate;

  return (
    <div className="space-y-8 animate-[fadeIn_0.35s_ease-out]">
      <header className="space-y-4 rounded-xl border-2 border-base-300 bg-base-100 p-4 sm:p-5 shadow-soft">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 space-y-3 max-w-3xl">
            <p className="text-xs uppercase tracking-[0.18em] font-bold text-secondary">
              NPRM explainer
            </p>
            <h2 className="text-xl md:text-2xl font-bold text-primary leading-tight">
              {short?.title ? plainDash(short.title) : 'What USCIS proposes - in plain English'}
            </h2>
            <p className="text-sm sm:text-[0.95rem] text-neutral leading-relaxed">
              {short?.text
                ? plainDash(short.text)
                : 'Plain-language summary of Docket USCIS-2026-0100 is loading from the public feed. Open the Federal Register PDF for the official text.'}
            </p>
            {short?.citations?.length ? (
              <div className="flex flex-wrap gap-2">
                {short.citations.map((c) => (
                  <a
                    key={c}
                    href={frHtml}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center rounded-md border border-base-300 bg-base-200 px-2.5 py-1 text-[11px] font-semibold text-neutral hover:border-secondary/50 hover:text-secondary"
                  >
                    {plainDash(c.replace(/^\[/, '').replace(/\]$/, ''))}
                  </a>
                ))}
              </div>
            ) : null}
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="inline-flex items-center rounded-md border border-base-300 bg-base-200 px-2.5 py-1 font-semibold text-neutral">
                FR Doc 2026-13392
              </span>
              <span className="inline-flex items-center rounded-md border border-base-300 bg-base-200 px-2.5 py-1 font-semibold text-neutral">
                Vol 91 No 126
              </span>
              <span className="inline-flex items-center rounded-md border border-base-300 bg-base-200 px-2.5 py-1 font-semibold text-neutral">
                July 2 2026
              </span>
              <span className="inline-flex items-center rounded-md border border-base-300 bg-base-200 px-2.5 py-1 font-semibold text-neutral">
                RIN {RIN}
              </span>
              <span className="inline-flex items-center rounded-md border border-base-300 bg-base-200 px-2.5 py-1 font-semibold text-neutral">
                {FR_CITATION}
              </span>
              <span className="inline-flex items-center rounded-md border border-secondary/40 bg-secondary/10 px-2.5 py-1 font-semibold text-secondary">
                {stats.total_comments} comments tracked · last pull {lastPullLabel}
              </span>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              <a
                href={sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-sm btn-primary text-primary-content"
              >
                Read full 358-page proposal PDF
              </a>
              <a
                href={frHtml}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-sm btn-outline border-neutral/30"
              >
                Federal Register HTML
              </a>
              <a
                href={DOCKET_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-sm btn-outline border-neutral/30"
              >
                Docket USCIS-2026-0100
              </a>
            </div>
            {proposal?.plain_language_note ? (
              <p className="text-xs text-neutral/80 leading-relaxed rounded-md border border-amber-200/80 bg-amber-50 px-2.5 py-1.5 text-amber-900">
                {plainDash(proposal.plain_language_note)}
              </p>
            ) : null}
          </div>
          <CountdownBadge endsLabel={ends} />
        </div>
      </header>

      <section className="space-y-3" id="proposal-themes">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-primary">
              What the proposal covers
            </h3>
            <p className="text-sm text-neutral mt-1 max-w-2xl leading-relaxed">
              Twelve plain-language sections. Each paraphrases USCIS text and
              cites the Federal Register page so you can verify.
            </p>
          </div>
          <p className="text-xs font-semibold text-neutral/70">
            {longThemes.length || 12} sections
          </p>
        </div>

        <div className="space-y-2">
          {longThemes.map((theme) => (
            <details
              key={theme.theme_id}
              className="group rounded-xl border-2 border-base-300 bg-base-100 shadow-sm open:shadow-soft"
            >
              <summary className="cursor-pointer list-none px-4 py-3 sm:px-5 sm:py-3.5 flex items-start justify-between gap-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary rounded-xl">
                <span className="font-semibold text-primary text-sm sm:text-base leading-snug">
                  {plainDash(theme.title)}
                </span>
                <span className="mt-0.5 shrink-0" aria-hidden>
                  <span className="group-open:hidden">
                    <Chevron />
                  </span>
                  <span className="hidden group-open:inline">
                    <Chevron open />
                  </span>
                </span>
              </summary>
              <div className="px-4 pb-4 sm:px-5 sm:pb-5 space-y-3 border-t border-base-300/80 pt-3">
                <p className="text-sm text-neutral leading-relaxed">
                  {plainDash(theme.plain_text)}
                </p>
                {theme.uscis_phrasing ? (
                  <details className="rounded-lg border border-base-300 bg-base-200/50">
                    <summary className="cursor-pointer px-3 py-2 text-xs font-bold uppercase tracking-wider text-neutral/80">
                      What USCIS actually said
                    </summary>
                    <p className="px-3 pb-3 text-sm text-neutral leading-relaxed">
                      {plainDash(theme.uscis_phrasing)}
                    </p>
                  </details>
                ) : null}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center rounded-md border border-base-300 bg-base-200 px-2.5 py-1 text-[11px] font-semibold text-neutral">
                    {plainDash(theme.citation.replace(/^\[/, '').replace(/\]$/, ''))}
                  </span>
                  <a
                    href={theme.source_link || frHtml}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center rounded-md border border-secondary/40 bg-secondary/10 px-2.5 py-1 text-[11px] font-semibold text-secondary hover:bg-secondary/15"
                  >
                    Open FR ↗
                  </a>
                </div>
              </div>
            </details>
          ))}
          {longThemes.length === 0 && (
            <p className="text-sm text-neutral rounded-xl border-2 border-dashed border-base-300 p-4">
              Proposal theme summaries are unavailable. Open the Federal Register
              PDF above for the official text.
            </p>
          )}
        </div>
      </section>

      {whyComment ? (
        <WhyComment
          why={whyComment}
          onThemes={onThemes}
          onComments={onComments}
        />
      ) : null}

      <div className="flex flex-col sm:flex-row gap-2">
        <button
          type="button"
          onClick={onThemes}
          className="btn btn-primary text-primary-content shadow-soft"
        >
          See what others are saying
        </button>
        <button
          type="button"
          onClick={onWrite}
          className="btn btn-accent text-accent-content shadow-soft"
        >
          Write your own comment
        </button>
      </div>

      <section className="space-y-4" id="comment-stats">
        <div>
          <h3 className="text-lg font-bold text-primary">Comment tracker</h3>
          <p className="text-sm text-neutral mt-1 leading-relaxed">
            <span className="font-semibold text-primary tabular-nums">
              {stats.total_comments} comments
            </span>
            <span className="text-neutral/50 mx-1.5">·</span>
            Last pull {lastPullLabel}
          </p>
        </div>

        <div className="rounded-xl border-2 border-base-300 bg-base-100 p-4 sm:p-5 shadow-soft">
          <div className="flex items-center justify-between gap-3 mb-4">
            <h4 className="font-bold text-primary">Comment volume</h4>
            <span className="text-xs font-medium text-neutral/70">
              Daily bars + cumulative line
            </span>
          </div>
          <VolumeChart data={volume} />
        </div>
      </section>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between rounded-xl border-2 border-secondary/30 bg-secondary/10 px-4 py-4">
        <div className="space-y-1">
          <p className="text-sm font-bold text-primary">Trust & source</p>
          <p className="text-sm text-neutral leading-relaxed">
            Source: {stats.source}. Feed{' '}
            <span className="font-semibold">
              {feedSource === 'remote' ? 'live' : 'local seed'}
            </span>
            . Explainer cites FR Doc 2026-13392. Public JSON (CORS):{' '}
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
        <button
          type="button"
          onClick={onAbout}
          className="btn btn-outline border-neutral/30 shrink-0"
        >
          About & disclaimer
        </button>
      </div>
    </div>
  );
}

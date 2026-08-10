'use client';

import { Suspense, useMemo, useState } from 'react';
import { CitationChips } from '@/components/nprm/CitationChips';
import CountdownBanner from '@/components/nprm/CountdownBanner';
import ImpactMatrix from '@/components/nprm/ImpactMatrix';
import VolumeChart from '@/components/nprm/VolumeChart';
import WhyComment from '@/components/nprm/WhyComment';
import { ListSkeleton } from '@/components/LoadingSkeleton';
import type {
  NprmComment,
  NprmLastCheck,
  NprmProposalSummary,
  NprmStats,
} from '@/lib/nprm/types';
import {
  DOCKET_URL,
  FR_CITATION,
  FR_HTML,
  FR_PDF,
  NPRM_LAST_UPDATED,
  RIN,
  dailyVolume,
  formatLastPull,
  mergeWhyReasons,
  normalizeShortSummary,
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
  onSummary: () => void;
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

const NEW_CLAIMS: { label: string; citations: string }[] = [
  {
    label: 'High Employment Area $1.4M tier',
    citations: '[FR 2026-13392, IV.B Definitions]',
  },
  {
    label: 'Formal 2-year sustainment rule - ends lifetime redeployment debate',
    citations: '[FR 2026-13392, IV.D.6 p 40705-06]',
  },
  {
    label: 'Tiered sanctions regime - fines up to 10% of capital',
    citations: '[FR 2026-13392, II.C]',
  },
  {
    label: 'Form I-527 - new form for good-faith investors whose RC was terminated',
    citations: '[FR 2026-13392, IV.M]',
  },
  {
    label: 'Promoter registration - direct and third-party promoters must be registered',
    citations: '[FR 2026-13392, II.C]',
  },
];

export default function OverviewTab({
  stats,
  comments,
  proposal,
  lastCheck,
  feedSource,
  onThemes,
  onComments,
  onWrite,
  onSummary,
  onAbout,
}: Props) {
  const [themeQuery, setThemeQuery] = useState('');
  const volume = dailyVolume(comments);
  const ends =
    stats.comment_period_ends ||
    lastCheck?.metadata?.comment_period_ends ||
    proposal?.comment_deadline ||
    'August 31, 2026 · 11:59pm ET';
  const lastPullLabel = formatLastPull(stats.last_pull);
  const sourceUrl = proposal?.source_url || FR_PDF;
  const short = normalizeShortSummary(proposal?.short_summary);
  const longThemes = useMemo(
    () => proposal?.long_summary_by_theme ?? [],
    [proposal?.long_summary_by_theme]
  );
  const whyComment = mergeWhyReasons(
    proposal?.why_comment,
    proposal?.why_participate
  );

  const filteredThemes = useMemo(() => {
    const q = themeQuery.trim().toLowerCase();
    if (!q) return longThemes;
    return longThemes.filter((theme) => {
      const hay = `${theme.title} ${theme.plain_text} ${theme.citation}`.toLowerCase();
      return hay.includes(q);
    });
  }, [longThemes, themeQuery]);

  return (
    <div className="space-y-8 animate-[fadeIn_0.35s_ease-out]">
      <header className="space-y-4 rounded-xl border-2 border-base-300 bg-base-100 p-4 sm:p-5 shadow-soft">
        <p className="text-xs uppercase tracking-[0.18em] font-bold text-secondary">
          DHS Notice of Proposed Rulemaking · July 2, 2026
        </p>
        <h2 className="text-xl md:text-2xl font-bold text-primary leading-tight">
          The EB-5 Proposed Rule is Here
        </h2>
        <p className="text-sm sm:text-[0.95rem] text-neutral leading-relaxed max-w-3xl">
          EB5 Base is breaking down the 358-page rule that finally codifies the
          EB-5 Reform and Integrity Act of 2022 into regulation. This is not
          final. DHS is taking public comments for 60 days through August 31,
          2026.
        </p>
        {short?.title ? (
          <p className="text-xs font-bold uppercase tracking-wider text-neutral/70">
            {short.title}
          </p>
        ) : null}
        {short?.text ? (
          <p className="text-sm text-neutral/80 leading-relaxed max-w-3xl">
            {short.text}
          </p>
        ) : null}
        {short?.citations?.length ? (
          <CitationChips citations={short.citations} href={FR_HTML} />
        ) : null}
        <CountdownBanner endsLabel={ends} />
        <div className="flex flex-col gap-2 pt-1">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onWrite}
              data-goatcounter-click="nprm-build-comment"
              className="btn btn-primary text-primary-content"
            >
              Build My Comment
            </button>
            <button
              type="button"
              onClick={onSummary}
              className="btn btn-outline border-neutral/30"
            >
              Read 10-min Summary
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
            <a
              href={sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-secondary underline underline-offset-2 hover:text-primary"
            >
              Full PDF
            </a>
            <span className="text-neutral/30" aria-hidden>
              ·
            </span>
            <a
              href={FR_HTML}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-secondary underline underline-offset-2 hover:text-primary"
            >
              Federal Register HTML
            </a>
            <span className="text-neutral/30" aria-hidden>
              ·
            </span>
            <a
              href={DOCKET_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-secondary underline underline-offset-2 hover:text-primary"
            >
              Docket USCIS-2026-0100
            </a>
          </div>
        </div>
        <p className="text-xs text-neutral/75 leading-relaxed">
          Last updated: {NPRM_LAST_UPDATED} · Source:{' '}
          <a
            href={DOCKET_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-secondary underline underline-offset-2"
          >
            regulations.gov docket
          </a>
          . Community-built · Investor-led. Not legal advice.
        </p>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="inline-flex items-center rounded-md border border-base-300 bg-base-200 px-2.5 py-1 font-semibold text-neutral">
            FR Doc 2026-13392 · {FR_CITATION} · RIN {RIN}
          </span>
          <span className="inline-flex items-center rounded-md border border-secondary/40 bg-secondary/10 px-2.5 py-1 font-semibold text-secondary">
            {stats.total_comments} comments tracked · last pull {lastPullLabel}
          </span>
        </div>
      </header>

      <section className="space-y-3 rounded-xl border-2 border-base-300 bg-base-100 p-4 sm:p-5 shadow-soft">
        <h3 className="text-lg font-bold text-primary">
          In 60 seconds: What&apos;s actually new vs. what&apos;s just being written
          down?
        </h3>
        <p className="text-sm text-neutral leading-relaxed">
          Much of the rule just writes into regulation what Congress already
          decided in 2022.
        </p>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-wider font-bold text-secondary">
              Truly NEW from DHS
            </p>
            <ol className="list-decimal pl-5 space-y-2 text-sm text-neutral leading-relaxed">
              {NEW_CLAIMS.map((claim) => (
                <li key={claim.label} className="space-y-1">
                  <span>{claim.label}</span>
                  <CitationChips citations={claim.citations} href={FR_HTML} />
                </li>
              ))}
            </ol>
          </div>
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-wider font-bold text-neutral/70">
              Codification of what you already live with
            </p>
            <p className="text-sm text-neutral leading-relaxed">
              RIA integrity measures, audits/site visits, fund administration, TEA
              adjudication by USCIS (not states), priority date retention,
              automatic revocation + investor protections.
            </p>
          </div>
        </div>
      </section>

      <Suspense fallback={<ListSkeleton count={2} />}>
        <ImpactMatrix />
      </Suspense>

      <section className="space-y-3" id="proposal-themes">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-primary">
              What the proposal covers
            </h3>
            <p className="text-sm text-neutral mt-1 max-w-2xl leading-relaxed">
              Twelve plain-language sections. Each paraphrases USCIS text and cites
              the Federal Register page so you can verify.
            </p>
          </div>
          <p className="text-xs font-semibold text-neutral/70">
            {filteredThemes.length}
            {filteredThemes.length !== longThemes.length
              ? ` of ${longThemes.length || 12}`
              : ` ${longThemes.length || 12}`}{' '}
            sections
          </p>
        </div>

        <div className="sticky top-[calc(var(--site-sticky-offset)+3.25rem)] z-20 -mx-1 px-1 py-2 bg-base-100/95 backdrop-blur-sm">
          <label
            htmlFor="nprm-theme-filter"
            className="text-[11px] uppercase tracking-wider font-bold text-neutral/70 mb-1.5 block"
          >
            Filter themes
          </label>
          <input
            id="nprm-theme-filter"
            type="search"
            value={themeQuery}
            onChange={(e) => setThemeQuery(e.target.value)}
            placeholder="Keyword: bridge, sustainment, TEA…"
            className="input input-sm input-bordered w-full max-w-md bg-base-100 focus:outline-secondary"
          />
        </div>

        <div className="space-y-2">
          {filteredThemes.map((theme) => (
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
                  <CitationChips
                    citations={theme.citation}
                    href={theme.source_link || FR_HTML}
                  />
                  <a
                    href={theme.source_link || FR_HTML}
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
          {longThemes.length > 0 && filteredThemes.length === 0 && (
            <p className="text-sm text-neutral rounded-xl border-2 border-dashed border-base-300 p-4">
              No themes match that keyword. Clear the filter to see all sections.
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
          className="btn btn-outline border-neutral/30"
        >
          See comment themes
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
            . Explainer cites FR Doc 2026-13392.{' '}
            <a
              href={FEED_SHARE}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-secondary underline underline-offset-2 break-all"
            >
              Public JSON (CORS - agent.meta.ai)
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

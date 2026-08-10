'use client';

import { Suspense, useMemo, useState } from 'react';
import { CitationChips } from '@/components/nprm/CitationChips';
import GlossaryTerm from '@/components/nprm/GlossaryTerm';
import ImpactMatrix from '@/components/nprm/ImpactMatrix';
import NprmSectionHeading from '@/components/nprm/NprmSectionHeading';
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

const KEY_POINTS: {
  title: string;
  body: string;
  legal: string;
}[] = [
  {
    title: 'You may get your investment back after about 2 years, not after many years',
    body: 'Old practice often kept your money stuck until the green card path moved. The draft says your money only needs to stay invested for about 2 years after it reaches the job-creating project, once jobs are created.',
    legal: '2-year sustainment · 8 CFR 216.6',
  },
  {
    title: 'If your regional center fails, you keep your place in line for about 180 days',
    body: 'The draft gives good-faith investors time to find a new sponsor without losing their filing date. If you already finished 2 years and job creation, you may not need to reinvest.',
    legal: 'Form I-527 · good-faith protection',
  },
  {
    title: '$800K stays for now; a new $1.4M tier and Jan 1, 2027 inflation hike are proposed',
    body: 'Rural and high-unemployment projects stay at $800K today, standard stays at $1.05M. A new higher tier is proposed for very low unemployment areas. Amounts rise with inflation on Jan 1, 2027.',
    legal: 'Investment thresholds · 8 CFR 204.6',
  },
  {
    title: 'USCIS, not states, decides if a project qualifies for the lower amount',
    body: 'Whether a project gets the $800K amount is decided centrally. That can be more consistent, but the method needs to be transparent.',
    legal: 'TEA determination',
  },
  {
    title: 'More audits and fines for regional centers',
    body: 'Centers face site visits, reporting, and fines. Many centers are small, so fixed compliance costs can push some out.',
    legal: 'Sanctions and audits',
  },
];

export default function OverviewTab({
  stats,
  comments,
  proposal,
  feedSource,
  onThemes,
  onComments,
  onWrite,
  onSummary,
  onAbout,
}: Props) {
  const [themeQuery, setThemeQuery] = useState('');
  const volume = dailyVolume(comments);
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
    <div className="space-y-8 animate-[fadeIn_0.35s_ease-out] nprm-prose">
      <header
        className="space-y-4 rounded-xl border-2 border-base-300 bg-base-100 p-4 sm:p-5 shadow-soft"
        id="what-is-nprm"
      >
        <NprmSectionHeading
          as="h2"
          eyebrow="Draft rule · comments close August 31, 2026"
          title="What is this draft rule, and does it affect your EB-5 journey?"
        />
        <p className="nprm-tldr">
          TLDR: This is a draft of new EB-5 house rules. It is not final. You can
          tell the agency what you think before the deadline.
        </p>
        <p>
          Think of EB-5 as an apartment building. Congress passed a big renovation
          law in 2022 (the <GlossaryTerm term="RIA" />). Since then, the building
          manager (<GlossaryTerm term="USCIS" />) has been enforcing the new rules
          with memos.
        </p>
        <p>
          Now the manager published a formal draft of the new rulebook:{' '}
          <GlossaryTerm term="NPRM" />, 358 pages, published July 2, 2026. After
          the comment period, they will publish the final rulebook.
        </p>
        <p className="font-semibold text-primary">
          Why should you care? This draft decides three things that affect your
          money:
        </p>
        <ol className="list-decimal pl-5 space-y-2">
          <li>
            When you can get your $800K back (about 2 years vs waiting on a green
            card backlog)
          </li>
          <li>
            What happens if your regional center closes (can you keep your place
            in line)
          </li>
          <li>
            How much future investors will pay ($800K stays for now, but a new
            $1.4M tier is proposed)
          </li>
        </ol>
        {short?.text ? (
          <details className="rounded-lg border border-base-300 bg-base-200/50">
            <summary className="cursor-pointer px-3 py-2 text-xs font-bold uppercase tracking-wider text-neutral/80">
              Official short summary
            </summary>
            <div className="px-3 pb-3 space-y-2">
              {short.title ? (
                <p className="text-xs font-bold uppercase tracking-wider text-neutral/70">
                  {short.title}
                </p>
              ) : null}
              <p className="text-sm text-neutral leading-relaxed">{short.text}</p>
              {short.citations?.length ? (
                <CitationChips citations={short.citations} href={FR_HTML} />
              ) : null}
            </div>
          </details>
        ) : null}
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
          Last updated: {NPRM_LAST_UPDATED}. Not legal advice.{' '}
          <span className="nprm-legal-ref">
            FR Doc 2026-13392 · {FR_CITATION} · RIN {RIN}
          </span>
        </p>
      </header>

      <section className="nprm-callout-action space-y-3" id="do-i-need-to-act">
        <NprmSectionHeading
          eyebrow="Before August 31"
          title="Do I need to do something before the deadline?"
        />
        <p>
          <strong>If you already filed:</strong> You do not have to comment, but
          commenting can help protect your investment. If the 2-year rule is
          finalized, you may get capital back sooner. If good-faith protections
          are strengthened, you are safer if your regional center fails.
        </p>
        <p>
          <strong>If you plan to file:</strong> Pay attention. Investment amounts
          stay $800K for rural and high unemployment and $1.05M standard today,
          but a new $1.4M tier for high employment areas is proposed. Amounts
          will also rise for inflation on Jan 1, 2027.
        </p>
        <p id="india-china">
          <strong>If you are waiting from India or China:</strong> You often wait
          the longest for a visa number. A clear 2-year sustainment rule and
          stronger good-faith protections matter most when your money would
          otherwise sit through a long backlog or forced redeployment.
        </p>
        <p>
          <strong>Action:</strong> Read the 5-minute summary, then use our
          builder to draft a personal comment for regulations.gov. It takes about
          10 minutes. You can submit anonymously. Do not include your A-Number.
        </p>
      </section>

      <section
        className="space-y-3 rounded-xl border-2 border-base-300 bg-base-100 p-4 sm:p-5 shadow-soft"
        id="key-points"
      >
        <NprmSectionHeading
          eyebrow="Key points"
          title="The points that actually matter to you"
        />
        <ol className="space-y-3">
          {KEY_POINTS.map((point, idx) => (
            <li
              key={point.title}
              className="rounded-xl border-2 border-base-300 bg-base-100 p-4 shadow-sm space-y-2"
            >
              <p className="font-bold text-primary leading-snug">
                <span className="text-secondary tabular-nums mr-1.5">
                  {idx + 1}.
                </span>
                {point.title}
              </p>
              <p className="text-sm text-neutral leading-relaxed">{point.body}</p>
              <p className="nprm-legal-ref">For legal reference: {point.legal}</p>
            </li>
          ))}
        </ol>
      </section>

      <Suspense fallback={<ListSkeleton count={2} />}>
        <ImpactMatrix />
      </Suspense>

      <section className="space-y-3" id="proposal-themes">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <NprmSectionHeading
            eyebrow="Proposal"
            title="What the proposal covers"
          >
            <p className="text-sm text-neutral leading-relaxed max-w-2xl">
              Twelve plain-language sections. Each paraphrases USCIS text and
              cites the Federal Register page so you can verify.
            </p>
          </NprmSectionHeading>
          <p className="text-xs font-semibold text-neutral/70">
            {filteredThemes.length}/{longThemes.length || 12} sections
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
            placeholder="Keyword: bridge, sustainment, TEA"
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
                  <details className="rounded-lg border border-base-300 bg-base-200/50 nprm-callout-legal">
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
                    Open FR
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

      <section className="space-y-4" id="comment-stats">
        <NprmSectionHeading eyebrow="Tracker" title="Comment tracker">
          <p className="text-sm text-neutral leading-relaxed">
            <span className="font-semibold text-primary tabular-nums">
              {stats.total_comments} comments
            </span>
            <span className="text-neutral/50 mx-1.5">·</span>
            Last pull {lastPullLabel}
          </p>
        </NprmSectionHeading>

        <div className="rounded-xl border-2 border-base-300 bg-base-100 p-4 sm:p-5 shadow-soft">
          <div className="flex items-center justify-between gap-3 mb-4">
            <NprmSectionHeading
              as="h3"
              eyebrow="Volume"
              title="Comment volume"
              titleClassName="text-sm font-bold text-primary leading-snug"
            />
            <span className="text-xs font-medium text-neutral/70">
              Daily bars + cumulative line
            </span>
          </div>
          <VolumeChart data={volume} />
        </div>
      </section>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between rounded-xl border-2 border-secondary/30 bg-secondary/10 px-4 py-4">
        <div className="space-y-1">
          <NprmSectionHeading
            as="h3"
            eyebrow="Trust"
            title="Source and feed status"
            titleClassName="text-sm font-bold text-primary leading-snug"
          />
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
            . {stats.total_comments} comments tracked · last pull {lastPullLabel}.
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

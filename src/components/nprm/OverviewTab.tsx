'use client';

import { CitationChips } from '@/components/nprm/CitationChips';
import GlossaryTerm, {
  GlossaryText,
} from '@/components/nprm/GlossaryTerm';
import DoCommentsChangeRule from '@/components/nprm/DoCommentsChangeRule';
import NprmSectionHeading from '@/components/nprm/NprmSectionHeading';
import VolumeChart from '@/components/nprm/VolumeChart';
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
  RIN,
  dailyVolume,
  formatLastPull,
  normalizeShortSummary,
} from '@/lib/nprm/utils';
import { FEED_SHARE } from '@/lib/nprm/fetch';

interface Props {
  stats: NprmStats;
  comments: NprmComment[];
  proposal: NprmProposalSummary | null;
  lastCheck: NprmLastCheck | null;
  feedSource: 'remote' | 'local';
  onThemes: () => void;
  onWrite: () => void;
  onSummary: () => void;
  onExternalBlogs: () => void;
  onAbout: () => void;
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
  onWrite,
  onSummary,
  onExternalBlogs,
  onAbout,
}: Props) {
  const volume = dailyVolume(comments);
  const lastPullLabel = formatLastPull(stats.last_pull);
  const sourceUrl = proposal?.source_url || FR_PDF;
  const short = normalizeShortSummary(proposal?.short_summary);

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
              <p className="text-sm text-neutral leading-relaxed">
                <GlossaryText text={short.text} />
              </p>
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
            <button
              type="button"
              onClick={onExternalBlogs}
              className="btn btn-outline border-neutral/30"
            >
              What blogs are saying
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
          Comment data as of {lastPullLabel}. Not legal advice.{' '}
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
          <strong>Action:</strong> Read the 10-minute summary, then use our
          builder to draft a personal comment for regulations.gov. It takes about
          10 minutes. You can submit anonymously. Do not include your A-Number.
        </p>
      </section>

      <DoCommentsChangeRule />

      <section className="space-y-4" id="comment-stats">
        <NprmSectionHeading
          eyebrow="Tracker"
          title={`As of today, ${stats.total_comments} comments have already been made`}
        >
          <p className="text-sm text-neutral leading-relaxed">
            Last pull {lastPullLabel}. You are not starting from zero. See the
            volume below, then dig into what actually changes for you.
          </p>
        </NprmSectionHeading>

        <div className="rounded-xl border-2 border-base-300 bg-base-100 p-4 sm:p-5 shadow-soft space-y-4">
          <div className="flex items-center justify-between gap-3">
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
          <div className="flex flex-col sm:flex-row flex-wrap gap-2 pt-1">
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
              onClick={onThemes}
              className="btn btn-outline border-neutral/30"
            >
              See what others are saying
            </button>
            <button
              type="button"
              onClick={onSummary}
              className="btn btn-outline border-neutral/30"
            >
              Read 10-min Summary
            </button>
          </div>
        </div>
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
                <GlossaryText text={point.title} />
              </p>
              <p className="text-sm text-neutral leading-relaxed">
                <GlossaryText text={point.body} />
              </p>
              <p className="nprm-legal-ref">
                For legal reference: <GlossaryText text={point.legal} />
              </p>
            </li>
          ))}
        </ol>
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

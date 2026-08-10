'use client';

import { CitationChips } from '@/components/nprm/CitationChips';
import GlossaryTerm, {
  GlossaryText,
} from '@/components/nprm/GlossaryTerm';
import DoCommentsChangeRule from '@/components/nprm/DoCommentsChangeRule';
import HowCommentingWorks from '@/components/nprm/HowCommentingWorks';
import NprmSectionHeading from '@/components/nprm/NprmSectionHeading';
import VolumeChart from '@/components/nprm/VolumeChart';
import type {
  NprmComment,
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

interface Props {
  stats: NprmStats;
  comments: NprmComment[];
  proposal: NprmProposalSummary | null;
  onThemes: () => void;
  onWrite: () => void;
  onSummary: () => void;
  onExternalBlogs: () => void;
}

const KEY_POINTS: {
  title: string;
  body: string;
  legal: string;
}[] = [
  {
    title:
      'You may get your investment back after about 2 years, not after many years',
    body: 'Old practice often kept your money stuck until the green card path moved, which for India and China backlogs could mean a decade of redeployment risk. The draft says capital only needs to stay invested for about 2 years after it reaches the job-creating project, once the required jobs are created. That is the sustainment clock investors have been waiting to see written into regulation. If finalized this way, many post-RIA investors can plan for return of capital without waiting for a visa number to become current.',
    legal: '2-year sustainment · 8 CFR 216.6 · FR IV.D.6',
  },
  {
    title:
      'Repaid bridge financing may no longer count toward proving your 10 jobs',
    body: 'Bridge financing is a short-term loan projects use to start construction or cover costs before EB-5 capital arrives. Under the 2016 Policy Manual, USCIS often let repaid bridge loans count when showing job creation. The NPRM proposes to stop that: jobs would need a closer link to the investor\'s own capital going into the entity that actually creates employment (proposed 8 CFR 204.407(e)(1)). Rural and early-stage projects that rely on bridge stacks may have to restructure or delay closings. Investors who already filed on bridge-based projects are asking for transition or grandfather rules so I-829 adjudications do not rewrite the deal they bought.',
    legal: 'Bridge financing · 8 CFR 204.407(e)(1) · FR IV.D.7 pp 40706-40707',
  },
  {
    title:
      'If your regional center fails, you keep your place in line for about 180 days',
    body: 'When a regional center is terminated, good-faith investors have historically faced chaos over whether their petition and priority date survive. The draft formalizes a roughly 180-day window to re-associate with a compliant sponsor, keep your place in the visa line, and use Form I-527 where needed. If you already finished 2 years of sustainment and job creation, you may not need to reinvest just because the center later fails. The open comment fight is whether 180 days is long enough once new-sponsor diligence and paperwork stack up.',
    legal: 'Form I-527 · good-faith protection · FR good-faith / I-527',
  },
  {
    title:
      '$800K stays for now; a new $1.4M tier and Jan 1, 2027 inflation hike are proposed',
    body: 'Rural and high-unemployment TEA projects stay at $800K today and standard stays at $1.05M, matching post-RIA practice. The draft also adds a new high-employment area tier around $1.4M for projects in areas with unusually low unemployment. Automatic inflation adjustments are proposed for Jan 1, 2027 and every 5 years after. Future filers should treat those dates as hard planning points; people already in should confirm their tier is locked and watch how grandfathering is written in the final rule.',
    legal: 'Investment thresholds · 8 CFR 204.6 · FR amounts / inflation',
  },
  {
    title:
      'USCIS, not states, decides if a project qualifies for the lower amount',
    body: 'Whether a project gets the $800K TEA amount is decided centrally by USCIS under proposed methodology for high-unemployment and rural designations, not primarily by state designation letters. That can make outcomes more consistent nationwide, but it also means investors and developers need the data sources and census boundaries to be transparent and challengeable. A wrong TEA call is the difference between $800K and a higher tier, so methodology comments matter before the rule locks in.',
    legal: 'TEA determination · FR TEA methodology',
  },
  {
    title: 'More audits and fines for regional centers',
    body: 'The draft expands audits, site visits, reporting duties, and tiered penalties, including examples like late annual statement fines and sanctions up to a percentage of capital. Stronger oversight can protect investors from weak sponsors, but fixed compliance costs land hardest on small and single-project centers. That may shrink the pool of sponsors, raise fees passed through to investors, or push more capital into larger multi-project operators. Comments can ask for proportional rules so integrity gains do not wipe out rural and smaller projects.',
    legal: 'Sanctions and audits · FR sanctions',
  },
];

export default function OverviewTab({
  stats,
  comments,
  proposal,
  onThemes,
  onWrite,
  onSummary,
  onExternalBlogs,
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
          tell the agency what you think before the deadline. Your comment can
          influence what gets finalized.
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
          <strong>If you already filed:</strong> Commenting can help protect
          your investment. If the 2-year rule is finalized, you may get capital
          back sooner. If good-faith protections are strengthened, you are safer
          if your regional center fails.
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
          <strong>Action:</strong> Read the{' '}
          <button
            type="button"
            onClick={onSummary}
            className="font-semibold text-secondary underline underline-offset-2 hover:text-primary"
          >
            10-minute summary
          </button>
          , then use our{' '}
          <button
            type="button"
            onClick={onWrite}
            data-goatcounter-click="nprm-build-comment"
            className="font-semibold text-secondary underline underline-offset-2 hover:text-primary"
          >
            builder
          </button>{' '}
          to draft a personal comment for regulations.gov. It takes about 10
          minutes. You can submit anonymously.
        </p>
      </section>

      <DoCommentsChangeRule />

      <HowCommentingWorks onWrite={onWrite} />

      <section className="space-y-4" id="comment-stats">
        <NprmSectionHeading
          eyebrow="Tracker"
          title={`As of today, ${stats.total_comments} comments have already been made. It's your turn now.`}
        />

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
          <p className="text-[10px] text-neutral/55 leading-snug -mt-2">
            Last pull {lastPullLabel}
          </p>
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
    </div>
  );
}

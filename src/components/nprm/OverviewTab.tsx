'use client';

import type { ReactNode } from 'react';
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
  FR_HTML,
  FR_PDF,
  dailyVolume,
  formatLastPull,
} from '@/lib/nprm/utils';

interface Props {
  stats: NprmStats;
  comments: NprmComment[];
  proposal: NprmProposalSummary | null;
  onThemes: () => void;
  onWrite: () => void;
  onSummary: () => void;
}

const KEY_POINTS: {
  title: string;
  body: string;
  /** Federal Register HTML heading id (deep link). */
  frHeadingId: string;
  frSectionLabel: string;
  /** Optional first-occurrence inline links inside body. */
  inlineLinks?: { phrase: string; href: string; title?: string }[];
}[] = [
  {
    title:
      'You may get your investment back after about 2 years, not after many years',
    body: 'Old practice often kept your money stuck until the green card path moved, which for India and China backlogs could mean years of redeployment risk. The draft says capital only needs to stay invested for about 2 years after it is made available to the JCE, once the required jobs are created. That is the sustainment clock investors have been waiting to see written into regulation. If finalized this way, many post-RIA investors can plan for return of capital even before getting CGC.',
    frHeadingId: 'h-66',
    frSectionLabel: 'IV.D.6 Duration of Investment',
  },
  {
    title:
      'Repaid bridge financing may no longer count toward proving your 10 jobs',
    body: 'Today, under the USCIS Policy Manual (not a final regulation), investors can often still claim jobs created with short-term bridge financing that EB-5 capital later repays. The NPRM would change that: jobs from financing repaid with EB-5 money would not count as jobs created by that EB-5 capital. That is draft language only. It is not law yet, and RIA itself did not ban bridge financing. DHS also says the rule would generally apply prospectively to petitions filed on or after the final rule\'s effective date, not automatically to every post-RIA filing from March 2022 onward. The open risk is I-829 and transition wording: commenters are asking DHS to say expressly that pending bridge-based projects keep the old Policy Manual treatment.',
    frHeadingId: 'h-67',
    frSectionLabel: 'IV.D.7 Job Creation Requirements and Bridge Financing',
    inlineLinks: [
      {
        phrase: 'USCIS Policy Manual',
        href: 'https://www.uscis.gov/policy-manual/volume-6-part-g-chapter-2',
        title:
          'USCIS Policy Manual, Volume 6, Part G, Chapter 2 (Bridge Financing, G.2(D)(1))',
      },
    ],
  },
  {
    title:
      'If your regional center fails, you keep your place in line for about 180 days',
    body: 'When a regional center is terminated, good-faith investors have historically faced chaos over whether their petition and priority date survive. The draft formalizes a roughly 180-day window to re-associate with a compliant sponsor, keep your place in the visa line, and use Form I-527 where needed. If you already finished 2 years of sustainment and job creation, you may not need to reinvest just because the center later fails. The open comment fight is whether 180 days is long enough once new-sponsor diligence and paperwork stack up.',
    frHeadingId: 'h-72',
    frSectionLabel: 'IV.D.9.c Terminations and Debarments (good-faith protections)',
  },
  {
    title:
      '$800K stays for now; a new $1.4M tier and Jan 1, 2027 inflation hike are proposed',
    body: 'Rural and high-unemployment TEA projects stay at $800K today and standard stays at $1.05M, matching post-RIA practice. The draft also adds a new high-employment area tier around $1.4M for projects in areas with unusually low unemployment. Automatic inflation adjustments are proposed for Jan 1, 2027 and every 5 years after. Future filers should treat those dates as hard planning points; people already in should confirm their tier is locked and watch how grandfathering is written in the final rule.',
    frHeadingId: 'h-59',
    frSectionLabel: 'IV.D.4 Investment Amounts',
  },
  {
    title:
      'USCIS, not states, decides if a project qualifies for the lower amount',
    body: 'Whether a project gets the $800K TEA amount is decided centrally by USCIS under proposed methodology for high-unemployment and rural designations, not primarily by state designation letters. That can make outcomes more consistent nationwide, but it also means investors and developers need the data sources and census boundaries to be transparent and challengeable. A wrong TEA call is the difference between $800K and a higher tier, so methodology comments matter before the rule locks in.',
    frHeadingId: 'h-73',
    frSectionLabel: 'IV.E Targeted Employment Areas',
  },
  {
    title: 'More audits and fines for regional centers',
    body: 'The draft expands audits, site visits, reporting duties, and tiered penalties, including examples like late annual statement fines and sanctions up to a percentage of capital. Stronger oversight can protect investors from weak sponsors, but fixed compliance costs land hardest on small and single-project centers. That may shrink the pool of sponsors, raise fees passed through to investors, or push more capital into larger multi-project operators. Comments can ask for proportional rules so integrity gains do not wipe out rural and smaller projects.',
    frHeadingId: 'h-100',
    frSectionLabel: 'IV.H.8 Enforcement (penalties, terminations) and Audits',
  },
];

type KeyPointInlineLink = {
  phrase: string;
  href: string;
  title?: string;
};

/** Glossary-aware body with first-occurrence inline source links. */
function KeyPointBody({
  text,
  links,
}: {
  text: string;
  links?: KeyPointInlineLink[];
}) {
  if (!links?.length) return <GlossaryText text={text} />;

  const nodes: React.ReactNode[] = [];
  let remaining = text;
  let pending = [...links];
  let key = 0;

  while (remaining.length) {
    let earliest = -1;
    let matched: KeyPointInlineLink | null = null;
    for (const link of pending) {
      const idx = remaining.indexOf(link.phrase);
      if (idx !== -1 && (earliest === -1 || idx < earliest)) {
        earliest = idx;
        matched = link;
      }
    }
    if (earliest === -1 || !matched) {
      nodes.push(<GlossaryText key={key++} text={remaining} />);
      break;
    }
    if (earliest > 0) {
      nodes.push(
        <GlossaryText key={key++} text={remaining.slice(0, earliest)} />
      );
    }
    nodes.push(
      <a
        key={key++}
        href={matched.href}
        target="_blank"
        rel="noopener noreferrer"
        title={matched.title}
        className="font-semibold text-secondary underline underline-offset-2 hover:text-primary"
      >
        {matched.phrase}
      </a>
    );
    remaining = remaining.slice(earliest + matched.phrase.length);
    pending = pending.filter((l) => l !== matched);
  }

  return <>{nodes}</>;
}

export default function OverviewTab({
  stats,
  comments,
  proposal,
  onThemes,
  onWrite,
  onSummary,
}: Props) {
  const volume = dailyVolume(comments);
  const lastPullLabel = formatLastPull(stats.last_pull);
  const sourceUrl = proposal?.source_url || FR_PDF;

  return (
    <div className="space-y-8 animate-[fadeIn_0.35s_ease-out] nprm-prose">
      <header
        className="space-y-4 rounded-xl border-2 border-base-300 bg-base-100 p-4 sm:p-5 shadow-soft"
        id="what-is-nprm"
      >
        <NprmSectionHeading
          as="h2"
          eyebrow="Draft rule"
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
          <GlossaryTerm term="NPRM" />,{' '}
          <a
            href={sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-secondary underline underline-offset-2 hover:text-primary"
          >
            358-page PDF
          </a>
          , published July 2, 2026. After the comment period on{' '}
          <a
            href={DOCKET_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-secondary underline underline-offset-2 hover:text-primary"
          >
            docket USCIS-2026-0100
          </a>
          , they will publish the final rulebook.
        </p>
        <p className="font-semibold text-primary">
          Why should you care? This draft decides four things that affect your
          money:
        </p>
        <ol className="list-decimal pl-5 space-y-2">
          <li>
            When you can get your $800K back (about 2 years vs waiting on a green
            card backlog)
          </li>
          <li>
            Whether repaid bridge financing still counts toward proving your 10
            jobs
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
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button
            type="button"
            onClick={onWrite}
            data-goatcounter-click="nprm-build-comment"
            className="btn btn-primary text-primary-content"
          >
            Build My Comment
          </button>
          <a href="#key-points" className="btn btn-outline border-neutral/30">
            Key points
          </a>
          <button
            type="button"
            onClick={onSummary}
            className="btn btn-outline border-neutral/30"
          >
            Read 10-min Summary
          </button>
        </div>
      </header>

      <section className="nprm-callout-action space-y-3" id="do-i-need-to-act">
        <NprmSectionHeading
          eyebrow="Before August 31"
          title="Do I need to do something before the deadline?"
        />
        <p id="india-china">
          Commenting can help protect your investment whether you already filed
          or plan to file. A finalized 2-year sustainment rule and stronger
          good-faith protections matter most if your capital would otherwise sit
          through a long backlog or forced redeployment (especially India and
          China waits). Future filers should also watch the proposed $1.4M high
          employment tier and the Jan 1, 2027 inflation hike.
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
        className="space-y-3 rounded-xl border-2 border-base-300 bg-base-100 p-4 sm:p-5 shadow-soft scroll-mt-28"
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
                <KeyPointBody text={point.body} links={point.inlineLinks} />
              </p>
              <p className="text-xs">
                <a
                  href={`${FR_HTML}#${point.frHeadingId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-secondary underline underline-offset-2 hover:text-primary"
                >
                  Read {point.frSectionLabel} in the Federal Register
                </a>
                {' · '}
                <a
                  href={FR_PDF}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-secondary underline underline-offset-2 hover:text-primary"
                >
                  PDF
                </a>
              </p>
            </li>
          ))}
        </ol>
      </section>

      <HowCommentingWorks onWrite={onWrite} />
    </div>
  );
}

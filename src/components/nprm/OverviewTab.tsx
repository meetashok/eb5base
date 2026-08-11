'use client';

import type { ReactNode } from 'react';
import GlossaryTerm, {
  GlossaryText,
} from '@/components/nprm/GlossaryTerm';
import DoCommentsChangeRule from '@/components/nprm/DoCommentsChangeRule';
import HowCommentingWorks from '@/components/nprm/HowCommentingWorks';
import LocalDateTime from '@/components/nprm/LocalDateTime';
import NprmSectionHeading from '@/components/nprm/NprmSectionHeading';
import VolumeChart from '@/components/nprm/VolumeChart';
import {
  KEY_TOPICS,
  topicSectionId,
} from '@/lib/nprm/keyTopics';
import type {
  KeyTopicInlineLink,
  NprmComment,
  NprmProposalSummary,
  NprmStats,
} from '@/lib/nprm/types';
import {
  DOCKET_URL,
  FR_HTML,
  FR_PDF,
  dailyVolume,
} from '@/lib/nprm/utils';

interface Props {
  stats: NprmStats;
  comments: NprmComment[];
  proposal: NprmProposalSummary | null;
  onWrite: () => void;
  onWriteTopic: (topicId: string) => void;
  onSummary: (hash?: string) => void;
  onComments: () => void;
}

/** Glossary-aware body with first-occurrence inline source links. */
function KeyPointBody({
  text,
  links,
}: {
  text: string;
  links?: KeyTopicInlineLink[];
}) {
  if (!links?.length) return <GlossaryText text={text} />;

  const nodes: ReactNode[] = [];
  let remaining = text;
  let pending = [...links];
  let key = 0;

  while (remaining.length) {
    let earliest = -1;
    let matched: KeyTopicInlineLink | null = null;
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
  onWrite,
  onWriteTopic,
  onSummary,
  onComments,
}: Props) {
  const volume = dailyVolume(comments);
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
          TLDR: This is a draft of new EB-5 house rules. It is not final. As an
          investor, you have a right and a responsibility to comment on the draft
          before the deadline. Your comment can influence what gets finalized.
        </p>
        <p>
          Think of EB-5 as an apartment building. Congress passed a big renovation
          law in 2022 (the <GlossaryTerm term="RIA" />). Since then, the building
          manager (<GlossaryTerm term="USCIS" />) has been enforcing the new rules
          with memos. Now the manager published a formal draft of the new
          rulebook: <GlossaryTerm term="NPRM" />,{' '}
          <a
            href={sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-secondary underline underline-offset-2 hover:text-primary"
          >
            358-page PDF
          </a>
          , published July 2, 2026. After the comment period, they will publish
          the final rulebook.
        </p>
        <p className="font-semibold text-primary">
          This draft impacts your EB-5 journey:
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
            onClick={() => onSummary()}
            className="btn btn-outline border-neutral/30"
          >
            Read 10-min Summary
          </button>
          <button
            type="button"
            onClick={onComments}
            className="btn btn-outline border-neutral/30"
          >
            What others are saying
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
          or plan to file. A finalized 2-year sustainment rule, bridge financing
          treatment, and stronger good-faith protections matter most if your
          capital would otherwise sit through a long backlog or forced
          redeployment (especially India and China waits). Future filers should
          also watch the proposed $1.4M high employment tier and the Jan 1, 2027
          inflation hike.
        </p>
        <p>
          <strong>Action:</strong> Read the{' '}
          <button
            type="button"
            onClick={() => onSummary()}
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
          <p className="text-[9px] text-neutral/55 leading-snug -mt-2">
            Last pull <LocalDateTime value={stats.last_pull} />. Data is not
            real-time; it updates daily. For real-time data, visit{' '}
            <a
              href={DOCKET_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-secondary underline underline-offset-2 hover:text-primary"
            >
              regulations.gov
            </a>
            .
          </p>
          <div className="pt-1">
            <button
              type="button"
              onClick={onComments}
              className="btn btn-outline border-neutral/30 btn-sm"
            >
              See what others are saying
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
          {KEY_TOPICS.map((point, idx) => (
              <li
                key={point.id}
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
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => onWriteTopic(point.id)}
                    data-goatcounter-click="nprm-build-comment"
                    className="btn btn-primary btn-sm text-primary-content"
                  >
                    Build a comment on this
                  </button>
                  <button
                    type="button"
                    onClick={() => onSummary(topicSectionId(point.id))}
                    className="btn btn-outline btn-sm border-neutral/30"
                  >
                    Read more
                  </button>
                </div>
                <p className="text-[10px] leading-snug text-neutral/70">
                  <a
                    href={`${FR_HTML}#${point.frHeadingId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-normal text-secondary underline underline-offset-2 hover:text-primary"
                  >
                    Read {point.frSectionLabel} in the Federal Register
                  </a>
                  {' · '}
                  <a
                    href={FR_PDF}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-normal text-secondary underline underline-offset-2 hover:text-primary"
                  >
                    PDF
                  </a>
                </p>
              </li>
          ))}
        </ol>
      </section>

      <HowCommentingWorks onWrite={onWrite} onComments={onComments} />
    </div>
  );
}

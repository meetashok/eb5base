'use client';

import { useEffect } from 'react';
import NprmDisclaimer from '@/components/nprm/NprmDisclaimer';
import NprmSectionHeading from '@/components/nprm/NprmSectionHeading';
import {
  APA_CITATION,
  APA_LINK,
  ILRC_CITATION,
  ILRC_LINK,
} from '@/lib/nprm/constants';
import type { NprmProposalSummary } from '@/lib/nprm/types';
import { COMMENT_ON_URL, DOCKET_URL, plainDash } from '@/lib/nprm/utils';

interface Props {
  checkLog: string;
  lastPull: string;
  totalComments: number;
  proposal: NprmProposalSummary | null;
}

function parseCheckLogEntries(
  raw: string
): Array<{ when: string; detail: string }> {
  return raw
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const sep = line.indexOf(' - ');
      if (sep === -1) {
        return { when: '', detail: plainDash(line.replace(/ - /g, ' · ')) };
      }
      const when = line.slice(0, sep).trim();
      const detail = plainDash(line.slice(sep + 3).replace(/ - /g, ' · '));
      return { when, detail };
    });
}

export default function AboutTab({
  checkLog,
  lastPull,
  totalComments,
  proposal,
}: Props) {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.location.hash !== '#disclaimer') return;
    const el = document.getElementById('disclaimer');
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const proposalUrl =
    proposal?.source_url ||
    'https://www.govinfo.gov/content/pkg/FR-2026-07-02/pdf/2026-13392.pdf';
  const logEntries = parseCheckLogEntries(checkLog);

  return (
    <div className="space-y-8 max-w-3xl animate-[fadeIn_0.35s_ease-out]">
      <NprmDisclaimer />

      <section className="space-y-2 rounded-xl border-2 border-base-300 bg-base-100 p-4 sm:p-5 shadow-soft">
        <NprmSectionHeading
          as="h2"
          eyebrow="Purpose"
          title="Why we built this"
        />
        <p className="text-sm text-neutral leading-relaxed">
          Post-RIA EB-5 investors want to comment on Docket USCIS-2026-0100 with
          educated personal stories, not form letters that USCIS can bucket as one.
          regulations.gov is hard to browse by theme. This page explains what the
          NPRM itself proposes in plain English, organizes the real comments, and
          helps you build a distinct prompt for your own LLM.
        </p>
      </section>

      <section className="space-y-2 rounded-xl border-2 border-base-300 bg-base-100 p-4 sm:p-5 shadow-soft">
        <NprmSectionHeading
          as="h2"
          eyebrow="Sources"
          title="Proposal summary sources"
        />
        <p className="text-sm text-neutral leading-relaxed">
          Overview proposal summaries are plain-language paraphrases of Federal
          Register Doc 2026-13392 (Vol 91 No 126, July 2 2026, RIN 1615-AC94).
          Every statement cites the FR section and page it paraphrases. We do not
          invent facts. For the official text, read{' '}
          <a
            href={proposalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-secondary underline underline-offset-2 break-all"
          >
            {proposalUrl}
          </a>
          .
        </p>
        {proposal?.plain_language_note ? (
          <p className="text-sm text-neutral leading-relaxed">
            {proposal.plain_language_note}
          </p>
        ) : null}
        {proposal?.source_document ? (
          <p className="text-xs text-neutral/80 leading-relaxed">
            Source document: {proposal.source_document}
          </p>
        ) : null}
      </section>

      <section className="space-y-3 rounded-xl border-2 border-base-300 bg-base-100 p-4 sm:p-5 shadow-soft">
        <NprmSectionHeading
          as="h2"
          eyebrow="Your rights"
          title="Your rights to comment"
        />
        <div className="space-y-3 text-sm text-neutral leading-relaxed">
          <p>
            <span className="font-bold text-primary">APA (5 USC 553(c)):</span>{' '}
            {APA_CITATION}{' '}
            <a
              href={APA_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-secondary underline underline-offset-2"
            >
              University of Washington Gallagher Law Library
            </a>
          </p>
          <p>
            <span className="font-bold text-primary">Anonymity (ILRC):</span>{' '}
            {ILRC_CITATION}{' '}
            <a
              href={ILRC_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-secondary underline underline-offset-2"
            >
              ILRC how to submit a comment
            </a>
          </p>
          <p>
            <span className="font-bold text-primary">LDA:</span> A comment on
            regulations published in the Federal Register for public comment is
            not a lobbying contact. Filing here does not trigger LDA registration
            by itself.
          </p>
          <p>
            <span className="font-bold text-primary">FARA:</span> Use this in
            your personal capacity, with your own voice, without foreign principal
            funding or direction. eb5base/nprm is an information site only, not a
            submission site.
          </p>
        </div>
      </section>

      <section className="space-y-2 rounded-xl border-2 border-base-300 bg-base-100 p-4 sm:p-5 shadow-soft">
        <NprmSectionHeading as="h2" eyebrow="How to file" title="File on regulations.gov" />
        <ol className="list-decimal list-inside space-y-2 text-sm text-neutral leading-relaxed">
          <li>Build a prompt in the Write tab (personal block required).</li>
          <li>
            Write the comment in your own words. You can draft it yourself, or
            optionally paste the prompt into your own LLM and edit the result into
            your voice. An LLM is not required.
          </li>
          <li>
            Open{' '}
            <a
              href={COMMENT_ON_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-secondary underline underline-offset-2"
            >
              regulations.gov commenton
            </a>{' '}
            and paste your final comment yourself. We never POST on your behalf.
          </li>
          <li>
            Optional: keep a short counsel consult memo with your immigration
            attorney for your file.
          </li>
        </ol>
        <p className="text-sm text-neutral">
          Docket home:{' '}
          <a
            href={DOCKET_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-secondary underline underline-offset-2 break-all"
          >
            {DOCKET_URL}
          </a>
        </p>
      </section>

      <section className="space-y-3 rounded-xl border-2 border-base-300 bg-base-100 p-4 sm:p-5 shadow-soft">
        <NprmSectionHeading
          as="h2"
          eyebrow="Accuracy"
          title="How we keep this accurate"
        />
        <p className="text-sm text-neutral leading-relaxed">
          We keep a dated record of every update to this guide and the public comment
          summaries, so you can see what changed and when. That history helps us stay
          transparent, catch mistakes, and point each summary back to the original
          filing on regulations.gov. Right now we track {totalComments} comments.
          Last refresh: {lastPull}.
        </p>
        {logEntries.length > 0 ? (
          <ul className="space-y-3 rounded-lg border-2 border-base-300 bg-base-200/70 p-3 sm:p-4 overflow-auto max-h-72">
            {logEntries.map((entry, i) => (
              <li
                key={`${entry.when}-${i}`}
                className="flex gap-2.5 text-sm text-neutral leading-relaxed"
              >
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-secondary" aria-hidden />
                <div className="min-w-0 space-y-0.5">
                  {entry.when ? (
                    <p className="text-[11px] font-bold uppercase tracking-wide text-neutral/70 tabular-nums">
                      {entry.when}
                    </p>
                  ) : null}
                  <p>{entry.detail}</p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-neutral/70 rounded-lg border-2 border-dashed border-base-300 p-3">
            check.log unavailable
          </p>
        )}
      </section>
    </div>
  );
}

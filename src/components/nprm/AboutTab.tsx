'use client';

import { useEffect } from 'react';
import { GlossaryText } from '@/components/nprm/GlossaryTerm';
import LocalDateTime from '@/components/nprm/LocalDateTime';
import NprmDisclaimer from '@/components/nprm/NprmDisclaimer';
import NprmSectionHeading from '@/components/nprm/NprmSectionHeading';
import {
  APA_CITATION,
  APA_LINK,
  ILRC_CITATION,
  ILRC_LINK,
  UNIQUE_COMMENT_CHECKLIST,
} from '@/lib/nprm/constants';
import type { NprmProposalSummary } from '@/lib/nprm/types';
import { nprmTabHref } from '@/lib/nprm/tabs';
import { COMMENT_ON_URL, DOCKET_URL, plainDash } from '@/lib/nprm/utils';

interface Props {
  checkLog: string;
  lastPull: string;
  totalComments: number;
  proposal: NprmProposalSummary | null;
  onWrite?: () => void;
}

function parseCheckLogEntries(
  raw: string
): Array<{ when: string; details: string[] }> {
  const entries: Array<{ when: string; details: string[] }> = [];

  for (const line of raw.split(/\n+/).map((l) => l.trim()).filter(Boolean)) {
    const sep = line.indexOf(' - ');
    if (sep !== -1) {
      entries.push({
        when: line.slice(0, sep).trim(),
        details: [plainDash(line.slice(sep + 3).replace(/ - /g, ' · '))],
      });
      continue;
    }

    // Pull script writes: `${isoStamp} first-party pull...`
    const isoLead = line.match(/^(\d{4}-\d{2}-\d{2}T\S+)\s+(.*)$/);
    if (isoLead) {
      entries.push({
        when: isoLead[1],
        details: [plainDash(isoLead[2].replace(/ - /g, ' · '))],
      });
      continue;
    }

    const detail = plainDash(line.replace(/ - /g, ' · '));
    // Continuation lines belong to the latest stamped entry.
    if (entries.length > 0) {
      entries[entries.length - 1].details.push(detail);
    } else {
      entries.push({ when: '', details: [detail] });
    }
  }

  return entries;
}

export default function AboutTab({
  checkLog,
  lastPull,
  totalComments,
  proposal,
  onWrite,
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
    <div className="space-y-8 max-w-3xl mx-auto animate-[fadeIn_0.35s_ease-out]">
      <NprmDisclaimer />

      <section className="space-y-2 rounded-xl border-2 border-base-300 bg-base-100 p-4 sm:p-5 shadow-soft">
        <NprmSectionHeading
          as="h2"
          eyebrow="Purpose"
          title="Why we built this"
        />
        <p className="text-sm text-neutral leading-relaxed">
          <GlossaryText text="Post-RIA EB-5 investors want to comment on Docket USCIS-2026-0100 with educated personal stories, not form letters that USCIS can bucket as one. regulations.gov is hard to browse by theme. This page explains what the NPRM itself proposes in plain English, organizes the real comments, and helps you build a distinct prompt for your own LLM." />
        </p>
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
          <li>
            {onWrite ? (
              <button
                type="button"
                onClick={onWrite}
                data-goatcounter-click="nprm-build-comment"
                className="font-semibold text-secondary underline underline-offset-2 hover:text-primary"
              >
                Build a prompt
              </button>
            ) : (
              <a
                href={nprmTabHref('write')}
                className="font-semibold text-secondary underline underline-offset-2 hover:text-primary"
              >
                Build a prompt
              </a>
            )}{' '}
            in the Write tab (personal block required).
          </li>
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

      <section className="space-y-4 rounded-xl border-2 border-base-300 bg-base-100 p-4 sm:p-5 shadow-soft">
        <NprmSectionHeading
          as="h2"
          eyebrow="Accuracy"
          title="How we built this, and how we keep it honest"
        />

        <div className="space-y-2">
          <h3 className="text-sm font-bold text-primary">
            Overview and Summary topics
          </h3>
          <p className="text-sm text-neutral leading-relaxed">
            Every topic on Overview and Summary starts from the official draft
            rule (Federal Register Doc 2026-13392, Vol 91 No 126, July 2 2026,
            RIN 1615-AC94 / Docket USCIS-2026-0100). We read the notice, drafted
            a short plain-English Overview point for each issue, then expanded it
            into a longer Summary writeup (with AI help for drafting and
            editing). Agree and disagree angles both show honest pros and cons so
            the page does not push one side. These are still paraphrases. They
            can miss nuance or get something wrong. Use the Federal Register
            links in each topic section, or the full notice at{' '}
            <a
              href={proposalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-secondary underline underline-offset-2 break-all"
            >
              {proposalUrl}
            </a>
            , before you rely on any claim here.
          </p>
          {proposal?.source_document ? (
            <p className="text-xs text-neutral/80 leading-relaxed">
              Source document: {proposal.source_document}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-bold text-primary">Public comments</h3>
          <p className="text-sm text-neutral leading-relaxed">
            Comments come from the regulations.gov API for this docket, not from
            a third-party social feed. We pull on a daily cadence, normalize each
            filing into a common shape (id, link, posted date, theme tags, poster
            type), and label posters only as Anonymous, Named person, or
            Organization. Person and company names are stripped from the summary
            voice so browsing stays comparable across filers. For each comment we
            generate a short automated summary from the posted body text
            (&quot;This comment…&quot; voice); attachment-only filings get a note
            to open the original on regulations.gov. Summaries can miss context or
            mis-weight a point, so open the linked filing when it matters. Right
            now we track {totalComments} comments. Last refresh:{' '}
            <LocalDateTime value={lastPull} />.
          </p>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-bold text-primary">
            Write tab prompt builder
          </h3>
          <p className="text-sm text-neutral leading-relaxed">
            The Write tab builds a prompt for your own LLM; we never draft or
            POST the comment for you. You choose whether to comment on each
            topic, and whether you generally agree or disagree with the draft.
            The prompt only includes the angles you select plus your personal
            story. Safeguards baked into that prompt: use only facts you
            provided; do not invent dates, amounts, project names, or legal
            conclusions; paraphrase must-include points (no copying 4+ words);
            vary request verbs within the draft; skip Federal Register outline
            titles as headers; cite only the listed INA / proposed 8 CFR
            references; and avoid chat meta in the output. Each prompt also
            injects one closing style so drafts do not all end the same way.
            The tool is stance-neutral: it scaffolds whichever side you pick
            with the same structure and rules.
          </p>
          <p className="text-sm text-neutral leading-relaxed">
            To keep filings from clustering as form letters:
          </p>
          <ul className="list-disc pl-5 text-sm text-neutral space-y-1.5 leading-relaxed">
            {UNIQUE_COMMENT_CHECKLIST.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-bold text-primary">Change log</h3>
          <p className="text-sm text-neutral leading-relaxed">
            We keep a dated record of guide and comment-data refreshes so you can
            see what changed and when.
          </p>
          {logEntries.length > 0 ? (
            <ul className="space-y-3 rounded-lg border-2 border-base-300 bg-base-200/70 p-3 sm:p-4 overflow-auto max-h-72">
              {logEntries.map((entry, i) => {
                const [headline, ...rest] = entry.details;
                return (
                  <li
                    key={`${entry.when}-${i}`}
                    className="flex gap-2.5 text-sm text-neutral leading-relaxed"
                  >
                    <span
                      className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-secondary"
                      aria-hidden
                    />
                    <div className="min-w-0 space-y-1">
                      {entry.when ? (
                        <p className="text-[11px] font-bold uppercase tracking-wide text-neutral/70 tabular-nums">
                          <LocalDateTime value={entry.when} />
                        </p>
                      ) : null}
                      {headline ? <p>{headline}</p> : null}
                      {rest.length > 0 ? (
                        <ul className="list-disc pl-4 space-y-0.5 text-sm text-neutral/85">
                          {rest.map((detail) => (
                            <li key={detail}>{detail}</li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-sm text-neutral/70 rounded-lg border-2 border-dashed border-base-300 p-3">
              check.log unavailable
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

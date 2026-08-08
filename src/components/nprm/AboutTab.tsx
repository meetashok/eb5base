import NprmDisclaimer from '@/components/nprm/NprmDisclaimer';
import {
  APA_CITATION,
  APA_LINK,
  ILRC_CITATION,
  ILRC_LINK,
} from '@/lib/nprm/constants';
import { COMMENT_ON_URL, DOCKET_URL } from '@/lib/nprm/utils';

interface Props {
  checkLog: string;
  lastPull: string;
  totalComments: number;
}

export default function AboutTab({
  checkLog,
  lastPull,
  totalComments,
}: Props) {
  return (
    <div className="space-y-8 max-w-3xl animate-[fadeIn_0.35s_ease-out]">
      <section className="space-y-2">
        <h2 className="text-xl font-bold text-primary">Why we built this</h2>
        <p className="text-sm text-neutral/70 leading-relaxed">
          Post-RIA EB-5 investors want to comment on Docket USCIS-2026-0100 with educated personal stories — not form letters that USCIS can bucket as one. regulations.gov is hard to browse by theme. This page organizes the real comments, explains the CFR stakes in plain English, and helps you build a distinct prompt for your own LLM.
        </p>
        <p className="text-sm text-neutral/70 leading-relaxed">
          Built by Ashok (eb5base): filed I-526E March 2025, conditional green card September 30 2025, visiting Kota August 2026, active in 1,200+ member WhatsApp investor groups. Personal capacity educational use — no RC or government funding or direction.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-primary">Your rights to comment</h2>
        <div className="space-y-3 text-sm text-neutral/75 leading-relaxed">
          <p>
            <span className="font-semibold text-primary">APA — 5 USC 553(c):</span>{' '}
            {APA_CITATION}{' '}
            <a
              href={APA_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="link link-hover text-secondary"
            >
              University of Washington Gallagher Law Library
            </a>
          </p>
          <p>
            <span className="font-semibold text-primary">Anonymity — ILRC:</span>{' '}
            {ILRC_CITATION}{' '}
            <a
              href={ILRC_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="link link-hover text-secondary"
            >
              ILRC how to submit a comment
            </a>
          </p>
          <p>
            <span className="font-semibold text-primary">LDA:</span> A comment on
            regulations published in the Federal Register for public comment is
            not a lobbying contact — filing here does not trigger LDA registration
            by itself.
          </p>
          <p>
            <span className="font-semibold text-primary">FARA:</span> Use this in
            your personal capacity, with your own voice, without foreign principal
            funding or direction. eb5base/nprm is an information site only, not a
            submission site.
          </p>
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-bold text-primary">How to file</h2>
        <ol className="list-decimal list-inside space-y-2 text-sm text-neutral/75 leading-relaxed">
          <li>Build a prompt in the Write tab (personal block required).</li>
          <li>Paste into your own LLM and draft in your voice.</li>
          <li>
            Open{' '}
            <a
              href={COMMENT_ON_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="link link-hover text-secondary"
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
        <p className="text-sm text-neutral/60">
          Docket home:{' '}
          <a
            href={DOCKET_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="link link-hover text-secondary"
          >
            {DOCKET_URL}
          </a>
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-bold text-primary">Records / chain of custody</h2>
        <p className="text-sm text-neutral/70 leading-relaxed">
          We keep last-check.json, dated all_comments snapshots, and check.log so every card can be attributed. Current seed: {totalComments} comments, last pull {lastPull}.
        </p>
        <pre className="rounded-lg border border-base-300 bg-base-200/60 p-3 text-xs font-mono text-neutral/70 whitespace-pre-wrap overflow-auto max-h-48">
          {checkLog || 'check.log unavailable'}
        </pre>
      </section>

      <NprmDisclaimer />
    </div>
  );
}

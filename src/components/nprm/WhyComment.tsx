import { CitationChips } from '@/components/nprm/CitationChips';
import { GlossaryText } from '@/components/nprm/GlossaryTerm';
import NprmSectionHeading from '@/components/nprm/NprmSectionHeading';
import type { NprmProposalWhyComment } from '@/lib/nprm/types';
import {
  COMMENT_ON_URL,
  DOCUMENT_URL,
  FR_HTML,
  plainDash,
  toReasonBullets,
} from '@/lib/nprm/utils';

export default function WhyComment({
  why,
  onComments,
}: {
  why: NprmProposalWhyComment;
  onComments?: () => void;
}) {
  const title = plainDash(why.title || 'Why should an investor comment?');
  const reasons = why.reasons || [];

  return (
    <section
      id="why-comment"
      className="space-y-5 rounded-xl border-2 border-secondary/25 bg-secondary/[0.04] p-4 sm:p-5 shadow-soft scroll-mt-28"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-2 max-w-3xl">
          <NprmSectionHeading eyebrow="Why comment" title={title}>
            <p className="text-sm text-neutral leading-relaxed">
              <GlossaryText text={plainDash(why.intro)} />
            </p>
            <CitationChips citations={why.citations_intro} href={FR_HTML} />
          </NprmSectionHeading>
        </div>
        <a
          href={DOCUMENT_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 inline-flex items-center rounded-md border border-secondary/40 bg-secondary/10 px-2.5 py-1.5 text-[11px] font-bold text-secondary hover:bg-secondary/15"
        >
          Comments due Aug 31, 2026
          <span className="font-medium opacity-80 ml-1">
            [FR DATES p 40676]
          </span>
        </a>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {reasons.map((reason, idx) => {
          const bullets = toReasonBullets(reason.text, 2);
          return (
            <article
              key={reason.id}
              className="rounded-xl border-2 border-base-300 bg-base-100 p-4 shadow-sm space-y-2"
            >
              <div className="flex items-start gap-2">
                <span
                  className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-secondary/15 text-[11px] font-bold text-secondary tabular-nums"
                  aria-hidden
                >
                  {idx + 1}
                </span>
                <h4 className="text-sm font-bold text-primary leading-snug">
                  <GlossaryText text={plainDash(reason.title)} />
                </h4>
              </div>
              <ul className="space-y-1.5 text-sm text-neutral leading-relaxed list-disc pl-5">
                {bullets.map((b) => (
                  <li key={b.slice(0, 40)}>
                    <GlossaryText text={b} />
                  </li>
                ))}
              </ul>
              <CitationChips citations={reason.citations} href={FR_HTML} />
            </article>
          );
        })}
      </div>

      <div className="flex flex-col sm:flex-row flex-wrap gap-2">
        {onComments ? (
          <button
            type="button"
            onClick={onComments}
            className="btn btn-sm btn-outline border-neutral/30"
          >
            Browse existing comments
          </button>
        ) : null}
        <a
          href={COMMENT_ON_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-sm btn-primary text-primary-content"
        >
          File on regulations.gov (3 min)
        </a>
      </div>

      {why.what_to_include?.length ? (
        <div className="rounded-xl border border-base-300 bg-base-100 p-4 space-y-2">
          <NprmSectionHeading
            as="h3"
            eyebrow="Checklist"
            title="What to include if you comment"
            titleClassName="text-sm font-bold text-primary leading-snug"
          />
          <ul className="space-y-1.5 text-sm text-neutral leading-relaxed list-disc pl-5">
            {why.what_to_include.map((item) => (
              <li key={item}>
                <GlossaryText text={plainDash(item)} />
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <p className="text-xs text-neutral/75 leading-relaxed">
        {plainDash(
          why.note ||
            'Not legal advice. Informational explainer linking to official sources.'
        )}{' '}
        For the official text, see Federal Register Vol 91 No 126 July 2 2026, FR
        Doc 2026-13392.
      </p>
    </section>
  );
}

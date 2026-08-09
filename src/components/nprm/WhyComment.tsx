import type { NprmProposalWhyComment } from '@/lib/nprm/types';
import {
  COMMENT_ON_URL,
  DOCUMENT_URL,
  plainDash,
} from '@/lib/nprm/utils';

const FTC_PARTICIPATION =
  'https://www.ftc.gov/news-events/topics/competition-enforcement/public-participation';

function citeLabel(raw: string): string {
  return plainDash(raw.replace(/^\[/, '').replace(/\]$/, ''));
}

export default function WhyComment({
  why,
}: {
  why: NprmProposalWhyComment;
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
          <p className="text-xs uppercase tracking-[0.18em] font-bold text-secondary">
            Why comment
          </p>
          <h3 className="text-lg md:text-xl font-bold text-primary leading-tight">
            {title}
          </h3>
          <p className="text-sm text-neutral leading-relaxed">
            {plainDash(why.intro)}
          </p>
          {why.citations_intro?.length ? (
            <div className="flex flex-wrap gap-2">
              {why.citations_intro.map((c) => (
                <span
                  key={c}
                  className="inline-flex items-center rounded-md border border-base-300 bg-base-100 px-2 py-0.5 text-[10px] font-semibold text-neutral/80"
                >
                  {citeLabel(c)}
                </span>
              ))}
            </div>
          ) : null}
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
        {reasons.map((reason) => (
          <article
            key={reason.id}
            className="rounded-xl border-2 border-base-300 bg-base-100 p-4 shadow-sm space-y-2"
          >
            <h4 className="text-sm font-bold text-primary leading-snug">
              {plainDash(reason.title)}
            </h4>
            <p className="text-sm text-neutral leading-relaxed">
              {plainDash(reason.text)}
            </p>
            {reason.citations?.length ? (
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {reason.citations.map((c) => (
                  <span
                    key={c}
                    className="inline-flex items-center rounded-md border border-base-300 bg-base-200/70 px-2 py-0.5 text-[10px] font-medium text-neutral/75"
                  >
                    {citeLabel(c)}
                  </span>
                ))}
              </div>
            ) : null}
          </article>
        ))}
      </div>

      {why.how_it_works ? (
        <div className="rounded-xl border border-base-300 bg-base-100 p-4 space-y-2">
          <h4 className="text-sm font-bold text-primary">How commenting works</h4>
          <p className="text-sm text-neutral leading-relaxed">
            {plainDash(why.how_it_works)}
          </p>
          <p className="text-xs text-neutral/80">
            More on public participation:{' '}
            <a
              href={FTC_PARTICIPATION}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-secondary underline underline-offset-2"
            >
              FTC public participation
            </a>
            . File on{' '}
            <a
              href={COMMENT_ON_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-secondary underline underline-offset-2"
            >
              regulations.gov
            </a>
            .
          </p>
        </div>
      ) : null}

      {why.what_to_include?.length ? (
        <div className="rounded-xl border border-base-300 bg-base-100 p-4 space-y-2">
          <h4 className="text-sm font-bold text-primary">
            What to include if you comment
          </h4>
          <ul className="space-y-1.5 text-sm text-neutral leading-relaxed list-disc pl-5">
            {why.what_to_include.map((item) => (
              <li key={item}>{plainDash(item)}</li>
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

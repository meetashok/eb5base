import NprmSectionHeading from '@/components/nprm/NprmSectionHeading';
import { NPRM_EXTERNAL_SOURCES } from '@/lib/nprm/sources';

function formatSourceDate(iso: string): string {
  const d = new Date(`${iso}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

/** Compact publisher links for the Overview draft-rule intro. */
export function ExternalExplainerInline({ className = '' }: { className?: string }) {
  return (
    <p
      className={`text-xs text-neutral/75 leading-relaxed max-w-3xl ${className}`.trim()}
    >
      <span className="font-semibold text-neutral/80">External explainers: </span>
      {NPRM_EXTERNAL_SOURCES.map((source, i) => (
        <span key={source.id}>
          {i > 0 ? <span className="text-neutral/40"> · </span> : null}
          <a
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-secondary underline underline-offset-2 hover:text-primary"
          >
            {source.publisher}
          </a>
        </span>
      ))}
      <span className="text-neutral/60">
        {' '}
        (independent blogs; always verify against the Federal Register PDF)
      </span>
    </p>
  );
}

/** Full list of external blogs explaining the NPRM. */
export function ExternalExplainerSection() {
  return (
    <section
      id="external-explainers"
      className="space-y-4 rounded-xl border-2 border-base-300 bg-base-100 p-4 sm:p-5 shadow-soft scroll-mt-28"
    >
      <NprmSectionHeading
        as="h2"
        eyebrow="External blogs"
        title="What external blogs are saying"
      >
        <p className="text-sm text-neutral leading-relaxed max-w-3xl">
          Independent plain-English writeups of FR Doc 2026-13392. Useful context
          for investors; the Federal Register notice remains the primary source.
        </p>
      </NprmSectionHeading>

      <ul className="space-y-3">
        {NPRM_EXTERNAL_SOURCES.map((source) => (
          <li
            key={source.id}
            className="rounded-lg border border-base-300 bg-base-200/40 px-3 py-3 sm:px-4 space-y-1.5"
          >
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-primary underline underline-offset-2 decoration-secondary/40 hover:text-secondary"
              >
                {source.publisher}
              </a>
              <span className="text-[11px] font-medium uppercase tracking-wide text-neutral/60 tabular-nums">
                {formatSourceDate(source.date)}
              </span>
            </div>
            <p className="text-sm text-neutral leading-relaxed">{source.blurb}</p>
            <p className="text-xs text-neutral/70 leading-snug">
              <span className="font-medium text-neutral/80">Article: </span>
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-secondary underline underline-offset-2 hover:text-primary break-words"
              >
                {source.title}
              </a>
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}

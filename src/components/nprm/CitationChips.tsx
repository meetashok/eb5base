import { FR_HTML } from '@/lib/nprm/utils';
import { plainDash } from '@/lib/nprm/utils';

/** Split mashed FR citation strings on `;` into discrete chip labels. */
export function splitCitations(raw: string | string[] | undefined | null): string[] {
  if (!raw) return [];
  const parts = Array.isArray(raw) ? raw : [raw];
  const out: string[] = [];
  for (const part of parts) {
    const cleaned = String(part)
      .replace(/^\[/, '')
      .replace(/\]$/, '')
      .trim();
    if (!cleaned) continue;
    for (const chunk of cleaned.split(/\s*;\s*/)) {
      const label = plainDash(chunk.trim());
      if (label && !out.includes(label)) out.push(label);
    }
  }
  return out;
}

export function CitationChips({
  citations,
  href = FR_HTML,
  className = '',
}: {
  citations: string | string[] | undefined | null;
  href?: string;
  className?: string;
}) {
  const items = splitCitations(citations);
  if (items.length === 0) return null;

  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`.trim()}>
      {items.map((label) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center rounded-md border border-base-300 bg-base-200/80 px-2 py-0.5 text-[10px] font-semibold text-neutral/80 hover:border-secondary/50 hover:text-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-secondary"
        >
          {label}
        </a>
      ))}
    </div>
  );
}

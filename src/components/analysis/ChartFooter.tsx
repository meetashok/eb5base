import Link from 'next/link';
import type { ReactNode } from 'react';

const nf = new Intl.NumberFormat('en-US');

/**
 * Shared footer for analysis charts (I-526, I-485, and any future explorers).
 *
 * Convention: every chart footer shows exactly two links — "Source data" and an
 * optional "How to read the data" toggle. The per-selection USCIS suppression
 * caveat is NOT shown inline here; it lives inside the collapsible HowToReadCard
 * so the footer stays clean. Keep new chart footers on this component.
 */
export function ChartFooter({
  sourceHref,
  onToggleHowToRead,
  howToReadOpen,
}: {
  sourceHref: string;
  onToggleHowToRead?: () => void;
  howToReadOpen?: boolean;
}) {
  return (
    <p className="text-xs text-neutral/70 leading-relaxed pt-1">
      <Link
        href={sourceHref}
        className="font-semibold text-secondary underline underline-offset-2 hover:text-primary"
      >
        Source data
      </Link>
      {onToggleHowToRead ? (
        <>
          {' · '}
          <button
            type="button"
            onClick={onToggleHowToRead}
            aria-expanded={howToReadOpen}
            className="font-semibold text-secondary underline underline-offset-2 hover:text-primary"
          >
            How to read the data
          </button>
        </>
      ) : null}
    </p>
  );
}

/**
 * Collapsible "How to read this data" card, revealed by the footer's
 * "How to read the data" toggle. `children` are the dataset-specific bullet
 * points (rendered inside a <ul>). The per-selection suppression caveat is
 * rendered here — folded out of the footer — whenever `suppressedCells > 0`.
 */
export function HowToReadCard({
  suppressedCells = 0,
  children,
}: {
  suppressedCells?: number;
  children: ReactNode;
}) {
  return (
    <section className="max-w-4xl mx-auto px-4 pt-2 pb-8 space-y-6">
      <div className="rounded-xl border-2 border-base-300 bg-base-100 p-4 sm:p-5 text-sm text-neutral leading-relaxed space-y-2">
        <h2 className="text-sm font-bold text-primary">How to read this data</h2>
        {suppressedCells > 0 ? (
          <p className="text-sm text-neutral/80">
            <span className="font-semibold">In this selection:</span> {nf.format(suppressedCells)}{' '}
            value{suppressedCells === 1 ? '' : 's'} are suppressed by USCIS (&quot;D&quot;, under 10
            each) and excluded from the totals shown. Actual totals can be up to{' '}
            {nf.format(suppressedCells * 9)} higher.
          </p>
        ) : null}
        <ul className="list-disc pl-5 space-y-1.5">{children}</ul>
      </div>
    </section>
  );
}

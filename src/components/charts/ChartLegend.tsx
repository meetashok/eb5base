'use client';

import type { ReactNode } from 'react';

export interface LegendSeries {
  key: string;
  label: string;
  color: string;
}

/**
 * The shared chart legend row: hover-to-highlight + click-to-toggle series.
 * Fully controlled (state lives in the parent / useSeriesLegend), so it works
 * for both single charts and synced facets.
 */
export default function ChartLegend({
  series,
  hiddenKeys,
  focusKey,
  onToggle,
  onFocus,
  ariaLabel = 'Toggle series',
  trailing,
}: {
  series: LegendSeries[];
  hiddenKeys: ReadonlySet<string>;
  focusKey: string | null;
  onToggle: (key: string) => void;
  onFocus: (key: string | null) => void;
  ariaLabel?: string;
  /** Extra static legend entries (e.g. a reference line). */
  trailing?: ReactNode;
}) {
  return (
    <div
      className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs"
      role="group"
      aria-label={ariaLabel}
      onMouseLeave={() => onFocus(null)}
    >
      {series.map((s) => {
        const on = !hiddenKeys.has(s.key);
        const focused = focusKey === s.key;
        return (
          <button
            key={s.key}
            type="button"
            className={`inline-flex items-center gap-1.5 rounded-md px-1.5 py-0.5 transition-opacity focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary ${
              on ? (focused ? 'bg-base-200 text-primary' : 'text-neutral/80') : 'text-neutral/35'
            }`}
            aria-pressed={on}
            title={on ? `Hide ${s.label}` : `Show ${s.label}`}
            onClick={() => {
              onToggle(s.key);
              onFocus(null);
            }}
            onMouseEnter={() => {
              if (on) onFocus(s.key);
            }}
            onFocus={() => {
              if (on) onFocus(s.key);
            }}
            onBlur={() => {
              if (focusKey === s.key) onFocus(null);
            }}
          >
            <span
              className="inline-block w-4"
              style={{ borderTop: `2px solid ${on ? s.color : '#c4bdb2'}` }}
              aria-hidden
            />
            <span className={on ? undefined : 'line-through'}>{s.label}</span>
          </button>
        );
      })}
      {trailing}
    </div>
  );
}

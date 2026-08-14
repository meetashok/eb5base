'use client';

import type { ReactNode } from 'react';

export interface HoverRow {
  key: string;
  color: string;
  label: ReactNode;
  value: ReactNode;
}

/**
 * The shared top-right hover readout for multi-series charts. Render inside a
 * `relative w-full pt-12` wrapper, above the chart SVG.
 */
export default function ChartHoverReadout({
  metaLabel,
  rows,
}: {
  metaLabel?: ReactNode;
  rows: HoverRow[];
}) {
  return (
    <div
      className="pointer-events-none absolute inset-x-0 top-0 z-10 h-11 overflow-hidden text-xs font-semibold text-neutral"
      aria-live="polite"
    >
      {metaLabel != null ? (
        <div className="ml-auto max-w-full space-y-0.5 text-right">
          <div className="truncate font-medium text-neutral/55">{metaLabel}</div>
          <div className="flex flex-wrap justify-end gap-x-3 gap-y-0.5 tabular-nums text-primary">
            {rows.map((r) => (
              <span key={r.key} className="inline-flex items-center gap-1">
                <span
                  className="inline-block h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: r.color }}
                  aria-hidden
                />
                <span className="font-medium text-neutral/55">{r.label}</span> {r.value}
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

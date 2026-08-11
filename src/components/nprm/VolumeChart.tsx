'use client';

import { useMemo, useState } from 'react';

interface VolumePoint {
  date: string;
  count: number;
}

interface SeriesPoint {
  date: string;
  daily: number;
  cumulative: number;
}

/** Fill every calendar day between first and last so the axis is continuous. */
function fillDailySeries(data: VolumePoint[]): VolumePoint[] {
  if (data.length === 0) return [];
  const byDate = new Map(data.map((d) => [d.date, d.count]));
  const start = new Date(`${data[0].date}T00:00:00Z`);
  const end = new Date(`${data[data.length - 1].date}T00:00:00Z`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return data;

  const out: VolumePoint[] = [];
  for (let t = start.getTime(); t <= end.getTime(); t += 24 * 60 * 60 * 1000) {
    const iso = new Date(t).toISOString().slice(0, 10);
    out.push({ date: iso, count: byDate.get(iso) || 0 });
  }
  return out;
}

function shortLabel(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

/** Compact tick label for the x-axis (month + day). */
function axisLabel(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

/** Evenly spaced indices for ~3–4 x-axis date ticks (always includes ends). */
function axisTickIndices(length: number, count = 4): number[] {
  if (length <= 0) return [];
  if (length === 1) return [0];
  const n = Math.min(count, length);
  const idxs = new Set<number>();
  for (let i = 0; i < n; i++) {
    idxs.add(Math.round((i / (n - 1)) * (length - 1)));
  }
  return Array.from(idxs).sort((a, b) => a - b);
}

function toSeries(data: VolumePoint[]): SeriesPoint[] {
  const filled = fillDailySeries(data);
  let running = 0;
  return filled.map((d) => {
    running += d.count;
    return { date: d.date, daily: d.count, cumulative: running };
  });
}

export default function VolumeChart({ data }: { data: VolumePoint[] }) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const series = useMemo(() => toSeries(data), [data]);
  const tickIdxs = useMemo(() => axisTickIndices(series.length, 4), [series.length]);
  const maxDaily = Math.max(...series.map((d) => d.daily), 1);
  const maxCum = Math.max(...series.map((d) => d.cumulative), 1);
  const chartH = 180;
  const padTop = 8;
  const padBottom = 4;
  const plotH = chartH - padTop - padBottom;

  if (series.length === 0) {
    return (
      <p className="text-sm text-neutral">No posted-date volume data yet.</p>
    );
  }

  const linePoints = series
    .map((d, i) => {
      const x = ((i + 0.5) / series.length) * 100;
      const y =
        padTop + plotH - (d.cumulative / maxCum) * plotH;
      return `${x},${(y / chartH) * 100}`;
    })
    .join(' ');

  const hovered = hoverIdx != null ? series[hoverIdx] : null;
  const firstTick = tickIdxs[0];
  const lastTick = tickIdxs[tickIdxs.length - 1];

  return (
    <div className="w-full space-y-3">
      <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-neutral">
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-secondary" />
          Daily
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-4 bg-primary" />
          Cumulative total
        </span>
        {hovered && (
          <span className="ml-auto tabular-nums text-primary">
            {shortLabel(hovered.date)} · +{hovered.daily} day · {hovered.cumulative} total
          </span>
        )}
      </div>

      <div className="space-y-1.5">
        <div
          className="relative w-full"
          style={{ height: chartH }}
          role="img"
          aria-label="Daily and cumulative comment volume chart"
          onMouseLeave={() => setHoverIdx(null)}
        >
          {/* Cumulative line (SVG overlay, percent coords) */}
          <svg
            className="absolute inset-0 h-full w-full pointer-events-none"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden
          >
            <polyline
              fill="none"
              stroke="currentColor"
              strokeWidth="1.25"
              vectorEffect="non-scaling-stroke"
              className="text-primary"
              points={linePoints}
            />
          </svg>

          {/* Round markers in CSS pixels so they stay circular (SVG circles stretch). */}
          <div className="absolute inset-0 pointer-events-none" aria-hidden>
            {series.map((d, i) => {
              const left = ((i + 0.5) / series.length) * 100;
              const topPx = padTop + plotH - (d.cumulative / maxCum) * plotH;
              const active = hoverIdx === i;
              return (
                <span
                  key={`dot-${d.date}`}
                  className={`absolute block rounded-full border-2 border-base-100 shadow-sm -translate-x-1/2 -translate-y-1/2 ${
                    active ? 'bg-accent h-2.5 w-2.5' : 'bg-primary h-2 w-2'
                  }`}
                  style={{ left: `${left}%`, top: topPx }}
                />
              );
            })}
          </div>

          {/* Daily bars */}
          <div className="absolute inset-0 flex items-end gap-0.5 sm:gap-1">
            {series.map((d, i) => {
              const barPx =
                d.daily <= 0
                  ? 0
                  : Math.max(4, Math.round((d.daily / maxDaily) * plotH));
              return (
                <div
                  key={d.date}
                  className="group relative flex-1 min-w-0 h-full flex flex-col justify-end items-center"
                  onMouseEnter={() => setHoverIdx(i)}
                >
                  <div
                    className={`w-full max-w-[14px] sm:max-w-[18px] mx-auto rounded-t-sm transition-colors duration-150 ${
                      d.daily > 0
                        ? hoverIdx === i
                          ? 'bg-primary'
                          : 'bg-secondary/85'
                        : 'bg-transparent'
                    }`}
                    style={{ height: barPx }}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* X-axis date ticks (start / mid / end) */}
        <div
          className="relative h-4 w-full text-[10px] tabular-nums text-neutral/55"
          aria-hidden
        >
          {tickIdxs.map((idx) => {
            const left = ((idx + 0.5) / series.length) * 100;
            const align =
              idx === firstTick
                ? 'translate-x-0 text-left'
                : idx === lastTick
                  ? '-translate-x-full text-right'
                  : '-translate-x-1/2 text-center';
            return (
              <span
                key={`tick-${series[idx].date}`}
                className={`absolute top-0 whitespace-nowrap leading-none ${align}`}
                style={{ left: `${left}%` }}
              >
                {axisLabel(series[idx].date)}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}

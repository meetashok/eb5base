'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { seriesColor } from '@/components/charts';
import { ChartFooter, HowToReadCard } from '@/components/analysis/ChartFooter';
import VisaBulletinShareButton from '@/components/analysis/VisaBulletinShareButton';
import type { VisaBulletinSharePayload } from '@/lib/analysis/visaBulletinShareParams';
import VisaBulletinTable from '@/components/analysis/VisaBulletinTable';
import VisaBulletinTrendChart, {
  type TrendSeries,
  type TrendXMeta,
} from '@/components/analysis/VisaBulletinTrendChart';
import {
  CATEGORY_ROWS,
  COUNTRY_LABELS,
  COUNTRY_ORDER,
  cellKey,
  dateToOrdinal,
  formatBulletinMonth,
  indexDates,
  yearsBehind,
  type VbCountry,
  type VbDateType,
  type VisaBulletinDate,
  type VisaBulletinRelease,
} from '@/lib/analysis/visaBulletin';

const MONTH_ABBR = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

function shortMonth(iso: string): string {
  const [y, m] = iso.split('-').map(Number);
  return `${MONTH_ABBR[m - 1]} '${String(y).slice(2)}`;
}

function ordinalToMonthLabel(ord: number): string {
  const d = new Date(ord * 86400000);
  return `${MONTH_ABBR[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

const DEFAULT_HIDDEN_COUNTRIES: VbCountry[] = ['MEXICO', 'PHILIPPINES'];

const toggleGroupClass = 'inline-flex rounded-full border border-base-300 p-0.5 bg-base-200/60 gap-0.5';
function toggleBtnClass(active: boolean): string {
  return [
    'rounded-full h-7 px-2.5 text-xs font-semibold leading-none transition-colors',
    active ? 'bg-primary text-primary-content' : 'bg-transparent text-neutral hover:bg-base-300/70',
  ].join(' ');
}
const controlLabelClass = 'text-[11px] font-semibold uppercase tracking-wide text-neutral/55';

const chartHeaderRowClass =
  'flex flex-col items-stretch gap-3 sm:flex-row sm:items-start sm:justify-between';

function SectionHeader({
  title,
  subtitle,
  share,
  controls,
}: {
  title: string;
  subtitle: ReactNode;
  share: ReactNode;
  controls: ReactNode;
}) {
  return (
    <div className={chartHeaderRowClass}>
      <div className="min-w-0 w-full space-y-1 sm:flex-1">
        <h2 className="text-sm font-semibold leading-snug text-primary sm:text-base">{title}</h2>
        <p className="text-sm leading-snug text-neutral/70">{subtitle}</p>
        <div className="pt-0.5">{share}</div>
      </div>
      <div className="flex w-full flex-col items-stretch gap-2 sm:w-auto sm:items-end sm:gap-1.5">
        {controls}
      </div>
    </div>
  );
}

export default function VisaBulletinExplorer({
  releases,
  dates,
  error,
  initialMonth,
  initialCategory,
  initialDateType,
  initialYMode,
  initialScope,
}: {
  releases: VisaBulletinRelease[];
  dates: VisaBulletinDate[];
  error: string | null;
  initialMonth?: string;
  initialCategory?: string;
  initialDateType?: VbDateType;
  initialYMode?: 'date' | 'years';
  initialScope?: 'eb5' | 'all';
}) {
  const pathname = usePathname();
  const index = useMemo(() => indexDates(dates), [dates]);

  const initialIdx = useMemo(() => {
    if (initialMonth) {
      const i = releases.findIndex((r) => r.bulletin_month.slice(0, 7) === initialMonth);
      if (i >= 0) return i;
    }
    return Math.max(0, releases.length - 1);
  }, [releases, initialMonth]);

  const [selectedIdx, setSelectedIdx] = useState(initialIdx);
  const [categoryKey, setCategoryKey] = useState(initialCategory ?? 'EB5.UNRESERVED');
  const [dateType, setDateType] = useState<VbDateType>(initialDateType ?? 'FINAL_ACTION');
  const [yMode, setYMode] = useState<'date' | 'years'>(initialYMode ?? 'years');
  const [scope, setScope] = useState<'eb5' | 'all'>(initialScope ?? 'eb5');
  const [showHowToRead, setShowHowToRead] = useState(false);

  const selected = releases[selectedIdx];
  const prev = selectedIdx > 0 ? releases[selectedIdx - 1] : null;
  const [pref, sub] = categoryKey.split('.');
  const categoryLabel =
    CATEGORY_ROWS.find((r) => r.preference === pref && r.subcategory === sub)?.label ?? categoryKey;

  const buildPayload = (): VisaBulletinSharePayload => ({
    v: 1,
    ...(selected ? { m: selected.bulletin_month.slice(0, 7) } : {}),
    cat: categoryKey,
    dt: dateType,
    y: yMode,
    sc: scope,
  });
  const shareKey = selected
    ? `${selected.bulletin_month.slice(0, 7)}|${categoryKey}|${dateType}|${yMode}|${scope}`
    : '';
  const shareButton = <VisaBulletinShareButton buildPayload={buildPayload} shareKey={shareKey} />;

  // Keep the URL in sync (shareable) without re-rendering the server tree.
  useEffect(() => {
    if (!selected) return;
    const params = new URLSearchParams({
      m: selected.bulletin_month.slice(0, 7),
      cat: categoryKey,
      dt: dateType === 'FINAL_ACTION' ? 'fa' : 'dff',
      y: yMode,
      sc: scope,
    });
    window.history.replaceState(null, '', `${pathname}?${params.toString()}`);
  }, [pathname, selected, categoryKey, dateType, yMode, scope]);

  const xAxis: TrendXMeta[] = useMemo(
    () =>
      releases.map((r) => ({
        key: String(r.id),
        label: formatBulletinMonth(r.bulletin_month),
        shortLabel: shortMonth(r.bulletin_month),
      })),
    [releases],
  );

  const series: TrendSeries[] = useMemo(() => {
    return COUNTRY_ORDER.map((country, i) => ({
      key: country,
      label: COUNTRY_LABELS[country],
      color: seriesColor(i),
      data: releases.map((r) => {
        const cell = index.get(cellKey(r.id, pref, sub, country, dateType));
        if (!cell || cell.status === 'UNAVAILABLE') return null;
        if (cell.status === 'CURRENT') {
          return yMode === 'years' ? 0 : dateToOrdinal(r.bulletin_month);
        }
        if (!cell.cutoff_date) return null;
        return yMode === 'years'
          ? yearsBehind(r.bulletin_month, cell.cutoff_date)
          : dateToOrdinal(cell.cutoff_date);
      }),
    }));
  }, [releases, index, pref, sub, dateType, yMode]);

  const formatY = useMemo(
    () => (v: number) => (yMode === 'years' ? `${v.toFixed(1)} yr` : ordinalToMonthLabel(v)),
    [yMode],
  );

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="rounded-xl border-2 border-base-300 bg-base-100 p-5 text-sm text-neutral">
          The Visa Bulletin database is not connected in this environment.
        </div>
      </div>
    );
  }
  if (releases.length === 0 || !selected) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="rounded-xl border-2 border-base-300 bg-base-100 p-5 text-sm text-neutral">
          No Visa Bulletin data available yet.
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-4xl mx-auto px-4 pt-6 sm:pt-8 space-y-5">
        {/* Section 1: bulletin table */}
        <section className="rounded-xl border-2 border-base-300 bg-base-100 p-4 sm:p-5 shadow-sm space-y-4 overflow-x-hidden">
          <SectionHeader
            title="Bulletin table"
            subtitle="Dates for Filing, with Final Action shown as an offset and full detail on hover."
            share={shareButton}
            controls={
              <div className="flex items-center gap-1.5">
                <span className={controlLabelClass}>Show</span>
                <div className={toggleGroupClass} role="group" aria-label="Category scope">
                  <button type="button" className={toggleBtnClass(scope === 'eb5')} onClick={() => setScope('eb5')}>
                    EB-5 only
                  </button>
                  <button type="button" className={toggleBtnClass(scope === 'all')} onClick={() => setScope('all')}>
                    All categories
                  </button>
                </div>
              </div>
            }
          />

          {/* Month selector below the header */}
          <div className="space-y-2 border-t border-base-200 pt-3">
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                aria-label="Previous bulletin"
                disabled={selectedIdx === 0}
                onClick={() => setSelectedIdx((i) => Math.max(0, i - 1))}
                className="btn btn-sm btn-circle btn-ghost disabled:opacity-30"
              >
                ‹
              </button>
              <span className="min-w-[9rem] text-center text-sm font-semibold text-primary tabular-nums">
                {formatBulletinMonth(selected.bulletin_month)}
              </span>
              <button
                type="button"
                aria-label="Next bulletin"
                disabled={selectedIdx === releases.length - 1}
                onClick={() => setSelectedIdx((i) => Math.min(releases.length - 1, i + 1))}
                className="btn btn-sm btn-circle btn-ghost disabled:opacity-30"
              >
                ›
              </button>
            </div>
            <input
              type="range"
              min={0}
              max={releases.length - 1}
              value={selectedIdx}
              onChange={(e) => setSelectedIdx(Number(e.target.value))}
              aria-label="Select bulletin month"
              className="range range-xs range-primary"
            />
            <div className="flex justify-between text-[11px] text-neutral/50">
              <span>{formatBulletinMonth(releases[0].bulletin_month)}</span>
              <span>{formatBulletinMonth(releases[releases.length - 1].bulletin_month)}</span>
            </div>
          </div>

          <VisaBulletinTable
            index={index}
            releaseId={selected.id}
            prevReleaseId={prev?.id ?? null}
            eb5Only={scope === 'eb5'}
          />

          <p className="text-xs text-neutral/70">
            <a
              href={selected.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-secondary underline underline-offset-2 hover:text-primary"
            >
              View the official {formatBulletinMonth(selected.bulletin_month)} bulletin ↗
            </a>
          </p>
        </section>

        {/* Section 2: time series */}
        <section className="rounded-xl border-2 border-base-300 bg-base-100 p-4 sm:p-5 shadow-sm space-y-4 overflow-x-hidden">
          <SectionHeader
            title="Cut-off dates over time"
            subtitle={`${categoryLabel} - ${dateType === 'FINAL_ACTION' ? 'Final Action Dates' : 'Dates for Filing'}, by country. Click a point to load that bulletin above.`}
            share={shareButton}
            controls={
              <>
                <label className="flex items-center gap-1.5 text-xs">
                  <span className={controlLabelClass}>Category</span>
                  <select
                    className="select select-bordered select-xs"
                    value={categoryKey}
                    onChange={(e) => setCategoryKey(e.target.value)}
                  >
                    {CATEGORY_ROWS.map((r) => (
                      <option key={`${r.preference}.${r.subcategory}`} value={`${r.preference}.${r.subcategory}`}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="flex items-center gap-1.5">
                  <span className={controlLabelClass}>Dates</span>
                  <div className={toggleGroupClass} role="group" aria-label="Date type">
                    <button type="button" className={toggleBtnClass(dateType === 'FINAL_ACTION')} onClick={() => setDateType('FINAL_ACTION')}>
                      Final Action
                    </button>
                    <button type="button" className={toggleBtnClass(dateType === 'FILING')} onClick={() => setDateType('FILING')}>
                      Filing
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={controlLabelClass}>Y-axis</span>
                  <div className={toggleGroupClass} role="group" aria-label="Y-axis mode">
                    <button type="button" className={toggleBtnClass(yMode === 'years')} onClick={() => setYMode('years')}>
                      Years behind
                    </button>
                    <button type="button" className={toggleBtnClass(yMode === 'date')} onClick={() => setYMode('date')}>
                      Cut-off date
                    </button>
                  </div>
                </div>
              </>
            }
          />

          <VisaBulletinTrendChart
            xAxis={xAxis}
            series={series}
            formatY={formatY}
            yMin={yMode === 'years' ? 0 : undefined}
            invertY={yMode === 'date'}
            selectedKey={String(selected.id)}
            onSelectX={(key) => {
              const idx = releases.findIndex((r) => String(r.id) === key);
              if (idx >= 0) setSelectedIdx(idx);
            }}
            initialHiddenKeys={DEFAULT_HIDDEN_COUNTRIES}
            xAxisLabel="Bulletin month"
            ariaLabel={`${categoryLabel} cut-off dates by country over time`}
          />

          <ChartFooter
            sourceHref={selected.source_url}
            onToggleHowToRead={() => setShowHowToRead((v) => !v)}
            howToReadOpen={showHowToRead}
          />
        </section>
      </div>

      {showHowToRead ? (
        <HowToReadCard>
          <li>
            <span className="font-semibold">Final Action Dates</span> = when a green card can actually
            be issued; <span className="font-semibold">Dates for Filing</span> = when you may submit
            the application (usually a few months ahead of Final Action). A cut-off means only
            priority dates earlier than it are being processed.
          </li>
          <li>
            <span className="font-semibold">Current</span> means no backlog (any priority date is
            eligible); <span className="font-semibold">Unavailable</span> means no numbers that month
            (drawn as a gap in the trend).
          </li>
          <li>
            In the table, each cell shows the Dates-for-Filing cut-off with Final Action as a relative
            offset; hover any cell for the exact Final Action and Filing dates and their movement vs
            the previous bulletin.
          </li>
          <li>
            <span className="font-semibold">Years behind</span> = how old the priority date being
            processed is relative to the bulletin month (backlog depth). Both Y-axis modes are
            oriented the same way: a more backlogged / older cut-off sits higher.
          </li>
          <li>
            EB-5 splits into <span className="font-semibold">Unreserved</span> and the RIA set-asides:
            Rural (20%), High Unemployment (10%), Infrastructure (2%). Set-asides only appear from
            FY2023; earlier months show the pre-RIA regional-center rows.
          </li>
          <li>Information only, not legal or financial advice. Verify against the linked official bulletin.</li>
        </HowToReadCard>
      ) : null}
    </>
  );
}

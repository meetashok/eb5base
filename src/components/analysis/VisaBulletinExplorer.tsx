'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { seriesColor } from '@/components/charts';
import { ChartFooter, HowToReadCard } from '@/components/analysis/ChartFooter';
import { ChartCard, ChartHeader, ControlLabel, ToggleGroup } from '@/components/analysis/chart-kit';
import VisaBulletinShareButton from '@/components/analysis/VisaBulletinShareButton';
import type { VisaBulletinSharePayload } from '@/lib/analysis/visaBulletinShareParams';
import dynamic from 'next/dynamic';
import ChartSkeleton from '@/components/charts/ChartSkeleton';
import VisaBulletinTable from '@/components/analysis/VisaBulletinTable';
import type {
  TrendSeries,
  TrendXMeta,
} from '@/components/analysis/VisaBulletinTrendChart';

const VisaBulletinTrendChart = dynamic(
  () => import('@/components/analysis/VisaBulletinTrendChart'),
  { ssr: false, loading: () => <ChartSkeleton height={300} /> },
);
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

export default function VisaBulletinExplorer({
  releases,
  dates,
  error,
  initialMonth,
  initialCategory,
  initialDateType,
  initialYMode,
  initialScope,
  initialTablePrimary,
  initialShowChange,
}: {
  releases: VisaBulletinRelease[];
  dates: VisaBulletinDate[];
  error: string | null;
  initialMonth?: string;
  initialCategory?: string;
  initialDateType?: VbDateType;
  initialYMode?: 'date' | 'years';
  initialScope?: 'eb5' | 'all';
  initialTablePrimary?: VbDateType;
  initialShowChange?: boolean;
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
  const [tablePrimary, setTablePrimary] = useState<VbDateType>(initialTablePrimary ?? 'FILING');
  const [showChange, setShowChange] = useState(initialShowChange ?? true);
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
    tp: tablePrimary,
    ch: showChange,
  });
  const shareKey = selected
    ? `${selected.bulletin_month.slice(0, 7)}|${categoryKey}|${dateType}|${yMode}|${scope}|${tablePrimary}|${showChange ? 1 : 0}`
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
      tp: tablePrimary === 'FINAL_ACTION' ? 'fa' : 'dff',
      ch: showChange ? '1' : '0',
    });
    window.history.replaceState(null, '', `${pathname}?${params.toString()}`);
  }, [pathname, selected, categoryKey, dateType, yMode, scope, tablePrimary, showChange]);

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
    return COUNTRY_ORDER.map((country, i) => {
      const points = releases.map((r) => {
        const cell = index.get(cellKey(r.id, pref, sub, country, dateType));
        if (!cell) return { value: null as number | null, status: null as string | null };
        if (cell.status === 'UNAVAILABLE') return { value: null, status: 'Unavailable' };
        if (cell.status === 'CURRENT') {
          return {
            value: yMode === 'years' ? 0 : dateToOrdinal(r.bulletin_month),
            status: 'Current',
          };
        }
        if (!cell.cutoff_date) return { value: null, status: null };
        return {
          value:
            yMode === 'years'
              ? yearsBehind(r.bulletin_month, cell.cutoff_date)
              : dateToOrdinal(cell.cutoff_date),
          status: null,
        };
      });
      return {
        key: country,
        label: COUNTRY_LABELS[country],
        color: seriesColor(i),
        data: points.map((p) => p.value),
        statusText: points.map((p) => p.status),
      };
    });
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
        {/* Section 1: time series */}
        <ChartCard>
          <ChartHeader
            title="Cut-off dates over time"
            subtitle="Split by country - click to load below."
            action={shareButton}
            controls={
              <>
                <label className="flex flex-wrap items-center gap-2 text-xs sm:gap-1.5">
                  <ControlLabel>Category</ControlLabel>
                  <select
                    className="select select-bordered select-xs"
                    value={categoryKey}
                    onChange={(e) => setCategoryKey(e.target.value)}
                  >
                    {CATEGORY_ROWS.map((r) => (
                      <option key={`${r.preference}.${r.subcategory}`} value={`${r.preference}.${r.subcategory}`}>
                        {r.short}
                      </option>
                    ))}
                  </select>
                </label>
                <ToggleGroup
                  label="Dates"
                  ariaLabel="Date type"
                  value={dateType}
                  onChange={setDateType}
                  options={[
                    { value: 'FINAL_ACTION', label: 'Final Action' },
                    { value: 'FILING', label: 'Filing' },
                  ]}
                />
                <ToggleGroup
                  label="Y-axis"
                  ariaLabel="Y-axis mode"
                  value={yMode}
                  onChange={setYMode}
                  options={[
                    { value: 'years', label: 'Years behind' },
                    { value: 'date', label: 'Cut-off date' },
                  ]}
                />
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
        </ChartCard>

        {/* Section 2: bulletin table */}
        <ChartCard>
          <ChartHeader
            title="Cut-off dates by category and country"
            subtitle="One bulletin - hover any cell for detail."
            action={shareButton}
            controls={
              <>
                <ToggleGroup
                  label="Show"
                  ariaLabel="Category scope"
                  value={scope}
                  onChange={setScope}
                  options={[
                    { value: 'eb5', label: 'EB-5 only' },
                    { value: 'all', label: 'All categories' },
                  ]}
                />
                <ToggleGroup
                  label="Primary date"
                  ariaLabel="Primary date"
                  value={tablePrimary}
                  onChange={setTablePrimary}
                  options={[
                    { value: 'FINAL_ACTION', label: 'Final Action' },
                    { value: 'FILING', label: 'Filing' },
                  ]}
                />
                <ToggleGroup
                  label="Change vs last bulletin"
                  ariaLabel="Show change vs last bulletin"
                  value={showChange ? 'on' : 'off'}
                  onChange={(v) => setShowChange(v === 'on')}
                  options={[
                    { value: 'on', label: 'On' },
                    { value: 'off', label: 'Off' },
                  ]}
                />
              </>
            }
          />

          {/* Month selector below the header */}
          <div className="space-y-2">
            <p className="text-center text-[11px] font-semibold uppercase tracking-wide text-neutral/55">
              Select a Visa Bulletin
            </p>
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
            primaryType={tablePrimary}
            showChange={showChange}
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
        </ChartCard>
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

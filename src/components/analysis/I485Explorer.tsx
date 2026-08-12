'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { BarChart, DiffBarChart, LineChart, MultiSeriesLineChart, formatSignedCount } from '@/components/charts';
import I485ViewBar, { type I485ViewId } from '@/components/analysis/I485ViewBar';
import I485CategoryPicker from '@/components/analysis/I485CategoryPicker';
import I485CountryPicker from '@/components/analysis/I485CountryPicker';
import {
  DEFAULT_I485_CATEGORIES,
  MONTH_LABELS,
  SNAPSHOT_SPLIT_OPTIONS,
  USCIS_DATA_PAGE_URL,
  aggregateBy,
  aggregateByPriorityDateGrain,
  aggregateSplitByPriorityDateGrain,
  categoryMembersForMany,
  countryLabel,
  fetchI485Cells,
  fetchI485Releases,
  formatAsOf,
  formatAsOfShort,
  isI485DataAvailable,
  resolveCategorySplitSeries,
  splitCountriesForFilter,
  type AggregatedBucket,
  type I485Cell,
  type I485Country,
  type I485Release,
  type PriorityDateGrain,
  type SnapshotSplit,
  type TimeBucketMeta,
} from '@/lib/analysis/i485';

type ViewId = I485ViewId;

const nf = new Intl.NumberFormat('en-US');
const DEFAULT_CATEGORIES = DEFAULT_I485_CATEGORIES;
const GRAIN_OPTIONS: { value: PriorityDateGrain; label: string }[] = [
  { value: 'month', label: 'Months' },
  { value: 'quarter', label: 'Quarters' },
  { value: 'year', label: 'Fiscal years' },
];

function bucketLabel(b: AggregatedBucket): string {
  if (b.suppressedCells === 0) return nf.format(b.count);
  return `${nf.format(b.count)}+`;
}

/** Sum buckets where suppressed cells add an uncertainty band of 1-9 each. */
function totalWithNote(buckets: AggregatedBucket[]): { count: number; suppressedCells: number } {
  return buckets.reduce(
    (acc, b) => ({
      count: acc.count + b.count,
      suppressedCells: acc.suppressedCells + b.suppressedCells,
    }),
    { count: 0, suppressedCells: 0 },
  );
}

function ChartFooter({ cells }: { cells: number }) {
  return (
    <p className="text-xs text-neutral/70 leading-relaxed pt-1">
      {cells > 0 && (
        <>
          {nf.format(cells)} value{cells === 1 ? '' : 's'} in this selection are suppressed by USCIS
          (&quot;D&quot;, under 10 each) and are excluded from the totals shown. Actual totals can be
          up to {nf.format(cells * 9)} higher.
          {' · '}
        </>
      )}
      <Link
        href="/analysis/i485/data"
        className="font-semibold text-secondary underline underline-offset-2 hover:text-primary"
      >
        Source data
      </Link>
    </p>
  );
}

function ChartHeader({ children }: { children: ReactNode }) {
  return (
    <header className="-mx-4 border-b-2 border-base-300 bg-base-200/50 px-4 py-3 first:-mt-4 first:rounded-t-[0.65rem] sm:-mx-5 sm:px-5 sm:py-3.5 sm:first:-mt-5">
      {children}
    </header>
  );
}

function GrainToggle({
  grain,
  onChange,
}: {
  grain: PriorityDateGrain;
  onChange: (g: PriorityDateGrain) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-neutral/55">
        Granularity
      </span>
      <div
        className="inline-flex rounded-full border border-base-300 p-0.5 bg-base-200/60"
        role="group"
        aria-label="Priority-date grouping"
      >
        {GRAIN_OPTIONS.map((o) => (
          <button
            key={o.value}
            type="button"
            className={`btn btn-xs rounded-full border-0 ${
              grain === o.value ? 'btn-primary text-primary-content' : 'btn-ghost text-neutral'
            }`}
            aria-pressed={grain === o.value}
            onClick={() => onChange(o.value)}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function SplitToggle({
  split,
  onChange,
}: {
  split: SnapshotSplit;
  onChange: (s: SnapshotSplit) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-neutral/55">
        Split
      </span>
      <div
        className="inline-flex rounded-full border border-base-300 p-0.5 bg-base-200/60"
        role="group"
        aria-label="Split series"
      >
        {SNAPSHOT_SPLIT_OPTIONS.map((o) => (
          <button
            key={o.value}
            type="button"
            className={`btn btn-xs rounded-full border-0 ${
              split === o.value ? 'btn-primary text-primary-content' : 'btn-ghost text-neutral'
            }`}
            aria-pressed={split === o.value}
            onClick={() => onChange(o.value)}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function showPriorityDateTick(
  grain: PriorityDateGrain,
  data: { meta: TimeBucketMeta }[],
  d: { key: string; shortLabel: string },
  i: number,
) {
  if (grain === 'year' || grain === 'quarter') return true;
  if (d.key === '_earlier') return true;
  const hasPrior = data[0]?.meta.key === '_earlier';
  const offset = hasPrior ? 1 : 0;
  const idx = i - offset;
  // Leave room after the Prior label so it does not collide with the next year tick.
  if (hasPrior && idx < 5) return false;
  if (d.shortLabel.length > 1) return true; // year numbers
  return idx === 0 || i === data.length - 1 || idx % 6 === 0;
}

function defaultCompareIds(releases: I485Release[]): {
  fromId: number | null;
  toId: number | null;
} {
  if (releases.length === 0) return { fromId: null, toId: null };
  const toId = releases[releases.length - 1]!.id;
  const fromId =
    releases.length >= 2 ? releases[releases.length - 2]!.id : releases[0]!.id;
  return { fromId, toId };
}

export interface I485ExplorerProps {
  initialReleases?: I485Release[];
  initialReleaseId?: number | null;
  initialSnapshotCells?: I485Cell[] | null;
  initialError?: string | null;
}

export default function I485Explorer({
  initialReleases = [],
  initialReleaseId = null,
  initialSnapshotCells = null,
  initialError = null,
}: I485ExplorerProps) {
  const available = isI485DataAvailable();
  const [releases, setReleases] = useState<I485Release[]>(initialReleases);
  const [loadError, setLoadError] = useState<string | null>(initialError);

  const [view, setView] = useState<ViewId>('snapshot');
  const [countries, setCountries] = useState<I485Country[]>([]);
  const [categories, setCategories] = useState<string[]>([...DEFAULT_CATEGORIES]);
  const [grain, setGrain] = useState<PriorityDateGrain>('quarter');
  const [split, setSplit] = useState<SnapshotSplit>('none');

  // Snapshot view state
  const [releaseId, setReleaseId] = useState<number | null>(initialReleaseId);
  const [snapshotCells, setSnapshotCells] = useState<I485Cell[] | null>(initialSnapshotCells);

  // Cohort view state
  const [pdYear, setPdYear] = useState<number>(2024);
  const [pdMonth, setPdMonth] = useState<number | 'all'>('all');
  const [cohortCells, setCohortCells] = useState<I485Cell[] | null>(null);

  // Compare view state
  const initialCompare = defaultCompareIds(initialReleases);
  const [compareFromId, setCompareFromId] = useState<number | null>(initialCompare.fromId);
  const [compareToId, setCompareToId] = useState<number | null>(
    initialCompare.toId ?? initialReleaseId,
  );
  const [compareFromCells, setCompareFromCells] = useState<I485Cell[] | null>(null);
  const [compareToCells, setCompareToCells] = useState<I485Cell[] | null>(null);

  const [loading, setLoading] = useState(false);
  const skipInitialSnapshotFetch = useRef(
    initialSnapshotCells != null && initialReleaseId != null && initialReleases.length > 0,
  );

  useEffect(() => {
    if (!available) return;
    if (initialReleases.length > 0) return;
    fetchI485Releases()
      .then((rs) => {
        setReleases(rs);
        if (rs.length > 0) {
          setReleaseId(rs[rs.length - 1]!.id);
          const ids = defaultCompareIds(rs);
          setCompareFromId(ids.fromId);
          setCompareToId(ids.toId);
        }
      })
      .catch((e: Error) => setLoadError(e.message));
  }, [available, initialReleases.length]);

  // When SSR releases arrive without compare defaults (shouldn't happen), sync once.
  useEffect(() => {
    if (compareFromId != null || releases.length === 0) return;
    const ids = defaultCompareIds(releases);
    setCompareFromId(ids.fromId);
    setCompareToId(ids.toId);
  }, [releases, compareFromId]);

  const selectedRelease = releases.find((r) => r.id === releaseId) ?? null;
  const compareFromRelease = releases.find((r) => r.id === compareFromId) ?? null;
  const compareToRelease = releases.find((r) => r.id === compareToId) ?? null;
  const members = useMemo(() => categoryMembersForMany(categories), [categories]);
  const countryFilter = useMemo(
    () => (countries.length > 0 ? countries : undefined),
    [countries],
  );
  const isDefaultCategories =
    categories.length === DEFAULT_CATEGORIES.length &&
    categories.every((c, i) => c === DEFAULT_CATEGORIES[i]);

  // Snapshot data
  useEffect(() => {
    if (!available || releaseId == null) return;
    if (
      skipInitialSnapshotFetch.current &&
      releaseId === initialReleaseId &&
      countries.length === 0 &&
      isDefaultCategories
    ) {
      skipInitialSnapshotFetch.current = false;
      return;
    }
    let cancel = false;
    setLoading(true);
    fetchI485Cells({
      releaseId,
      countries: countryFilter,
      categories: members,
    })
      .then((cells) => {
        if (!cancel) setSnapshotCells(cells);
      })
      .catch((e: Error) => !cancel && setLoadError(e.message))
      .finally(() => !cancel && setLoading(false));
    return () => {
      cancel = true;
    };
  }, [
    available,
    releaseId,
    countries,
    countryFilter,
    members,
    categories,
    isDefaultCategories,
    initialReleaseId,
  ]);

  // Cohort data
  useEffect(() => {
    if (!available || view !== 'cohort') return;
    let cancel = false;
    setLoading(true);
    fetchI485Cells({
      countries: countryFilter,
      categories: members,
      pdYear,
      pdMonth: pdMonth === 'all' ? undefined : pdMonth,
    })
      .then((cells) => {
        if (!cancel) setCohortCells(cells);
      })
      .catch((e: Error) => !cancel && setLoadError(e.message))
      .finally(() => !cancel && setLoading(false));
    return () => {
      cancel = true;
    };
  }, [available, view, countries, countryFilter, members, pdYear, pdMonth]);

  // Compare data (both snapshots)
  useEffect(() => {
    if (!available || view !== 'compare') return;
    if (compareFromId == null || compareToId == null) return;
    let cancel = false;
    setLoading(true);
    const filters = {
      countries: countryFilter,
      categories: members,
    };
    Promise.all([
      fetchI485Cells({ ...filters, releaseId: compareFromId }),
      fetchI485Cells({ ...filters, releaseId: compareToId }),
    ])
      .then(([fromCells, toCells]) => {
        if (cancel) return;
        setCompareFromCells(fromCells);
        setCompareToCells(toCells);
      })
      .catch((e: Error) => !cancel && setLoadError(e.message))
      .finally(() => !cancel && setLoading(false));
    return () => {
      cancel = true;
    };
  }, [available, view, compareFromId, compareToId, countries, countryFilter, members]);

  const snapshotSeries = useMemo(() => {
    if (!snapshotCells) return [];
    return aggregateByPriorityDateGrain(snapshotCells, grain);
  }, [snapshotCells, grain]);

  const snapshotBars = useMemo(
    () =>
      snapshotSeries.map(({ meta, bucket }) => ({
        key: meta.key,
        label: meta.label,
        shortLabel: meta.shortLabel,
        value: bucket.count,
        valueLabel: `${bucketLabel(bucket)} pending`,
      })),
    [snapshotSeries],
  );

  const snapshotSplit = useMemo(() => {
    if (!snapshotCells || split === 'none') return null;

    if (split === 'country') {
      const keys = splitCountriesForFilter(countries);
      return aggregateSplitByPriorityDateGrain(
        snapshotCells,
        grain,
        keys,
        (c) => c.country,
        (key) => countryLabel(key as I485Country),
      );
    }

    const plan = resolveCategorySplitSeries(categories);
    return aggregateSplitByPriorityDateGrain(
      snapshotCells,
      grain,
      plan.seriesKeys,
      plan.seriesKeyForCell,
      plan.seriesLabel,
    );
  }, [snapshotCells, split, countries, grain, categories]);

  const snapshotSplitLines = useMemo(() => {
    if (!snapshotSplit) return [];
    return snapshotSplit.series.map((s) => ({
      key: s.key,
      label: s.label,
      data: s.points.map((p) => ({ key: p.key, value: p.value })),
    }));
  }, [snapshotSplit]);

  const snapshotTotal = useMemo(
    () => totalWithNote(snapshotSeries.map((d) => d.bucket)),
    [snapshotSeries],
  );

  const cohortSeries = useMemo(() => {
    if (!cohortCells) return [];
    const byRelease = aggregateBy(cohortCells, (c) => c.release_id);
    return releases.map((r) => ({
      key: String(r.id),
      label: formatAsOfShort(r.as_of_date),
      bucket: byRelease.get(r.id) ?? { count: 0, suppressedCells: 0 },
    }));
  }, [cohortCells, releases]);

  const cohortLine = useMemo(
    () =>
      cohortSeries.map((p) => ({
        key: p.key,
        label: p.label,
        value: p.bucket.count,
        valueLabel: bucketLabel(p.bucket),
      })),
    [cohortSeries],
  );

  const cohortSuppressed = useMemo(
    () => totalWithNote(cohortSeries.map((p) => p.bucket)).suppressedCells,
    [cohortSeries],
  );

  const compareRows = useMemo(() => {
    if (!compareFromCells || !compareToCells) return [];
    const fromSeries = aggregateByPriorityDateGrain(compareFromCells, grain);
    const toSeries = aggregateByPriorityDateGrain(compareToCells, grain);
    const byKey = new Map<
      string,
      {
        meta: TimeBucketMeta;
        earlier: AggregatedBucket;
        later: AggregatedBucket;
      }
    >();
    for (const row of fromSeries) {
      byKey.set(row.meta.key, {
        meta: row.meta,
        earlier: row.bucket,
        later: { count: 0, suppressedCells: 0 },
      });
    }
    for (const row of toSeries) {
      const existing = byKey.get(row.meta.key);
      if (existing) existing.later = row.bucket;
      else {
        byKey.set(row.meta.key, {
          meta: row.meta,
          earlier: { count: 0, suppressedCells: 0 },
          later: row.bucket,
        });
      }
    }
    return Array.from(byKey.values())
      .map((row) => ({
        ...row,
        delta: row.later.count - row.earlier.count,
      }))
      .sort((a, b) => a.meta.key.localeCompare(b.meta.key));
  }, [compareFromCells, compareToCells, grain]);

  const compareDiffBars = useMemo(
    () =>
      compareRows.map((row) => ({
        key: row.meta.key,
        label: row.meta.label,
        shortLabel: row.meta.shortLabel,
        value: row.delta,
        valueLabel: `${formatSignedCount(row.delta)} pending`,
      })),
    [compareRows],
  );

  const compareNet = useMemo(() => {
    const earlierTotal = totalWithNote(compareRows.map((r) => r.earlier));
    const laterTotal = totalWithNote(compareRows.map((r) => r.later));
    return {
      earlier: earlierTotal,
      later: laterTotal,
      delta: laterTotal.count - earlierTotal.count,
      suppressedCells: earlierTotal.suppressedCells + laterTotal.suppressedCells,
    };
  }, [compareRows]);

  const compareTableRows = useMemo(
    () =>
      [...compareRows]
        .filter((r) => r.delta !== 0 || r.earlier.count > 0 || r.later.count > 0)
        .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta)),
    [compareRows],
  );

  const pdYearOptions = useMemo(() => {
    const years: number[] = [];
    for (let y = 2026; y >= 2005; y -= 1) years.push(y);
    return years;
  }, []);

  const releaseOptionsDesc = useMemo(() => [...releases].reverse(), [releases]);

  if (!available) {
    return (
      <div className="rounded-xl border-2 border-base-300 bg-base-100 p-5 text-sm text-neutral leading-relaxed">
        The inventory database is not connected in this environment. The raw USCIS reports are
        always available on the{' '}
        <a
          href={USCIS_DATA_PAGE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-secondary underline underline-offset-2 hover:text-primary"
        >
          USCIS Immigration and Citizenship Data page
        </a>
        .
      </div>
    );
  }

  return (
    <div>
      <I485ViewBar active={view} onSelect={setView} />

      <div className="max-w-4xl mx-auto px-4 pt-6 sm:pt-8 space-y-5">
      {/* Filters */}
      <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {view === 'snapshot' && (
          <label className="form-control">
            <span className="label-text text-xs font-semibold text-neutral/80 pb-1">
              USCIS snapshot
            </span>
            <select
              className="select select-bordered select-sm"
              value={releaseId ?? ''}
              onChange={(e) => setReleaseId(Number(e.target.value))}
            >
              {releases.length === 0 && <option value="">Loading snapshots…</option>}
              {releaseOptionsDesc.map((r, i) => (
                <option key={r.id} value={r.id}>
                  As of {formatAsOf(r.as_of_date)}
                  {i === 0 ? ' (latest)' : ''}
                </option>
              ))}
            </select>
          </label>
        )}

        {view === 'compare' && (
          <>
            <label className="form-control">
              <span className="label-text text-xs font-semibold text-neutral/80 pb-1">From</span>
              <select
                className="select select-bordered select-sm"
                value={compareFromId ?? ''}
                onChange={(e) => setCompareFromId(Number(e.target.value))}
              >
                {releaseOptionsDesc.map((r) => (
                  <option key={r.id} value={r.id}>
                    As of {formatAsOf(r.as_of_date)}
                  </option>
                ))}
              </select>
            </label>
            <label className="form-control">
              <span className="label-text text-xs font-semibold text-neutral/80 pb-1">To</span>
              <select
                className="select select-bordered select-sm"
                value={compareToId ?? ''}
                onChange={(e) => setCompareToId(Number(e.target.value))}
              >
                {releaseOptionsDesc.map((r, i) => (
                  <option key={r.id} value={r.id}>
                    As of {formatAsOf(r.as_of_date)}
                    {i === 0 ? ' (latest)' : ''}
                  </option>
                ))}
              </select>
            </label>
          </>
        )}

        {view === 'cohort' && (
          <>
            <label className="form-control">
              <span className="label-text text-xs font-semibold text-neutral/80 pb-1">
                Priority-date year
              </span>
              <select
                className="select select-bordered select-sm"
                value={pdYear}
                onChange={(e) => setPdYear(Number(e.target.value))}
              >
                {pdYearOptions.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </label>
            <label className="form-control">
              <span className="label-text text-xs font-semibold text-neutral/80 pb-1">
                Priority-date month
              </span>
              <select
                className="select select-bordered select-sm"
                value={pdMonth}
                onChange={(e) =>
                  setPdMonth(e.target.value === 'all' ? 'all' : Number(e.target.value))
                }
              >
                <option value="all">All months</option>
                {MONTH_LABELS.map((m, i) => (
                  <option key={m} value={i + 1}>
                    {m}
                  </option>
                ))}
              </select>
            </label>
          </>
        )}
      </div>

      <I485CategoryPicker value={categories} onChange={setCategories} />
      <I485CountryPicker value={countries} onChange={setCountries} />
      </div>

      {loadError && (
        <div className="rounded-xl border-2 border-error/40 bg-error/10 p-4 text-sm text-neutral">
          Could not load inventory data: {loadError}
        </div>
      )}

      {/* Results */}
      <div className="rounded-xl border-2 border-base-300 bg-base-100 p-4 sm:p-5 shadow-sm space-y-4">
        {loading && !snapshotCells && view === 'snapshot' && (
          <p className="text-sm text-neutral/70">Loading inventory…</p>
        )}
        {loading && view === 'cohort' && !cohortCells && (
          <p className="text-sm text-neutral/70">Loading cohort…</p>
        )}
        {loading &&
          view === 'compare' &&
          (!compareFromCells || !compareToCells) && (
            <p className="text-sm text-neutral/70">Loading comparison…</p>
          )}

        {view === 'snapshot' && snapshotCells && (
          <>
            <ChartHeader>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1 min-w-0">
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <span className="text-2xl font-bold tabular-nums text-primary">
                      {nf.format(snapshotTotal.count)}
                      {snapshotTotal.suppressedCells > 0 ? '+' : ''}
                    </span>
                    <span className="text-xs text-neutral/70">
                      total pending
                      {selectedRelease ? ` as of ${formatAsOf(selectedRelease.as_of_date)}` : ''}
                    </span>
                  </div>
                  <p className="text-xs font-medium text-neutral/55">
                    Pending I-485 by priority date
                    {loading ? (
                      <span className="ml-2 font-normal text-neutral/40">Updating…</span>
                    ) : null}
                  </p>
                </div>
                <div className="flex flex-col items-stretch sm:items-end gap-2">
                  <GrainToggle grain={grain} onChange={setGrain} />
                  <SplitToggle split={split} onChange={setSplit} />
                </div>
              </div>
            </ChartHeader>
            {split !== 'none' && (
              <p className="text-xs text-neutral/70">
                Pending stock by priority date in this snapshot, not change across releases.
              </p>
            )}
            {split === 'none' ? (
              snapshotBars.length > 0 ? (
                <BarChart
                  data={snapshotBars}
                  height={220}
                  minBarWidth={grain === 'month' ? 8 : grain === 'quarter' ? 22 : 36}
                  showTick={(d, i) => showPriorityDateTick(grain, snapshotSeries, d, i)}
                  ariaLabel="Pending I-485 applications by priority date"
                />
              ) : (
                <p className="text-sm text-neutral">
                  No pending applications reported for this selection.
                </p>
              )
            ) : snapshotSplit && snapshotSplit.xAxis.length > 0 ? (
              <MultiSeriesLineChart
                xAxis={snapshotSplit.xAxis}
                series={snapshotSplitLines}
                height={240}
                showTick={(d, i) =>
                  showPriorityDateTick(grain, snapshotSplit.xAxis.map((meta) => ({ meta })), d, i)
                }
                ariaLabel={
                  split === 'country'
                    ? 'Pending I-485 by priority date, split by country'
                    : 'Pending I-485 by priority date, split by category'
                }
              />
            ) : (
              <p className="text-sm text-neutral">
                No pending applications reported for this selection.
              </p>
            )}
            {grain === 'year' && (
              <p className="text-xs text-neutral/70">
                Fiscal years run October–September (FY2025 = Oct 2024 through Sep 2025).
              </p>
            )}
            {grain === 'quarter' && (
              <p className="text-xs text-neutral/70">
                Quarters are calendar year (Q1 = Jan–Mar).
              </p>
            )}
          </>
        )}

        {view === 'snapshot' && !loading && !snapshotCells && !loadError && (
          <p className="text-sm text-neutral/70">Loading inventory…</p>
        )}

        {view === 'compare' && compareFromCells && compareToCells && (
          <>
            <ChartHeader>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1 min-w-0">
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <span
                      className={`text-2xl font-bold tabular-nums ${
                        compareNet.delta > 0
                          ? 'text-secondary'
                          : compareNet.delta < 0
                            ? 'text-error'
                            : 'text-primary'
                      }`}
                    >
                      {formatSignedCount(compareNet.delta)}
                    </span>
                    <span className="text-xs text-neutral/70">
                      net change
                      {compareFromRelease && compareToRelease
                        ? ` from ${formatAsOfShort(compareFromRelease.as_of_date)} to ${formatAsOfShort(compareToRelease.as_of_date)}`
                        : ''}
                      {' · '}
                      {nf.format(compareNet.earlier.count)} → {nf.format(compareNet.later.count)}
                    </span>
                  </div>
                  <p className="text-xs font-medium text-neutral/55">
                    Change in pending I-485 by priority date
                    {loading ? (
                      <span className="ml-2 font-normal text-neutral/40">Updating…</span>
                    ) : null}
                  </p>
                </div>
                <GrainToggle grain={grain} onChange={setGrain} />
              </div>
            </ChartHeader>
            <p className="text-xs text-neutral/70">
              Green rose and red fell between snapshots; change mixes new filings with completions.
            </p>
            {compareDiffBars.some((d) => d.value !== 0) ? (
              <DiffBarChart
                data={compareDiffBars}
                height={240}
                minBarWidth={grain === 'month' ? 8 : grain === 'quarter' ? 22 : 36}
                showTick={(d, i) =>
                  showPriorityDateTick(
                    grain,
                    compareRows.map((r) => ({ meta: r.meta })),
                    d,
                    i,
                  )
                }
                ariaLabel="Change in pending I-485 by priority date between two snapshots"
              />
            ) : (
              <p className="text-sm text-neutral">
                No change in disclosed pending counts for this selection.
              </p>
            )}
            {grain === 'year' && (
              <p className="text-xs text-neutral/70">
                Fiscal years run October–September (FY2025 = Oct 2024 through Sep 2025).
              </p>
            )}
            {grain === 'quarter' && (
              <p className="text-xs text-neutral/70">
                Quarters are calendar year (Q1 = Jan–Mar).
              </p>
            )}

            {compareTableRows.length > 0 && (
              <div className="overflow-x-auto border border-base-300 rounded-lg">
                <table className="table table-sm">
                  <thead>
                    <tr className="text-xs text-neutral/70">
                      <th>Priority date</th>
                      <th className="text-right">
                        {compareFromRelease
                          ? formatAsOfShort(compareFromRelease.as_of_date)
                          : 'From'}
                      </th>
                      <th className="text-right">
                        {compareToRelease ? formatAsOfShort(compareToRelease.as_of_date) : 'To'}
                      </th>
                      <th className="text-right">Change</th>
                    </tr>
                  </thead>
                  <tbody>
                    {compareTableRows.slice(0, 40).map((row) => (
                      <tr key={row.meta.key} className="text-sm">
                        <td className="font-medium text-primary">{row.meta.label}</td>
                        <td className="text-right tabular-nums">{bucketLabel(row.earlier)}</td>
                        <td className="text-right tabular-nums">{bucketLabel(row.later)}</td>
                        <td
                          className={`text-right tabular-nums font-semibold ${
                            row.delta > 0
                              ? 'text-secondary'
                              : row.delta < 0
                                ? 'text-error'
                                : 'text-neutral'
                          }`}
                        >
                          {formatSignedCount(row.delta)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {compareTableRows.length > 40 && (
                  <p className="text-xs text-neutral/60 px-3 py-2 border-t border-base-300">
                    Showing the 40 largest absolute changes of {compareTableRows.length} priority-date
                    buckets.
                  </p>
                )}
              </div>
            )}
          </>
        )}

        {view === 'cohort' && cohortCells && (
          <>
            <ChartHeader>
              <h3 className="text-sm font-semibold text-primary">
                Pending I-485 with a{' '}
                {pdMonth === 'all' ? '' : `${MONTH_LABELS[(pdMonth as number) - 1]} `}
                {pdYear} priority date, snapshot by snapshot
                {loading ? (
                  <span className="ml-2 font-normal text-neutral/55">Updating…</span>
                ) : null}
              </h3>
            </ChartHeader>
            <p className="text-xs text-neutral/70">
              Change mixes new filings into the cohort with completions leaving it.
            </p>
            {cohortLine.some((p) => p.value > 0) ? (
              <LineChart
                data={cohortLine}
                height={220}
                ariaLabel="Pending applications for the selected cohort across USCIS snapshots"
              />
            ) : (
              <p className="text-sm text-neutral">
                No pending applications reported for this cohort in any snapshot.
              </p>
            )}
          </>
        )}

        <ChartFooter
          cells={
            view === 'compare'
              ? compareNet.suppressedCells
              : view === 'cohort'
                ? cohortSuppressed
                : snapshotTotal.suppressedCells
          }
        />
      </div>
      </div>
    </div>
  );
}

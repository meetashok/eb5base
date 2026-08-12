'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { BarChart, LineChart } from '@/components/charts';
import {
  CATEGORY_OPTIONS,
  COUNTRY_OPTIONS,
  MONTH_LABELS,
  USCIS_DATA_PAGE_URL,
  aggregateBy,
  aggregateByPriorityDateGrain,
  fetchI485Cells,
  fetchI485Releases,
  formatAsOf,
  formatAsOfShort,
  isI485DataAvailable,
  type AggregatedBucket,
  type I485Cell,
  type I485Country,
  type I485Release,
  type PriorityDateGrain,
  type TimeBucketMeta,
} from '@/lib/analysis/i485';

type ViewId = 'snapshot' | 'cohort';

const nf = new Intl.NumberFormat('en-US');
const DEFAULT_CATEGORY = 'EB5_ALL';
const GRAIN_OPTIONS: { value: PriorityDateGrain; label: string }[] = [
  { value: 'month', label: 'Months' },
  { value: 'quarter', label: 'Quarters' },
  { value: 'year', label: 'Fiscal years' },
];

function categoryMembers(value: string) {
  return CATEGORY_OPTIONS.find((o) => o.value === value)?.members ?? [];
}

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

function SuppressionNote({ cells }: { cells: number }) {
  if (cells === 0) return null;
  return (
    <p className="text-xs text-neutral/70 leading-relaxed">
      {nf.format(cells)} value{cells === 1 ? '' : 's'} in this selection are suppressed by USCIS
      (&quot;D&quot;, under 10 each) and are excluded from the totals shown. Actual totals can be up
      to {nf.format(cells * 9)} higher.
    </p>
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
  if (d.shortLabel.length > 1) return true;
  const offset = data[0]?.meta.key === '_earlier' ? 1 : 0;
  const idx = i - offset;
  return idx === 0 || i === data.length - 1 || idx % 6 === 0;
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
  const [country, setCountry] = useState<string>('all');
  const [category, setCategory] = useState<string>(DEFAULT_CATEGORY);
  const [grain, setGrain] = useState<PriorityDateGrain>('month');

  // Snapshot view state
  const [releaseId, setReleaseId] = useState<number | null>(initialReleaseId);
  const [snapshotCells, setSnapshotCells] = useState<I485Cell[] | null>(initialSnapshotCells);

  // Cohort view state
  const [pdYear, setPdYear] = useState<number>(2024);
  const [pdMonth, setPdMonth] = useState<number | 'all'>('all');
  const [cohortCells, setCohortCells] = useState<I485Cell[] | null>(null);

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
        if (rs.length > 0) setReleaseId(rs[rs.length - 1].id);
      })
      .catch((e: Error) => setLoadError(e.message));
  }, [available, initialReleases.length]);

  const selectedRelease = releases.find((r) => r.id === releaseId) ?? null;
  const members = useMemo(() => categoryMembers(category), [category]);

  // Snapshot data
  useEffect(() => {
    if (!available || releaseId == null) return;
    if (
      skipInitialSnapshotFetch.current &&
      releaseId === initialReleaseId &&
      country === 'all' &&
      category === DEFAULT_CATEGORY
    ) {
      skipInitialSnapshotFetch.current = false;
      return;
    }
    let cancel = false;
    setLoading(true);
    fetchI485Cells({
      releaseId,
      country: country === 'all' ? undefined : (country as I485Country),
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
  }, [available, releaseId, country, members, category, initialReleaseId]);

  // Cohort data
  useEffect(() => {
    if (!available || view !== 'cohort') return;
    let cancel = false;
    setLoading(true);
    fetchI485Cells({
      country: country === 'all' ? undefined : (country as I485Country),
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
  }, [available, view, country, members, pdYear, pdMonth]);

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

  const pdYearOptions = useMemo(() => {
    const years: number[] = [];
    for (let y = 2026; y >= 2005; y -= 1) years.push(y);
    return years;
  }, []);

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
    <div className="space-y-5">
      {/* View toggle */}
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Inventory views">
        {(
          [
            { id: 'snapshot', label: 'Inventory at a point in time' },
            { id: 'cohort', label: 'Track a priority-date cohort' },
          ] as { id: ViewId; label: string }[]
        ).map((v) => (
          <button
            key={v.id}
            type="button"
            role="tab"
            aria-selected={view === v.id}
            className={`btn btn-sm rounded-full ${
              view === v.id ? 'btn-primary text-primary-content' : 'btn-outline border-neutral/30'
            }`}
            onClick={() => setView(v.id)}
          >
            {v.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {view === 'snapshot' ? (
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
              {[...releases].reverse().map((r) => (
                <option key={r.id} value={r.id}>
                  As of {formatAsOf(r.as_of_date)}
                </option>
              ))}
            </select>
          </label>
        ) : (
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
        <label className="form-control">
          <span className="label-text text-xs font-semibold text-neutral/80 pb-1">Category</span>
          <select
            className="select select-bordered select-sm"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {CATEGORY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label className="form-control">
          <span className="label-text text-xs font-semibold text-neutral/80 pb-1">
            Country of chargeability
          </span>
          <select
            className="select select-bordered select-sm"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
          >
            {COUNTRY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
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

        {view === 'snapshot' && snapshotCells && (
          <>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <h3 className="text-sm font-semibold text-primary">
                  Pending I-485 by priority date
                  {loading ? (
                    <span className="ml-2 font-normal text-neutral/55">Updating…</span>
                  ) : null}
                </h3>
                <span className="text-2xl font-bold tabular-nums text-primary">
                  {nf.format(snapshotTotal.count)}
                  {snapshotTotal.suppressedCells > 0 ? '+' : ''}
                </span>
                <span className="text-xs text-neutral/70">
                  total pending
                  {selectedRelease ? ` as of ${formatAsOf(selectedRelease.as_of_date)}` : ''}
                </span>
              </div>
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
                      grain === o.value
                        ? 'btn-primary text-primary-content'
                        : 'btn-ghost text-neutral'
                    }`}
                    aria-pressed={grain === o.value}
                    onClick={() => setGrain(o.value)}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
            {snapshotBars.length > 0 ? (
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
            )}
            {grain === 'year' && (
              <p className="text-xs text-neutral/70">
                Fiscal years run October–September (FY2025 = Oct 2024 through Sep 2025).
              </p>
            )}
            {grain === 'quarter' && (
              <p className="text-xs text-neutral/70">
                Quarters follow the federal fiscal year (Q1 = Oct–Dec).
              </p>
            )}
            <SuppressionNote cells={snapshotTotal.suppressedCells} />
          </>
        )}

        {view === 'snapshot' && !loading && !snapshotCells && !loadError && (
          <p className="text-sm text-neutral/70">Loading inventory…</p>
        )}

        {view === 'cohort' && cohortCells && (
          <>
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-primary">
                Pending I-485 with a {pdMonth === 'all' ? '' : `${MONTH_LABELS[(pdMonth as number) - 1]} `}
                {pdYear} priority date, snapshot by snapshot
                {loading ? <span className="ml-2 font-normal text-neutral/55">Updating…</span> : null}
              </h3>
              <p className="text-xs text-neutral/70 leading-relaxed">
                The month-over-month change mixes new filings into the cohort with completed cases
                leaving it. USCIS does not publish adjudications separately in this report.
              </p>
            </div>
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
            <SuppressionNote cells={cohortSuppressed} />
          </>
        )}

        <p className="text-xs text-neutral/70 pt-1">
          <Link
            href="/analysis/i485/data"
            className="font-semibold text-secondary underline underline-offset-2 hover:text-primary"
          >
            Source data
          </Link>
          {' · '}
          official USCIS XLSX downloads
          {releases.length > 0 ? ` · ${releases.length} monthly reports` : ''}
        </p>
      </div>
    </div>
  );
}

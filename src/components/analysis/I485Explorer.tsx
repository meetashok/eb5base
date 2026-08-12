'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  CATEGORY_OPTIONS,
  COUNTRY_OPTIONS,
  MONTH_LABELS,
  USCIS_DATA_PAGE_URL,
  aggregateBy,
  fetchI485Cells,
  fetchI485Releases,
  formatAsOf,
  formatAsOfShort,
  isI485DataAvailable,
  type AggregatedBucket,
  type I485Cell,
  type I485Country,
  type I485Release,
} from '@/lib/analysis/i485';

type ViewId = 'snapshot' | 'cohort';

const nf = new Intl.NumberFormat('en-US');
const DEFAULT_CATEGORY = 'EB5_ALL';

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

/** Horizontal bar list: pending count by priority-date year. */
function YearBars({ data }: { data: { label: string; bucket: AggregatedBucket }[] }) {
  const max = Math.max(...data.map((d) => d.bucket.count), 1);
  return (
    <div className="space-y-1.5">
      {data.map(({ label, bucket }) => (
        <div key={label} className="flex items-center gap-2 text-xs">
          <span className="w-16 shrink-0 text-right tabular-nums font-medium text-neutral/80">
            {label}
          </span>
          <div className="flex-1 h-5 rounded-sm bg-base-200 overflow-hidden">
            <div
              className="h-full rounded-sm bg-secondary/85"
              style={{ width: `${Math.max(bucket.count > 0 ? 1.2 : 0, (bucket.count / max) * 100)}%` }}
            />
          </div>
          <span className="w-20 shrink-0 tabular-nums text-neutral">{bucketLabel(bucket)}</span>
        </div>
      ))}
    </div>
  );
}

/** Line chart of a cohort's pending count across snapshots. */
function CohortLine({
  points,
}: {
  points: { label: string; bucket: AggregatedBucket }[];
}) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const max = Math.max(...points.map((p) => p.bucket.count), 1);
  const chartH = 200;
  const padTop = 12;
  const plotH = chartH - padTop - 8;

  if (points.length === 0) return null;
  const coords = points.map((p, i) => {
    const x = ((i + 0.5) / points.length) * 100;
    const y = padTop + plotH - (p.bucket.count / max) * plotH;
    return { x, y };
  });
  const line = coords.map((c) => `${c.x},${(c.y / chartH) * 100}`).join(' ');
  const hovered = hoverIdx != null ? points[hoverIdx] : null;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center text-xs font-semibold text-neutral min-h-4">
        {hovered && (
          <span className="ml-auto tabular-nums text-primary">
            {hovered.label} · {bucketLabel(hovered.bucket)} pending
          </span>
        )}
      </div>
      <div
        className="relative w-full"
        style={{ height: chartH }}
        role="img"
        aria-label="Pending applications for the selected cohort across USCIS snapshots"
        onMouseLeave={() => setHoverIdx(null)}
      >
        <svg
          className="absolute inset-0 h-full w-full pointer-events-none"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden
        >
          <polyline
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            vectorEffect="non-scaling-stroke"
            className="text-primary"
            points={line}
          />
        </svg>
        <div className="absolute inset-0" aria-hidden>
          {coords.map((c, i) => (
            <span
              key={points[i].label}
              className={`absolute block rounded-full border-2 border-base-100 shadow-sm -translate-x-1/2 -translate-y-1/2 cursor-default ${
                hoverIdx === i ? 'bg-accent h-3 w-3' : 'bg-primary h-2 w-2'
              }`}
              style={{ left: `${c.x}%`, top: c.y }}
              onMouseEnter={() => setHoverIdx(i)}
            />
          ))}
        </div>
      </div>
      <div className="flex justify-between text-[10px] tabular-nums text-neutral/55" aria-hidden>
        <span>{points[0].label}</span>
        {points.length > 2 && <span>{points[Math.floor(points.length / 2)].label}</span>}
        <span>{points[points.length - 1].label}</span>
      </div>
    </div>
  );
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

  const snapshotByYear = useMemo(() => {
    if (!snapshotCells) return [];
    const byYear = aggregateBy(snapshotCells, (c) => c.pd_year);
    return Array.from(byYear.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([year, bucket]) => ({
        label: year === 0 ? 'Earlier' : String(year),
        bucket,
      }));
  }, [snapshotCells]);

  const snapshotTotal = useMemo(
    () => totalWithNote(snapshotByYear.map((d) => d.bucket)),
    [snapshotByYear],
  );

  const cohortSeries = useMemo(() => {
    if (!cohortCells) return [];
    const byRelease = aggregateBy(cohortCells, (c) => c.release_id);
    return releases.map((r) => ({
      label: formatAsOfShort(r.as_of_date),
      bucket: byRelease.get(r.id) ?? { count: 0, suppressedCells: 0 },
    }));
  }, [cohortCells, releases]);

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
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h3 className="text-sm font-semibold text-primary">
                Pending I-485 by priority-date year
                {loading ? <span className="ml-2 font-normal text-neutral/55">Updating…</span> : null}
              </h3>
              <span className="text-2xl font-bold tabular-nums text-primary">
                {nf.format(snapshotTotal.count)}
                {snapshotTotal.suppressedCells > 0 ? '+' : ''}
              </span>
              <span className="text-xs text-neutral/70">
                total pending{selectedRelease ? ` as of ${formatAsOf(selectedRelease.as_of_date)}` : ''}
              </span>
            </div>
            {snapshotByYear.length > 0 ? (
              <YearBars data={snapshotByYear} />
            ) : (
              <p className="text-sm text-neutral">
                No pending applications reported for this selection.
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
            {cohortSeries.some((p) => p.bucket.count > 0) ? (
              <CohortLine points={cohortSeries} />
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

'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  BarChart,
  LineChart,
  MultiSeriesLineChart,
  formatSignedCount,
  seriesColor,
} from '@/components/charts';
import { filterChipClass } from '@/components/analysis/filterChipClass';
import I526ShareButton from '@/components/analysis/I526ShareButton';
import {
  COUNTRY_FILTER_OPTIONS,
  DEFAULT_COUNTRIES,
  DEFAULT_FORM_A,
  DEFAULT_TEA,
  FORM_FILTERS_A,
  FORM_FILTERS_B,
  PROCESSING_FORM_LABELS,
  PROCESSING_METRIC_LABELS,
  TEA_FILTER_OPTIONS,
  aggregateFilingTimeSeries,
  aggregateSplitFilingTimeSeries,
  calendarQuarterLabelForAsOf,
  fetchI526FilingCells,
  fetchI526Processing,
  fetchI526Releases,
  isI526DataAvailable,
  parseAsOfQuarter,
  processingRowForForm,
  quarterLabelForAsOf,
  resolveFilterMembers,
  sumBuckets,
  sumMetricAcrossForms,
  toggleCountryFilter,
  toggleFormAFilter,
  toggleFormBFilter,
  toggleTeaFilter,
  totalWithSuppressedNote,
  type AggregatedBucket,
  type FilingCountry,
  type FilingFormType,
  type FilingGrain,
  type FilingSplit,
  type I526FilingCell,
  type I526ProcessingRow,
  type I526Release,
  type ProcessingFormType,
  type ProcessingMetricKey,
  type TeaCategory,
} from '@/lib/analysis/i526';
import {
  makeSharePayload,
  sharePayloadToSearchParams,
  type I526SharePayload,
} from '@/lib/analysis/i526ShareParams';

type ViewId = 'trend' | 'throughput' | 'data';

const nf = new Intl.NumberFormat('en-US');

function bucketLabel(b: AggregatedBucket): string {
  if (b.suppressedCells === 0) return nf.format(b.count);
  return `${nf.format(b.count)}+`;
}

const GRAIN_OPTIONS: { value: FilingGrain; label: string }[] = [
  { value: 'month', label: 'Months' },
  { value: 'quarter', label: 'Quarters' },
  { value: 'fiscal_year', label: 'FY' },
];

const SPLIT_OPTIONS: { value: FilingSplit; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'form_type', label: 'Form' },
  { value: 'tea', label: 'TEA' },
  { value: 'country', label: 'Country' },
];

function ChartFooter({
  cells,
  link = '/analysis/i526/data',
  onToggleHowToRead,
  howToReadOpen,
}: {
  cells: number;
  link?: string;
  onToggleHowToRead?: () => void;
  howToReadOpen?: boolean;
}) {
  return (
    <p className="text-xs text-neutral/70 leading-relaxed pt-1">
      {cells > 0 && (
        <>
          {nf.format(cells)} value{cells === 1 ? '' : 's'} in this selection are suppressed by USCIS
          (&quot;D&quot;, under 10 each) and are excluded from the totals shown. Actual totals can
          be up to {nf.format(cells * 9)} higher.
          {' · '}
        </>
      )}
      <Link
        href={link}
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

function HowToReadCard() {
  return (
    <section className="max-w-4xl mx-auto px-4 pt-2 pb-8 space-y-6">
      <div className="rounded-xl border-2 border-base-300 bg-base-100 p-4 sm:p-5 text-sm text-neutral leading-relaxed space-y-2">
        <h2 className="text-sm font-bold text-primary">How to read this data</h2>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>
            <span className="font-semibold">I-526 filings data:</span> USCIS{' '}
            <span className="font-semibold">receipts</span> per Form I-526 (standalone) or I-526E
            (regional center) per country of birth, per TEA set-aside category, per receipt month.
          </li>
          <li>
            <span className="font-semibold">Throughput &amp; processing data:</span> Service-wide
            throughput (receipts, approvals, denials, completions, pending, median processing
            months) - aggregated across all countries/categories for the whole EB-5 family.
          </li>
          <li>
            I-526 legacy = petitions filed before the RIA. These are a legacy pipeline; no new
            receipts today but approvals/denials continue. New I-526 standalone = post-RIA
            non-regional center filings.
          </li>
          <li>
            The TEA &quot;Rural &amp; High-UE combined&quot; bucket is reported separately by USCIS
            in some reports - it is <span className="font-semibold">not</span> a double-count of
            Rural + High unemployment.
          </li>
          <li>
            Suppression: values 1-10 masked as D/H; treated as 0 in sums, flagged as suppressed
            cells in the footer.
          </li>
          <li>
            Median processing time is USCIS-reported median months from receipt to completion for
            petitions finalized during the quarter; it is not the wait time a filer experiences
            today.
          </li>
          <li>
            Publication cadence is quarterly, ~10-12 weeks after quarter end. FY26 Q3 and Q4 are
            not yet posted as of this build.
          </li>
        </ul>
      </div>
    </section>
  );
}

function ChartHeader({ children }: { children: ReactNode }) {
  return (
    <header className="-mx-4 border-b-2 border-base-300 bg-base-200/50 px-4 py-3 first:-mt-4 first:rounded-t-[0.65rem] sm:-mx-5 sm:px-5 sm:py-3.5 sm:first:-mt-5">
      {children}
    </header>
  );
}

function ChartHeaderControls({ children }: { children: ReactNode }) {
  return (
    <div className="flex w-full flex-col items-stretch gap-2 sm:w-auto sm:items-end sm:gap-1.5">
      {children}
    </div>
  );
}

const headerToggleRowClass = 'flex flex-wrap items-center gap-2 sm:gap-1.5';
const headerToggleLabelClass =
  'text-[11px] font-semibold uppercase tracking-wide text-neutral/55 sm:text-[10px]';
const headerToggleGroupClass =
  'inline-flex max-w-full flex-wrap rounded-full border border-base-300 p-0.5 bg-base-200/60 gap-0.5';

function headerToggleBtnClass(active: boolean, extra = ''): string {
  return [
    'rounded-full border-0 min-h-0 h-7 px-2.5 text-xs font-semibold leading-none transition-colors sm:h-6 sm:px-2 sm:text-[10px]',
    active ? 'bg-primary text-primary-content' : 'bg-transparent text-neutral hover:bg-base-300/70',
    extra,
  ]
    .filter(Boolean)
    .join(' ');
}

const chartHeaderRowClass =
  'flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between';

function ChartTitleBlock({
  title,
  metric,
  metricClassName = 'text-primary',
  metricNote,
  loading,
  action,
}: {
  title: ReactNode;
  metric?: ReactNode;
  metricClassName?: string;
  metricNote?: ReactNode;
  loading?: boolean;
  action?: ReactNode;
}) {
  return (
    <div className="min-w-0 w-full space-y-1 sm:flex-1">
      <h2 className="text-sm font-semibold leading-snug text-primary sm:text-base">
        {title}
        {loading ? (
          <span className="ml-2 text-xs font-normal text-neutral/40">Updating…</span>
        ) : null}
      </h2>
      {metric != null || metricNote != null ? (
        <p className="text-sm leading-snug text-neutral/70">
          {metric != null ? (
            <span className={`font-semibold tabular-nums ${metricClassName}`}>{metric}</span>
          ) : null}
          {metric != null && metricNote != null ? (
            <span className="text-neutral/45"> · </span>
          ) : null}
          {metricNote != null ? <span>{metricNote}</span> : null}
        </p>
      ) : null}
      {action ? <div className="pt-0.5">{action}</div> : null}
    </div>
  );
}

function GrainToggle({
  grain,
  onChange,
}: {
  grain: FilingGrain;
  onChange: (g: FilingGrain) => void;
}) {
  return (
    <div className={headerToggleRowClass}>
      <span className={headerToggleLabelClass}>Group</span>
      <div className={headerToggleGroupClass} role="group" aria-label="Time grain">
        {GRAIN_OPTIONS.map((o) => (
          <button
            key={o.value}
            type="button"
            className={headerToggleBtnClass(grain === o.value)}
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
  split: FilingSplit;
  onChange: (s: FilingSplit) => void;
}) {
  return (
    <div className={headerToggleRowClass}>
      <span className={headerToggleLabelClass}>Split</span>
      <div className={headerToggleGroupClass} role="group" aria-label="Split series">
        {SPLIT_OPTIONS.map((o) => (
          <button
            key={o.value}
            type="button"
            className={headerToggleBtnClass(split === o.value)}
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

function I526CategoryPicker({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  function select(next: string) {
    onChange(toggleTeaFilter(value, next));
  }
  return (
    <div className="space-y-2" role="group" aria-label="Category">
      <span className="block text-xs font-semibold text-neutral/80">
        Category
        {value.length > 1 ? (
          <span className="ml-1.5 font-normal text-neutral/55">({value.length} selected)</span>
        ) : null}
      </span>
      <div className="flex flex-wrap gap-1.5">
        {TEA_FILTER_OPTIONS.map((o) => {
          const active = value.includes(o.value);
          return (
            <button
              key={o.value}
              type="button"
              className={filterChipClass(active)}
              aria-pressed={active}
              onClick={() => select(o.value)}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function I526CountryPicker({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const allSelected = value.length === 1 && value[0] === 'ALL_COUNTRIES';
  function toggle(country: string) {
    onChange(toggleCountryFilter(value, country));
  }
  return (
    <div className="space-y-2" role="group" aria-label="Country of chargeability">
      <span className="block text-xs font-semibold text-neutral/80">
        Country of chargeability
        {!allSelected && value.length > 1 ? (
          <span className="ml-1.5 font-normal text-neutral/55">({value.length} selected)</span>
        ) : null}
      </span>
      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          className={filterChipClass(allSelected)}
          aria-pressed={allSelected}
          onClick={() => onChange(['ALL_COUNTRIES'])}
        >
          All
        </button>
        {COUNTRY_FILTER_OPTIONS.filter((o) => o.value !== 'ALL_COUNTRIES').map((o) => {
          const active = value.includes(o.value);
          return (
            <button
              key={o.value}
              type="button"
              className={filterChipClass(active)}
              aria-pressed={active}
              onClick={() => toggle(o.value)}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const PROCESSING_METRIC_KEYS: ProcessingMetricKey[] = [
  'q_receipts',
  'q_approvals',
  'q_denials',
  'q_completions',
  'pending',
  'median_processing_months',
];

export interface I526ExplorerProps {
  initialView?: ViewId;
  initialSharePayload?: I526SharePayload | null;
  initialReleases?: I526Release[];
  initialLatestAIds?: number[];
  initialLatestBIds?: number[];
  initialFilingCells?: I526FilingCell[] | null;
  initialProcessingRows?: I526ProcessingRow[] | null;
  initialError?: string | null;
}

export default function I526Explorer({
  initialView = 'trend',
  initialSharePayload = null,
  initialReleases = [],
  initialLatestAIds = [],
  initialLatestBIds = [],
  initialFilingCells = null,
  initialProcessingRows = null,
  initialError = null,
}: I526ExplorerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const available = isI526DataAvailable();
  const [releases, setReleases] = useState<I526Release[]>(initialReleases);
  const [loadError, setLoadError] = useState<string | null>(initialError);

  const view = initialView;

  const allAReleaseIds = useMemo(
    () =>
      initialReleases
        .filter((r) => r.dataset === 'FILINGS_COUNTRY_TEA')
        .map((r) => r.id),
    [initialReleases],
  );
  const allBReleaseIds = useMemo(
    () =>
      initialReleases
        .filter((r) => r.dataset === 'ALL_FORMS_SUMMARY')
        .map((r) => r.id),
    [initialReleases],
  );

  // Server passes the URL-derived prefs as initialSharePayload, so both SSR and
  // the first client render use the same values (no window read during render).
  const initialPrefs = initialSharePayload;

  // Trend / filings state
  const [trendAReleaseIds, setTrendAReleaseIds] = useState<number[]>(
    initialPrefs?.trendReleaseIds && initialPrefs.trendReleaseIds.length > 0
      ? initialPrefs.trendReleaseIds
      : initialLatestAIds.length > 0
        ? initialLatestAIds
        : allAReleaseIds,
  );
  const [formA, setFormA] = useState<string[]>(
    initialPrefs?.formA && initialPrefs.formA.length > 0 ? initialPrefs.formA : [...DEFAULT_FORM_A],
  );
  const [teas, setTeas] = useState<string[]>(
    initialPrefs?.teas && initialPrefs.teas.length > 0 ? initialPrefs.teas : [...DEFAULT_TEA],
  );
  const [countries, setCountries] = useState<string[]>(
    initialPrefs?.countries && initialPrefs.countries.length > 0
      ? initialPrefs.countries
      : [...DEFAULT_COUNTRIES],
  );
  const [grain, setGrain] = useState<FilingGrain>(initialPrefs?.grain ?? 'month');
  const [split, setSplit] = useState<FilingSplit>(initialPrefs?.split ?? 'form_type');
  const [showCumulative, setShowCumulative] = useState<boolean>(
    initialPrefs?.showCumulative ?? false,
  );
  const [trendCells, setTrendCells] = useState<I526FilingCell[] | null>(initialFilingCells);
  const [showHowToRead, setShowHowToRead] = useState(false);

  // Throughput state
  const [throughputBIds, setThroughputBIds] = useState<number[]>(
    initialPrefs?.throughputBIds && initialPrefs.throughputBIds.length > 0
      ? initialPrefs.throughputBIds
      : initialLatestBIds.length > 0
        ? initialLatestBIds
        : allBReleaseIds,
  );
  const [formB, setFormB] = useState<string[]>(
    initialPrefs?.formB && initialPrefs.formB.length > 0
      ? initialPrefs.formB
      : ['KEY_PETITIONS'],
  );
  const [throughputRows, setThroughputRows] = useState<I526ProcessingRow[] | null>(
    initialProcessingRows,
  );
  const [throughputMetric, setThroughputMetric] =
    useState<ProcessingMetricKey>(initialPrefs?.throughputMetric ?? 'q_completions');

  const [loading, setLoading] = useState(false);

  function currentSharePayload(): I526SharePayload {
    return makeSharePayload({
      view,
      teas: [...teas],
      countries: [...countries] as FilingCountry[],
      formA: [...formA],
      grain,
      split,
      showCumulative,
      trendReleaseIds: [...trendAReleaseIds],
      formB: [...formB],
      throughputBIds: [...throughputBIds],
      throughputMetric,
    });
  }

  const shareKey = useMemo(
    () => sharePayloadToSearchParams(currentSharePayload()).toString(),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fingerprint for share pre-mint
    [
      view,
      teas.join('|'),
      countries.join('|'),
      formA.join('|'),
      grain,
      split,
      showCumulative,
      trendAReleaseIds.join(','),
      formB.join('|'),
      throughputBIds.join(','),
      throughputMetric,
    ],
  );

  // Sync address bar with current filter selection (long URL; share still mints short ids).
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!pathname || pathname.startsWith('/analysis/i526/s/')) return;
    const payload = currentSharePayload();
    const qs = sharePayloadToSearchParams(payload).toString();
    const next = qs ? `${pathname}?${qs}` : pathname;
    const current = `${window.location.pathname}${window.location.search}`;
    if (next !== current) {
      router.replace(next, { scroll: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shareKey, pathname, router]);

  const latestARelease = useMemo(() => {
    const as = releases.filter((r) => r.dataset === 'FILINGS_COUNTRY_TEA');
    return as.length > 0 ? as[as.length - 1] : null;
  }, [releases]);
  const latestBRelease = useMemo(() => {
    const bs = releases.filter((r) => r.dataset === 'ALL_FORMS_SUMMARY');
    return bs.length > 0 ? bs[bs.length - 1] : null;
  }, [releases]);
  const latestFilingPeriodLabel = useMemo(() => {
    if (!latestARelease) return null;
    return {
      quarter: calendarQuarterLabelForAsOf(latestARelease.as_of_quarter),
      periodEndLong:
        latestARelease.period_end &&
        new Date(`${latestARelease.period_end}T00:00:00Z`).toLocaleDateString('en-US', {
          month: 'long',
          year: 'numeric',
          timeZone: 'UTC',
        }),
    };
  }, [latestARelease]);
  const latestBPeriodLabel = useMemo(() => {
    if (!latestBRelease) return null;
    return calendarQuarterLabelForAsOf(latestBRelease.as_of_quarter);
  }, [latestBRelease]);

  useEffect(() => {
    if (!available) return;
    if (initialReleases.length > 0) return;
    fetchI526Releases()
      .then((rs) => {
        setReleases(rs);
        const a = rs.filter((r) => r.dataset === 'FILINGS_COUNTRY_TEA');
        const b = rs.filter((r) => r.dataset === 'ALL_FORMS_SUMMARY');
        setTrendAReleaseIds(a.map((r) => r.id));
        setThroughputBIds(b.map((r) => r.id));
      })
      .catch((e: Error) => setLoadError(e.message));
  }, [available, initialReleases.length]);

  useEffect(() => {
    if (!available) return;
    if (trendAReleaseIds.length === 0) return;
    const formMembers = resolveFilterMembers(FORM_FILTERS_A, formA) as FilingFormType[];
    const teaMembers = resolveFilterMembers(TEA_FILTER_OPTIONS, teas) as TeaCategory[];
    const countryMembers = resolveFilterMembers(COUNTRY_FILTER_OPTIONS, countries) as FilingCountry[];
    const sameAsSsr =
      initialFilingCells != null &&
      initialLatestAIds.length === trendAReleaseIds.length &&
      initialLatestAIds.every((id, i) => id === trendAReleaseIds[i]) &&
      JSON.stringify(formA) === JSON.stringify(DEFAULT_FORM_A) &&
      JSON.stringify(teas) === JSON.stringify(DEFAULT_TEA) &&
      JSON.stringify(countries) === JSON.stringify(DEFAULT_COUNTRIES);
    if (sameAsSsr) return;
    setLoading(true);
    fetchI526FilingCells({
      releaseIds: trendAReleaseIds,
      formTypes: formMembers,
      teas: teaMembers,
      countries: countryMembers,
    })
      .then((cells) => setTrendCells(cells))
      .catch((e: Error) => setLoadError(e.message))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [available, trendAReleaseIds.join(','), formA.join('|'), teas.join('|'), countries.join('|')]);

  useEffect(() => {
    if (!available) return;
    if (throughputBIds.length === 0) return;
    const formMembers = resolveFilterMembers(FORM_FILTERS_B, formB) as ProcessingFormType[];
    setLoading(true);
    fetchI526Processing({
      releaseIds: throughputBIds,
      formTypes: formMembers,
    })
      .then((rows) => setThroughputRows(rows))
      .catch((e: Error) => setLoadError(e.message))
      .finally(() => setLoading(false));
  }, [available, throughputBIds.join(','), formB.join('|')]);

  const bReleases = useMemo(
    () => releases.filter((r) => r.dataset === 'ALL_FORMS_SUMMARY'),
    [releases],
  );

  // Trend totals
  const trendTotals = useMemo(() => {
    if (!trendCells) return null;
    const byQuarter = aggregateFilingTimeSeries(trendCells, 'quarter').sort(
      (a, b) => a.meta.sortKey.localeCompare(b.meta.sortKey),
    );
    const byFy = aggregateFilingTimeSeries(trendCells, 'fiscal_year');
    const totalBucket = sumBuckets(byFy.map((p) => p.bucket));
    const totalAgg = totalWithSuppressedNote(totalBucket);
    const latest = byQuarter[byQuarter.length - 1];
    const prev = byQuarter[byQuarter.length - 2];
    const deltaCount = latest && prev ? latest.bucket.count - prev.bucket.count : null;
    const totalSuppressedCells = trendCells.filter((c) => c.suppressed).length;
    return {
      total: totalAgg.count,
      totalSuppressed: totalAgg.suppressedCells,
      totalNote: totalAgg.note,
      latestCount: latest?.bucket.count ?? 0,
      latestLabel: latest ? latest.meta.label : '--',
      latestSuppressed: latest?.bucket.suppressedCells ?? 0,
      deltaCount,
      deltaLabel: deltaCount == null ? '--' : formatSignedCount(deltaCount),
      deltaSuppressedNote:
        latest && prev && latest.bucket.suppressedCells + prev.bucket.suppressedCells > 0
          ? `${nf.format(latest.bucket.suppressedCells + prev.bucket.suppressedCells)} suppressed cell${latest.bucket.suppressedCells + prev.bucket.suppressedCells === 1 ? '' : 's'}`
          : undefined,
      totalSuppressedCells,
    };
  }, [trendCells]);

  // Main chart data
  const mainChartData = useMemo(() => {
    if (!trendCells) return null;
    if (split === 'none') {
      const series = aggregateFilingTimeSeries(trendCells, grain);
      return {
        kind: 'single' as const,
        points: series.map((s) => ({
          key: s.meta.key,
          label: s.meta.label,
          shortLabel: s.meta.shortLabel,
          value: s.bucket.count,
          valueLabel: bucketLabel(s.bucket),
        })),
        suppressedCells: series.reduce((a, s) => a + s.bucket.suppressedCells, 0),
      };
    }
    const result = aggregateSplitFilingTimeSeries(trendCells, grain, split);
    const xAxis = result.xAxis.map((m) => ({
      key: m.key,
      label: m.label,
      shortLabel: m.shortLabel,
    }));
    const series = result.series.map((s, idx) => ({
      key: s.key,
      label: s.label,
      color: seriesColor(idx),
      data: s.points.map((p) => ({ key: p.key, value: p.value })),
    }));
    const suppressedCells = result.series.reduce(
      (n, s) => n + s.points.reduce((a, p) => a + p.suppressedCells, 0),
      0,
    );
    return {
      kind: 'split' as const,
      xAxis,
      series,
      suppressedCells,
    };
  }, [trendCells, grain, split]);

  // Throughput data
  const throughputChartData = useMemo(() => {
    if (!throughputRows) return null;
    const rows = throughputRows;
    const sortedReleases = Array.from(new Set(rows.map((r) => r.release_id)))
      .map((id) => bReleases.find((r) => r.id === id))
      .filter((r): r is I526Release => !!r)
      .sort((a, b) => a.period_start.localeCompare(b.period_start));
    const sortedIds = sortedReleases.map((r) => r.id);
    const formMembers = resolveFilterMembers(FORM_FILTERS_B, formB) as ProcessingFormType[];

    const toPoint = (rid: number, v: number | null) => {
      const r = sortedReleases.find((x) => x.id === rid)!;
      const ql = quarterLabelForAsOf(r.as_of_quarter);
      const pq = parseAsOfQuarter(r.as_of_quarter);
      const value = v ?? 0;
      return {
        key: r.as_of_quarter,
        label: ql?.fyLabel ? `${ql.fyLabel} ${ql.monthsLabel}` : r.as_of_quarter,
        shortLabel: pq ? `FY${pq.fiscalYear}Q${pq.quarter}` : r.as_of_quarter,
        value,
      };
    };

    const metricSeries = sortedIds.map((rid) =>
      toPoint(
        rid,
        sumMetricAcrossForms(
          rows.filter((r) => r.release_id === rid),
          formMembers,
          throughputMetric,
        ),
      ),
    );
    const pendingSeries = sortedIds.map((rid) =>
      toPoint(
        rid,
        sumMetricAcrossForms(
          rows.filter((r) => r.release_id === rid),
          formMembers,
          'pending',
        ),
      ),
    );

    const latestBId = sortedIds[sortedIds.length - 1] ?? null;
    const latestForms = latestBId != null
      ? formMembers.map((form) => {
          const row = processingRowForForm(
            rows.filter((r) => r.release_id === latestBId),
            form,
          );
          return {
            form,
            approvals: row?.q_approvals ?? 0,
            denials: row?.q_denials ?? 0,
          };
        })
      : [];

    return {
      metricLabel: PROCESSING_METRIC_LABELS[throughputMetric],
      metricSeries,
      pendingSeries,
      latestForms,
      latestRelease: latestBId
        ? sortedReleases.find((r) => r.id === latestBId) ?? null
        : null,
      suppressedCells: rows.reduce((n, r) => n + (r.suppressed_q ? 1 : 0), 0),
    };
  }, [throughputRows, throughputMetric, bReleases, formB]);

  if (!available) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="rounded-xl border-2 border-base-300 bg-base-100 p-6 space-y-3">
          <h2 className="text-sm font-bold text-primary">I-526 data is coming soon</h2>
          <p className="text-sm text-neutral/80">
            The I-526 explorer charts will be available once our database connection is configured.
            The source CSVs are already downloadable in the{' '}
            <Link href="/analysis/i526/data" className="font-semibold text-secondary underline">
              Source data
            </Link>{' '}
            tab.
          </p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="rounded-xl border-2 border-error/40 bg-error/10 p-6 space-y-2">
          <h2 className="text-sm font-bold text-error">Could not load I-526 data</h2>
          <p className="text-sm text-error/90">{loadError}</p>
        </div>
      </div>
    );
  }

  const Wrapper = ({ children }: { children: ReactNode }) => (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">{children}</div>
  );

  const trendFilterRow = (
    <div className="p-3 sm:p-4 space-y-4">
      <div className="space-y-2" role="group" aria-label="Form">
        <span className="block text-xs font-semibold text-neutral/80">
          Form
          {formA.length > 1 ? (
            <span className="ml-1.5 font-normal text-neutral/55">({formA.length} selected)</span>
          ) : null}
        </span>
        <div className="flex flex-wrap gap-1.5">
          {FORM_FILTERS_A.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={filterChipClass(formA.includes(opt.value))}
              onClick={() => setFormA(toggleFormAFilter(formA, opt.value))}
              aria-pressed={formA.includes(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
      <I526CategoryPicker value={teas} onChange={setTeas} />
      <I526CountryPicker value={countries} onChange={setCountries} />
    </div>
  );

  function TrendView() {
    return (
      <Wrapper>
        <div className="rounded-xl border-2 border-base-300 bg-base-100 p-4 sm:p-5 shadow-sm space-y-4 overflow-x-hidden">
          {trendFilterRow}
        </div>

        <div className="rounded-xl border-2 border-base-300 bg-base-100 p-4 sm:p-5 shadow-sm space-y-4 overflow-x-hidden">
          <div className="space-y-4">
            <ChartHeader>
              <div className={chartHeaderRowClass}>
                <div className="flex flex-1 flex-col gap-2 items-start">
                  <div className="min-w-0 w-full space-y-1">
                    <h2 className="text-sm font-semibold leading-snug text-primary sm:text-base">
                      I-526 / I-526E filings over receipt period
                      {loading && !mainChartData ? (
                        <span className="ml-2 text-xs font-normal text-neutral/40">Updating…</span>
                      ) : null}
                    </h2>
                    {trendTotals || latestFilingPeriodLabel ? (
                      <p className="text-sm leading-snug text-neutral/70">
                        {trendTotals ? (
                          <span className="font-semibold tabular-nums text-primary">
                            {bucketLabel({ count: trendTotals.total, suppressedCells: trendTotals.totalSuppressed })}{' '}
                            filings
                          </span>
                        ) : null}
                        {trendTotals && latestFilingPeriodLabel ? ' · ' : null}
                        {latestFilingPeriodLabel ? (
                          <span>
                            Receipts per USCIS filings report · Data through{' '}
                            {latestFilingPeriodLabel.quarter}
                          </span>
                        ) : (
                          <span>Receipts per USCIS filings report</span>
                        )}
                      </p>
                    ) : null}
                  </div>
                  <I526ShareButton buildPayload={currentSharePayload} shareKey={shareKey} />
                </div>
                <ChartHeaderControls>
                  <GrainToggle grain={grain} onChange={setGrain} />
                  <SplitToggle split={split} onChange={setSplit} />
                  <div className={headerToggleRowClass}>
                    <div className={headerToggleGroupClass} role="group" aria-label="Accumulation">
                      <button
                        type="button"
                        className={headerToggleBtnClass(!showCumulative)}
                        aria-pressed={!showCumulative}
                        onClick={() => setShowCumulative(false)}
                      >
                        Periodic
                      </button>
                      <button
                        type="button"
                        className={headerToggleBtnClass(showCumulative)}
                        aria-pressed={showCumulative}
                        onClick={() => setShowCumulative(true)}
                      >
                        Cumulative
                      </button>
                    </div>
                  </div>
                </ChartHeaderControls>
              </div>
            </ChartHeader>

            <div className="pt-2">
              {mainChartData?.kind === 'single' ? (
                <BarChart
                  data={(function applyCumulative(points) {
                    if (!showCumulative) return points;
                    let running = 0;
                    return points.map((p) => {
                      running += Number(p.value ?? 0);
                      return {
                        ...p,
                        value: running,
                        valueLabel: nf.format(running),
                      };
                    });
                  })(mainChartData.points)}
                  height={280}
                  xAxisLabel="Receipt period"
                  ariaLabel="I-526 filings over receipt period"
                  showTick={(() => {
                    const n = mainChartData.points.length;
                    const step = Math.max(1, Math.ceil(n / 12));
                    return (_d: unknown, i: number) => i % step === 0 || i === n - 1;
                  })()}
                />
              ) : mainChartData?.kind === 'split' && mainChartData.xAxis.length > 0 ? (
                <MultiSeriesLineChart
                  xAxis={mainChartData.xAxis}
                  series={(function applyCumulativeSeries(series) {
                    if (!showCumulative) return series;
                    return series.map((s) => {
                      let running = 0;
                      return {
                        ...s,
                        data: (s as { data: Array<{ key: string; value: number | null }> }).data.map((p) => {
                          running += Number(p.value ?? 0);
                          return {
                            ...p,
                            value: running,
                          };
                        }),
                      };
                    });
                  })(mainChartData.series)}
                  height={280}
                  xAxisLabel="Receipt period"
                  ariaLabel={`I-526 filings split by ${SPLIT_OPTIONS.find((o) => o.value === split)?.label ?? 'facet'}`}
                  showTick={(() => {
                    const n = mainChartData.xAxis.length;
                    const step = Math.max(1, Math.ceil(n / 12));
                    return (_d: unknown, i: number) => i % step === 0 || i === n - 1;
                  })()}
                />
              ) : (
                <div className="h-72 flex items-center justify-center text-sm text-neutral/50">
                  {loading ? 'Loading…' : 'No filings match this selection.'}
                </div>
              )}
            </div>

            <ChartFooter
              cells={mainChartData?.suppressedCells ?? 0}
              onToggleHowToRead={() => setShowHowToRead((v) => !v)}
              howToReadOpen={showHowToRead}
            />
          </div>
        </div>
      </Wrapper>
    );
  }

  function ThroughputView() {
    return (
      <Wrapper>
        <div className="rounded-xl border-2 border-base-300 bg-base-100 p-4 sm:p-5 shadow-sm space-y-4 overflow-x-hidden">
          <div className="space-y-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral/55 mb-2">
                EB-5 family forms (Throughput &amp; processing)
              </p>
              <div className="flex flex-wrap gap-2">
                {FORM_FILTERS_B.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    className={filterChipClass(formB.includes(opt.value))}
                    onClick={() => setFormB(toggleFormBFilter(formB, opt.value))}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border-2 border-base-300 bg-base-100 p-4 sm:p-5 shadow-sm space-y-4 overflow-x-hidden">
          <div className="space-y-4">
            <ChartHeader>
              <div className={chartHeaderRowClass}>
                <div className="flex flex-1 flex-col gap-2 items-start">
                  <div className="min-w-0 w-full space-y-1">
                    <h2 className="text-sm font-semibold leading-snug text-primary sm:text-base">
                      Pending petitions at quarter-end
                      {loading && !throughputChartData ? (
                        <span className="ml-2 text-xs font-normal text-neutral/40">Updating…</span>
                      ) : null}
                    </h2>
                    {(throughputChartData?.pendingSeries &&
                      throughputChartData.pendingSeries.length > 0) ||
                    latestBPeriodLabel ? (
                      <p className="text-sm leading-snug text-neutral/70">
                        {throughputChartData?.pendingSeries &&
                        throughputChartData.pendingSeries.length > 0 ? (
                          <span className="font-semibold tabular-nums text-primary">
                            {nf.format(
                              throughputChartData.pendingSeries[
                                throughputChartData.pendingSeries.length - 1
                              ]!.value,
                            )}
                          </span>
                        ) : null}
                        {(throughputChartData?.pendingSeries &&
                          throughputChartData.pendingSeries.length > 0) &&
                        latestBPeriodLabel ? ' · ' : null}
                        {latestBPeriodLabel ? (
                          <span>
                            Sum of pending inventory across the selected forms · Data through{' '}
                            {latestBPeriodLabel}
                          </span>
                        ) : (
                          <span>Sum of pending inventory across the selected forms</span>
                        )}
                      </p>
                    ) : null}
                  </div>
                  <I526ShareButton buildPayload={currentSharePayload} shareKey={shareKey} />
                </div>
              </div>
            </ChartHeader>

            <div className="pt-2">
              {throughputChartData && throughputChartData.pendingSeries.length > 0 ? (
                <LineChart
                  data={throughputChartData.pendingSeries}
                  height={240}
                  xAxisLabel="Quarter"
                  ariaLabel="Pending EB-5 petitions"
                />
              ) : (
                <div className="h-60 flex items-center justify-center text-sm text-neutral/50">
                  {loading ? 'Loading…' : 'No throughput data for this selection.'}
                </div>
              )}
            </div>
            <ChartFooter
              cells={throughputChartData?.suppressedCells ?? 0}
              onToggleHowToRead={() => setShowHowToRead((v) => !v)}
              howToReadOpen={showHowToRead}
            />
          </div>

          <div className="space-y-4">
            <ChartHeader>
              <div className={chartHeaderRowClass}>
                <ChartTitleBlock
                  title={`${throughputChartData?.metricLabel ?? 'Throughput'} per quarter`}
                  metricNote={
                    latestBPeriodLabel
                      ? `Sum across the selected EB-5 family forms · Data through ${latestBPeriodLabel}`
                      : 'Sum across the selected EB-5 family forms'
                  }
                  loading={loading && !throughputChartData}
                />
                <ChartHeaderControls>
                  <div className={headerToggleRowClass}>
                    <span className={headerToggleLabelClass}>Metric</span>
                    <div
                      className={headerToggleGroupClass}
                      role="group"
                      aria-label="Throughput metric"
                    >
                      {PROCESSING_METRIC_KEYS.map((k) => (
                        <button
                          key={k}
                          type="button"
                          className={headerToggleBtnClass(throughputMetric === k)}
                          aria-pressed={throughputMetric === k}
                          onClick={() => setThroughputMetric(k)}
                        >
                          {PROCESSING_METRIC_LABELS[k]}
                        </button>
                      ))}
                    </div>
                  </div>
                </ChartHeaderControls>
              </div>
            </ChartHeader>

            <div className="pt-2">
              {throughputChartData && throughputChartData.metricSeries.length > 0 ? (
                <BarChart
                  data={throughputChartData.metricSeries}
                  height={240}
                  xAxisLabel={throughputMetric === 'median_processing_months' ? 'Median months' : 'Petitions'}
                  ariaLabel={`${throughputChartData.metricLabel} per quarter`}
                />
              ) : (
                <div className="h-60 flex items-center justify-center text-sm text-neutral/50">
                  {loading ? 'Loading…' : 'No data for this selection.'}
                </div>
              )}
            </div>
            <ChartFooter cells={throughputChartData?.suppressedCells ?? 0} />
          </div>

          <div className="space-y-4">
            <ChartHeader>
              <div className={chartHeaderRowClass}>
                <ChartTitleBlock
                  title="Approvals vs denials -- latest quarter"
                  metricNote={
                    throughputChartData?.latestRelease
                      ? (() => {
                          const ql = quarterLabelForAsOf(throughputChartData.latestRelease.as_of_quarter);
                          return ql?.fyLabel ? `${ql.fyLabel} ${ql.monthsLabel}` : undefined;
                        })()
                      : undefined
                  }
                  loading={loading && !throughputChartData}
                />
              </div>
            </ChartHeader>

            <div className="pt-2">
              {throughputChartData && throughputChartData.latestForms.length > 0 ? (
                <BarChart
                  data={throughputChartData.latestForms.flatMap((row) => [
                    {
                      key: `${row.form}-approvals`,
                      label: `${PROCESSING_FORM_LABELS[row.form] ?? row.form} -- Approvals`,
                      shortLabel: PROCESSING_FORM_LABELS[row.form] ?? row.form,
                      value: row.approvals,
                      valueLabel: nf.format(row.approvals),
                    },
                    {
                      key: `${row.form}-denials`,
                      label: `${PROCESSING_FORM_LABELS[row.form] ?? row.form} -- Denials`,
                      shortLabel: PROCESSING_FORM_LABELS[row.form] ?? row.form,
                      value: row.denials,
                      valueLabel: nf.format(row.denials),
                    },
                  ])}
                  height={Math.max(220, throughputChartData.latestForms.length * 88 + 80)}
                  xAxisLabel="Petitions"
                  ariaLabel="Approvals vs denials per form -- latest quarter"
                />
              ) : (
                <div className="h-60 flex items-center justify-center text-sm text-neutral/50">
                  {loading ? 'Loading…' : 'No forms selected.'}
                </div>
              )}
            </div>
            <ChartFooter cells={throughputChartData?.suppressedCells ?? 0} />
          </div>
        </div>
      </Wrapper>
    );
  }

  return (
    <>
      {view === 'trend' && <TrendView />}
      {view === 'throughput' && <ThroughputView />}
      {showHowToRead ? <HowToReadCard /> : null}
    </>
  );
}


import type { Metadata } from 'next';
import Link from 'next/link';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import PageHero from '@/components/PageHero';
import { USCIS_DATA_PAGE_URL } from '@/lib/analysis/i485';
import { I485_DEFAULT_PATH } from '@/lib/analysis/i485Routes';
import { I526_DEFAULT_PATH } from '@/lib/analysis/i526Routes';
import {
  I526_PROCESSING_SUMMARY_CSV_PATH,
  I526_QUARTERLY_CSV_PATH,
  USCIS_DATA_LIBRARY_URL,
  calendarQuarterLabelForAsOf,
} from '@/lib/analysis/i526';

export const metadata: Metadata = {
  title: 'USCIS source data for EB-5 & I-485 | EB5 Base',
  description:
    'Plain-English guide to every USCIS data publication used on EB5 Base — I-485 pending inventory, I-526 filings, and All Forms throughput. Links to consolidated CSVs and the original XLSX files on uscis.gov.',
  alternates: { canonical: 'https://eb5base.com/analysis/data' },
};

// ---------------------------------------------------------------------------
// I-485 manifest + helpers
// ---------------------------------------------------------------------------
interface I485ManifestFile {
  file: string;
  as_of_date: string;
  published_date: string | null;
  source_url: string;
  source_title: string;
}
interface I485Manifest {
  source_page: string;
  notes: string;
  files: I485ManifestFile[];
}
type I485WorkbookEntry =
  | { kind: 'published'; year: string; ym: string; file: I485ManifestFile }
  | { kind: 'missing'; year: string; ym: string; monthLabel: string };

function loadI485Manifest(): I485Manifest {
  const p = path.join(process.cwd(), 'data', 'uscis-i485', 'manifest.json');
  return JSON.parse(readFileSync(p, 'utf8')) as I485Manifest;
}
function buildWorkbookTimelineI485(files: I485ManifestFile[]): I485WorkbookEntry[] {
  if (files.length === 0) return [];
  const byYm = new Map<string, I485ManifestFile>();
  for (const f of files) {
    const ym = f.as_of_date.slice(0, 7);
    const existing = byYm.get(ym);
    if (!existing || f.as_of_date > existing.as_of_date) byYm.set(ym, f);
  }
  const sorted = [...files].sort((a, b) => a.as_of_date.localeCompare(b.as_of_date));
  const firstYm = sorted[0]!.as_of_date.slice(0, 7);
  const lastYm = sorted[sorted.length - 1]!.as_of_date.slice(0, 7);
  let [y, m] = firstYm.split('-').map(Number) as [number, number];
  const [endY, endM] = lastYm.split('-').map(Number) as [number, number];
  const entries: I485WorkbookEntry[] = [];
  while (y < endY || (y === endY && m <= endM)) {
    const ym = `${y}-${String(m).padStart(2, '0')}`;
    const year = String(y);
    const file = byYm.get(ym);
    if (file) {
      entries.push({ kind: 'published', year, ym, file });
    } else {
      const monthLabel = new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString('en-US', {
        month: 'short',
        timeZone: 'UTC',
      });
      entries.push({ kind: 'missing', year, ym, monthLabel });
    }
    m += 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
  }
  return entries;
}
function formatAsOfShortDayI485(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
}
function formatAsOfLongI485(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}
function formatMdY(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${m}/${d}/${y}`;
}

// ---------------------------------------------------------------------------
// I-526 manifest + helpers
// ---------------------------------------------------------------------------
type I526ManifestDataset = 'FILINGS_COUNTRY_TEA' | 'ALL_FORMS_SUMMARY';
interface I526ManifestFile {
  dataset: I526ManifestDataset;
  file: string | null;
  as_of_quarter: string;
  period_start: string;
  period_end: string;
  published_date: string | null;
  source_url: string;
  source_title: string;
  source_note?: string | null;
}
interface I526Manifest {
  source_page: string;
  notes: string;
  files: I526ManifestFile[];
}
type I526QTile =
  | {
      kind: 'published';
      fiscalYear: number;
      quarter: number;
      calendarYear: number;
      calendarQuarter: 1 | 2 | 3 | 4;
      a: I526ManifestFile | undefined;
      b: I526ManifestFile | undefined;
      publishedDate: string | null;
    }
  | {
      kind: 'missing';
      fiscalYear: number;
      quarter: number;
      calendarYear: number;
      calendarQuarter: 1 | 2 | 3 | 4;
    };

function loadI526Manifest(): I526Manifest {
  const p = path.join(process.cwd(), 'data', 'uscis-i526', 'manifest.json');
  return JSON.parse(readFileSync(p, 'utf8')) as I526Manifest;
}
function parseQuarter(q: string) {
  const m = /^FY(\d{4})Q(\d)$/.exec(q);
  if (!m) return null;
  return { fiscalYear: Number(m[1]), quarter: Number(m[2]) };
}
function longDateI526(iso: string) {
  const d = new Date(`${iso}T00:00:00Z`);
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}
function fyQuarterToCalendar(
  fiscalYear: number,
  quarter: number,
): { calendarYear: number; calendarQuarter: 1 | 2 | 3 | 4 } {
  switch (quarter) {
    case 1:
      return { calendarYear: fiscalYear - 1, calendarQuarter: 4 };
    case 2:
      return { calendarYear: fiscalYear, calendarQuarter: 1 };
    case 3:
      return { calendarYear: fiscalYear, calendarQuarter: 2 };
    case 4:
      return { calendarYear: fiscalYear, calendarQuarter: 3 };
    default:
      return { calendarYear: fiscalYear, calendarQuarter: 1 };
  }
}
function buildQuarterTimelineI526(files: I526ManifestFile[]): I526QTile[] {
  if (files.length === 0) return [];
  const keyed = new Map<string, { a?: I526ManifestFile; b?: I526ManifestFile }>();
  for (const f of files) {
    const k = f.as_of_quarter;
    const entry = keyed.get(k) ?? {};
    if (f.dataset === 'FILINGS_COUNTRY_TEA') entry.a = f;
    else entry.b = f;
    keyed.set(k, entry);
  }
  const sorted = Array.from(new Set(files.map((f) => f.as_of_quarter))).sort();
  const first = parseQuarter(sorted[0]!)!;
  const last = parseQuarter(sorted[sorted.length - 1]!)!;
  const firstCal = fyQuarterToCalendar(first.fiscalYear, first.quarter);
  const lastCal = fyQuarterToCalendar(last.fiscalYear, last.quarter);
  let calendarYear = firstCal.calendarYear;
  let cq: 1 | 2 | 3 | 4 = 1;
  const tiles: I526QTile[] = [];
  while (
    calendarYear < lastCal.calendarYear ||
    (calendarYear === lastCal.calendarYear && cq <= lastCal.calendarQuarter) ||
    (calendarYear === lastCal.calendarYear && cq <= 4)
  ) {
    let fy: number;
    let fq: number;
    if (cq === 4) {
      fy = calendarYear + 1;
      fq = 1;
    } else {
      fy = calendarYear;
      fq = cq + 1;
    }
    const key = `FY${fy}Q${fq}`;
    const pair = keyed.get(key);
    const aDate = pair?.a?.published_date ?? pair?.b?.published_date ?? null;
    if (pair?.a || pair?.b) {
      tiles.push({
        kind: 'published',
        fiscalYear: fy,
        quarter: fq,
        calendarYear,
        calendarQuarter: cq,
        a: pair?.a,
        b: pair?.b,
        publishedDate: aDate,
      });
    } else {
      tiles.push({ kind: 'missing', fiscalYear: fy, quarter: fq, calendarYear, calendarQuarter: cq });
    }
    if (cq === 4) {
      cq = 1;
      calendarYear++;
    } else {
      cq = (cq + 1) as 1 | 2 | 3 | 4;
    }
  }
  while (tiles.length > 0 && tiles.length % 4 !== 0) {
    const last = tiles[tiles.length - 1]!;
    let nextY = last.calendarYear;
    let nextQ = (last.calendarQuarter + 1) as 1 | 2 | 3 | 4;
    if (last.calendarQuarter === 4) {
      nextY++;
      nextQ = 1;
    }
    let fy: number;
    let fq: number;
    if (nextQ === 4) {
      fy = nextY + 1;
      fq = 1;
    } else {
      fy = nextY;
      fq = nextQ + 1;
    }
    tiles.push({ kind: 'missing', fiscalYear: fy, quarter: fq, calendarYear: nextY, calendarQuarter: nextQ });
  }
  return tiles;
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export default function CombinedSourceDataPage() {
  // --- I-485 data load
  const i485Manifest = loadI485Manifest();
  const i485Files = [...i485Manifest.files].sort((a, b) => (a.as_of_date < b.as_of_date ? 1 : -1));
  const i485Timeline = buildWorkbookTimelineI485(i485Files);
  const i485ByYear = new Map<string, I485WorkbookEntry[]>();
  for (const entry of i485Timeline) {
    const list = i485ByYear.get(entry.year) ?? [];
    list.push(entry);
    i485ByYear.set(entry.year, list);
  }
  for (const list of Array.from(i485ByYear.values())) list.sort((a, b) => (a.ym < b.ym ? 1 : -1));
  const i485YearsDesc = Array.from(i485ByYear.keys()).sort((a, b) => b.localeCompare(a));

  // --- I-526 data load
  const i526Manifest = loadI526Manifest();
  const i526Files = [...i526Manifest.files];
  const i526PublishedKeys = new Set<string>();
  for (const f of i526Files) i526PublishedKeys.add(f.as_of_quarter);
  const i526Timeline = buildQuarterTimelineI526(i526Files);
  const i526ByCalendarYear = new Map<number, I526QTile[]>();
  for (const t of i526Timeline) {
    const list = i526ByCalendarYear.get(t.calendarYear) ?? [];
    list.push(t);
    i526ByCalendarYear.set(t.calendarYear, list);
  }
  const i526CalendarYearsDesc = Array.from(i526ByCalendarYear.keys()).sort((a, b) => b - a);
  const totalA = i526Files.filter((f) => f.dataset === 'FILINGS_COUNTRY_TEA').length;
  const totalB = i526Files.filter((f) => f.dataset === 'ALL_FORMS_SUMMARY').length;
  const quartersCount = i526PublishedKeys.size;
  const latestA = i526Files
    .filter((f) => f.dataset === 'FILINGS_COUNTRY_TEA')
    .sort((a, b) => a.as_of_quarter.localeCompare(b.as_of_quarter))
    .at(-1);
  const latestB = i526Files
    .filter((f) => f.dataset === 'ALL_FORMS_SUMMARY')
    .sort((a, b) => a.as_of_quarter.localeCompare(b.as_of_quarter))
    .at(-1);

  return (
    <div>
      <PageHero
        eyebrow={
          <span>
            <Link href="/analysis" className="hover:underline">
              Analysis
            </Link>{' '}
            / Source data
          </span>
        }
        title="USCIS source data we use"
        subtitle="USCIS publishes data in different formats depending on the form. Below is what each dataset is, what questions it answers, and links to both our consolidated CSVs and the original XLSX files on uscis.gov."
      />

      <section className="max-w-5xl mx-auto px-4 py-10 space-y-12">
        {/* What USCIS publishes */}
        <section className="space-y-4">
          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold text-primary tracking-tight">
              The two families of USCIS data
            </h2>
            <p className="text-base sm:text-lg text-neutral leading-relaxed">
              Everything on EB5 Base comes from public USCIS releases. USCIS publishes data in two
              broad shapes, and they are not interchangeable — each answers a different kind of
              question:
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <article className="rounded-2xl border-2 border-base-300 bg-base-100 p-5 sm:p-6 space-y-3 transition-transform duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md hover:border-accent/40">
              <header className="space-y-1">
                <h3 className="text-sm font-bold uppercase tracking-wider text-secondary">
                  Form-specific detail reports
                </h3>
                <p className="text-sm text-neutral/80 leading-relaxed">
                  USCIS sometimes publishes a dedicated workbook for a single form family —
                  broken out by country, category, region, or priority date depending on the
                  form.
                </p>
              </header>
              <ul className="text-sm text-neutral leading-relaxed space-y-2 list-disc pl-5">
                <li>
                  <span className="font-semibold text-primary">I-485 pending inventory</span>:
                  Monthly employment-based snapshot by preference category, country of
                  chargeability, and priority date year/month. Good for &quot;how long is the
                  queue today?&quot;
                </li>
                <li>
                  <span className="font-semibold text-primary">I-526 / I-526E filings</span>:
                  Quarterly EB-5 receipts disaggregated by country of birth × TEA set-aside
                  category × receipt month. Good for &quot;how many filings came from Vietnam in
                  Q1?&quot;
                </li>
              </ul>
            </article>

            <article className="rounded-2xl border-2 border-base-300 bg-base-100 p-5 sm:p-6 space-y-3 transition-transform duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md hover:border-accent/40">
              <header className="space-y-1">
                <h3 className="text-sm font-bold uppercase tracking-wider text-secondary">
                  All Forms throughput reports
                </h3>
                <p className="text-sm text-neutral/80 leading-relaxed">
                  Once a quarter USCIS publishes one giant workbook with receipts, approvals,
                  denials, completions, pending inventory, and median processing months for every
                  immigration form — including the EB-5 family.
                </p>
              </header>
              <ul className="text-sm text-neutral leading-relaxed space-y-2 list-disc pl-5">
                <li>
                  <span className="font-semibold text-primary">Good for</span>:
                  &quot;How many I-526E petitions did USCIS approve last quarter?&quot; or
                  &quot;What&apos;s the current median processing time for I-829?&quot;
                </li>
                <li>
                  <span className="font-semibold text-primary">Not so good for</span>:
                  country-level or TEA-category-level questions — those numbers only appear in
                  the form-specific detail reports above.
                </li>
              </ul>
            </article>
          </div>

          <div className="rounded-xl border-2 border-base-300 bg-base-100/70 p-4 sm:p-5 text-sm text-neutral leading-relaxed space-y-2">
            <p>
              <span className="font-semibold text-primary">Which one should I use?</span> If you
              care about <em>who is filing</em> (country, TEA category, priority date), start
              with the form-specific report. If you care about <em>what USCIS is doing</em>{' '}
              (approvals, denials, processing times), use the All Forms throughput report. For a
              full picture, use both — that&apos;s how the I-526 explorer is built.
            </p>
          </div>
        </section>

        {/* I-485 section */}
        <section className="space-y-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <header className="space-y-1">
              <h2 className="text-2xl font-bold text-primary tracking-tight">I-485 pending inventory</h2>
              <p className="text-sm text-neutral/80">
                Monthly employment-based adjustment-of-status snapshots, Feb 2024 → today.
              </p>
            </header>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <Link
                href={I485_DEFAULT_PATH}
                className="inline-flex items-center px-3 py-1.5 rounded-lg font-semibold bg-primary text-primary-content hover:bg-primary/90 transition-colors"
              >
                Open the I-485 explorer
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border-2 border-base-300 bg-base-100 p-4 sm:p-6 space-y-3">
            <h3 className="text-sm font-bold text-primary">What this dataset contains</h3>
            <p className="text-sm text-neutral leading-relaxed">
              USCIS posts <span className="font-semibold">one Excel workbook per month</span> with
              a count of every employment-based I-485 petition still pending as of that snapshot
              date. The workbook breaks totals out by: preference category (EB-1 through EB-5 and
              the carve-outs), country of chargeability, and priority-date year/month bucket.
              This is the only public source for the size and shape of the green-card queue.
            </p>
            <ul className="text-sm text-neutral leading-relaxed list-disc pl-5 space-y-1">
              <li>
                <span className="font-semibold">Best for:</span> Snapshot of &quot;how long is
                the line&quot; at a point in time, comparing two months, or tracking a
                priority-date cohort as it moves through the queue.
              </li>
              <li>
                <span className="font-semibold">Limitations:</span> It&apos;s a <em>pending</em>{' '}
                inventory, not a flow of new receipts or approvals. It also only covers I-485
                (adjustment of status in the USA), not consular processing abroad.
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-bold text-primary">Consolidated CSV</h3>
            <div className="rounded-xl border-2 border-base-300 bg-base-100 p-4 sm:p-5 space-y-2">
              <p className="text-sm text-neutral leading-relaxed">
                Fine for a single snapshot, awkward for trends: you would otherwise download,
                open, and stitch {i485Files.length} files by hand. EB5 Base does that
                consolidation for you. One CSV with every non-zero cell across all monthly
                snapshots (country, category, visa status, priority-date year/month, count).
              </p>
              <a
                href="/data/i485-pending-inventory.csv"
                download="i485-pending-inventory.csv"
                className="inline-flex items-center text-sm font-semibold text-secondary underline underline-offset-2 hover:text-primary"
              >
                Download i485-pending-inventory.csv
              </a>
              <p className="text-xs text-neutral/70 leading-relaxed">
                Suppressed USCIS values (&quot;D&quot;) appear with an empty count and{' '}
                <span className="font-mono">suppressed=true</span>. Priority-date year{' '}
                <span className="font-mono">0</span> is the USCIS &quot;Prior Years&quot; rollup.
                Built and maintained by EB5 Base; verify against the official XLSX on uscis.gov
                for definitive figures.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-bold text-primary">
              Monthly workbooks ({i485Files.length} published · USCIS originals)
            </h3>
            <div className="rounded-xl border-2 border-base-300 bg-base-100 p-4 sm:p-5 space-y-4">
              <p className="text-xs text-neutral/70 leading-relaxed">
                Date is the inventory as-of day; muted line is when USCIS posted. Months labeled{' '}
                <span className="font-medium text-neutral/80">not posted</span> were never
                published. Each link downloads the XLSX from uscis.gov.
              </p>
              {i485YearsDesc.map((year) => {
                const monthsAsc = [...(i485ByYear.get(year) ?? [])].reverse();
                return (
                  <div key={year} className="space-y-1.5">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-neutral/60">
                      {year}
                    </h4>
                    <ul className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-x-4 gap-y-2">
                      {monthsAsc.map((entry) => {
                        if (entry.kind === 'missing') {
                          return (
                            <li key={entry.ym} className="leading-tight">
                              <span className="text-sm font-medium tabular-nums text-neutral/45">
                                {entry.monthLabel}
                              </span>
                              <span className="block text-[10px] text-neutral/45">not posted</span>
                            </li>
                          );
                        }
                        const f = entry.file;
                        const asOf = formatAsOfShortDayI485(f.as_of_date);
                        const posted = f.published_date ? formatMdY(f.published_date) : null;
                        const tip = posted
                          ? `Inventory as of ${formatAsOfLongI485(f.as_of_date)} · Posted ${formatAsOfLongI485(f.published_date!)}`
                          : `Inventory as of ${formatAsOfLongI485(f.as_of_date)}`;
                        return (
                          <li key={f.as_of_date} className="leading-tight">
                            <a
                              href={f.source_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              title={tip}
                              className="text-sm font-medium text-secondary underline underline-offset-2 hover:text-primary tabular-nums"
                            >
                              {asOf}
                            </a>
                            {posted && (
                              <span className="block text-[10px] text-neutral/55 tabular-nums">
                                posted {posted}
                              </span>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* I-526 section */}
        <section className="space-y-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <header className="space-y-1">
              <h2 className="text-2xl font-bold text-primary tracking-tight">I-526 / I-526E filings & EB-5 throughput</h2>
              <p className="text-sm text-neutral/80">
                Two complementary quarterly releases: EB-5 filings detail, and All Forms
                throughput for the whole EB-5 family.
              </p>
            </header>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <Link
                href={I526_DEFAULT_PATH}
                className="inline-flex items-center px-3 py-1.5 rounded-lg font-semibold bg-primary text-primary-content hover:bg-primary/90 transition-colors"
              >
                Open the I-526 explorer
              </Link>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded-2xl border-2 border-base-300 bg-base-100 p-4 sm:p-6 space-y-3">
              <h3 className="text-sm font-bold text-primary">
                Dataset 1 · I-526 filings detail — country × TEA category × month
              </h3>
              <p className="text-sm text-neutral leading-relaxed">
                A dedicated EB-5 quarterly workbook. One row per receipt month × country of birth
                × TEA set-aside category (Rural, HUA, Rural &amp; HUA, Infrastructure,
                Unreserved), split by Form I-526 (standalone) and Form I-526E (regional center).
                {totalA} quarters ingested so far.
                {latestA ? (
                  <>
                    {' '}
                    Latest data is available through{' '}
                    <span className="font-semibold text-primary">
                      {calendarQuarterLabelForAsOf(latestA.as_of_quarter)}
                    </span>{' '}
                    (covers receipts {longDateI526(latestA.period_start)} →{' '}
                    {longDateI526(latestA.period_end)}).
                  </>
                ) : null}
              </p>
              <ul className="text-sm text-neutral leading-relaxed list-disc pl-5 space-y-1">
                <li>
                  <span className="font-semibold">Best for:</span> Demand modeling per set-aside
                  category, country share of filings, receipt trends over time.
                </li>
                <li>
                  <span className="font-semibold">Limitations:</span> No data on approvals,
                  denials, or pending inventory — you need the throughput dataset for those.
                </li>
              </ul>
            </div>

            <div className="rounded-2xl border-2 border-base-300 bg-base-100 p-4 sm:p-6 space-y-3">
              <h3 className="text-sm font-bold text-primary">
                Dataset 2 · Throughput &amp; processing — EB-5 family
              </h3>
              <p className="text-sm text-neutral leading-relaxed">
                One giant quarterly &quot;All Forms&quot; workbook from USCIS covering every
                immigration form. For the EB-5 family it includes receipts, approvals, denials,
                completions, pending inventory, and median processing months for I-526 legacy,
                I-526 standalone, I-526E, I-829, and the I-956 regional-center forms. {totalB}{' '}
                quarters ingested so far.
                {latestB ? (
                  <>
                    {' '}
                    Latest data is available through{' '}
                    <span className="font-semibold text-primary">
                      {calendarQuarterLabelForAsOf(latestB.as_of_quarter)}
                    </span>
                    .
                  </>
                ) : null}
              </p>
              <ul className="text-sm text-neutral leading-relaxed list-disc pl-5 space-y-1">
                <li>
                  <span className="font-semibold">Best for:</span> Approval volumes, denial
                  rates, processing-time trends, and pending inventory at the form-type level.
                </li>
                <li>
                  <span className="font-semibold">Limitations:</span> No country or TEA-category
                  splits — combine with Dataset 1 whenever you need to go below the whole-form
                  level.
                </li>
              </ul>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-bold text-primary">Consolidated CSVs</h3>
            <div className="rounded-xl border-2 border-base-300 bg-base-100 p-4 sm:p-5 space-y-4">
              <div>
                <h4 className="text-sm font-semibold">I-526 filings data</h4>
                <a
                  href={I526_QUARTERLY_CSV_PATH}
                  download="i526-quarterly.csv"
                  className="inline-flex items-center text-sm font-semibold text-secondary underline underline-offset-2 hover:text-primary mt-1"
                >
                  Download i526-quarterly.csv
                </a>
              </div>
              <div className="divider my-0" />
              <div>
                <h4 className="text-sm font-semibold">Throughput &amp; processing summary</h4>
                <a
                  href={I526_PROCESSING_SUMMARY_CSV_PATH}
                  download="i526-processing-summary.csv"
                  className="inline-flex items-center text-sm font-semibold text-secondary underline underline-offset-2 hover:text-primary mt-1"
                >
                  Download i526-processing-summary.csv
                </a>
              </div>
              <p className="text-xs text-neutral/70 leading-relaxed">
                Suppressed USCIS cells appear with an empty count/stat and{' '}
                <span className="font-mono">suppressed=true</span>. Values shown as &quot;-&quot;
                or empty in the XLSX are treated as zero and omitted from the CSV. Built and
                maintained by EB5 Base; for definitive figures, verify against the XLSX on
                uscis.gov.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-bold text-primary">
              Quarterly releases ({quartersCount} published · {totalA} filings files · {totalB}{' '}
              throughput files)
            </h3>
            <div className="rounded-xl border-2 border-base-300 bg-base-100 p-4 sm:p-5 space-y-4">
              <p className="text-xs text-neutral/70 leading-relaxed">
                Each calendar year below has four quarter slots. Quarters labeled{' '}
                <span className="font-medium text-neutral/80">not posted</span> were never
                published by USCIS (or have not been published yet for the current year). Each
                published quarter has up to two direct links to the XLSX on uscis.gov.
              </p>
              <div className="rounded-lg border border-base-300 bg-base-200/50 px-4 py-3 space-y-1 text-xs text-neutral">
                {latestA ? (
                  <p>
                    <span className="font-semibold text-primary">I-526 filings data:</span>{' '}
                    available through{' '}
                    <span className="font-semibold">
                      {calendarQuarterLabelForAsOf(latestA.as_of_quarter)}
                    </span>{' '}
                    — receipts from {longDateI526(latestA.period_start)} to{' '}
                    {longDateI526(latestA.period_end)}.
                  </p>
                ) : null}
                {latestB ? (
                  <p>
                    <span className="font-semibold text-primary">Throughput &amp; processing:</span>{' '}
                    available through{' '}
                    <span className="font-semibold">
                      {calendarQuarterLabelForAsOf(latestB.as_of_quarter)}
                    </span>
                    .
                  </p>
                ) : null}
              </div>
              {i526CalendarYearsDesc.map((calendarYear) => (
                <div key={calendarYear} className="space-y-1.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-neutral/60">
                    Calendar Year {calendarYear}
                  </h4>
                  <ul className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {(i526ByCalendarYear.get(calendarYear) ?? []).map((tile) => {
                      const months = ['Jan-Mar', 'Apr-Jun', 'Jul-Sep', 'Oct-Dec'][tile.calendarQuarter - 1] ?? '';
                      if (tile.kind === 'missing') {
                        return (
                          <li
                            key={`CY${tile.calendarYear}Q${tile.calendarQuarter}`}
                            className="rounded-lg border-2 border-dashed border-base-300 bg-base-100/60 p-3 leading-tight"
                          >
                            <div className="flex items-baseline gap-2">
                              <span className="text-sm font-semibold text-neutral/45 tabular-nums">
                                Q{tile.calendarQuarter}
                              </span>
                              <span className="text-[10px] text-neutral/45">{months}</span>
                            </div>
                            <span className="block text-[11px] text-neutral/45 mt-1">not posted</span>
                          </li>
                        );
                      }
                      return (
                        <li
                          key={`CY${tile.calendarYear}Q${tile.calendarQuarter}`}
                          className="rounded-lg border-2 border-base-300 bg-base-100 p-3 leading-tight transition-transform duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md hover:border-accent/40 cursor-default"
                        >
                          <div className="flex items-baseline gap-2">
                            <span className="text-sm font-bold tabular-nums">Q{tile.calendarQuarter}</span>
                            <span className="text-[10px] text-neutral/55">{months}</span>
                          </div>
                          {tile.publishedDate && (
                            <div className="text-[10px] text-neutral/55 tabular-nums mt-0.5">
                              posted {formatMdY(tile.publishedDate)}
                            </div>
                          )}
                          <ul className="mt-2 space-y-1 text-[11px]">
                            <li>
                              {tile.a ? (
                                <a
                                  href={tile.a.source_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  title={tile.a.source_title + (tile.publishedDate ? ` · Posted ${longDateI526(tile.publishedDate)}` : '')}
                                  className="font-semibold text-secondary underline underline-offset-2 hover:text-primary"
                                >
                                  I-526 filings data
                                </a>
                              ) : (
                                <span className="text-neutral/40">filings data not posted</span>
                              )}
                            </li>
                            <li>
                              {tile.b ? (
                                <a
                                  href={tile.b.source_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  title={tile.b.source_title + (tile.publishedDate ? ` · Posted ${longDateI526(tile.publishedDate)}` : '')}
                                  className="font-semibold text-secondary underline underline-offset-2 hover:text-primary"
                                >
                                  Throughput &amp; processing
                                </a>
                              ) : (
                                <span className="text-neutral/40">throughput not posted</span>
                              )}
                            </li>
                          </ul>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Footer / library card */}
        <section className="space-y-3">
          <h3 className="text-sm font-bold text-primary">Official source</h3>
          <div className="rounded-2xl border-2 border-base-300 bg-base-100 p-4 sm:p-6 text-sm text-neutral leading-relaxed space-y-3">
            <p>
              Everything above comes from the{' '}
              <a
                href={USCIS_DATA_PAGE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-secondary underline underline-offset-2 hover:text-primary"
              >
                USCIS Immigration and Citizenship Data
              </a>{' '}
              library page. The individual workbook links above go directly to the XLSX on
              uscis.gov; EB5 Base does not host copies of those files.
            </p>
            <p className="text-xs text-neutral/70 leading-relaxed">
              Conventions to know when you open the originals: In the workbooks,{' '}
              <span className="font-medium">D</span> or <span className="font-medium">H</span>{' '}
              markers mean suppressed (count under 10); <span className="font-medium">&quot;-&quot;</span>{' '}
              or empty cells mean zero. For I-485, priority-date years outside the 10-year
              window are rolled into &quot;Prior Years&quot;. For I-526, TEA categories follow
              USCIS labels exactly: Rural, High Unemployment, combined Rural &amp; High
              Unemployment, Infrastructure, Unreserved, and Unknown.
            </p>
            <p className="text-xs text-neutral/70 leading-relaxed">
              I-526 filings detail and EB-5 throughput come from two different USCIS products.
              Row counts differ by construction: filings data is disaggregated by country × TEA ×
              month; throughput data is aggregated at the whole-form-type level for the quarter.
            </p>
          </div>
        </section>
      </section>
    </div>
  );
}

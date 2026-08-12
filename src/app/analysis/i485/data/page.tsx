import type { Metadata } from 'next';
import Link from 'next/link';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import PageHero from '@/components/PageHero';
import I485ViewBar from '@/components/analysis/I485ViewBar';
import { USCIS_DATA_PAGE_URL } from '@/lib/analysis/i485';
import { I485_DEFAULT_PATH } from '@/lib/analysis/i485Routes';

export const metadata: Metadata = {
  title: 'I-485 inventory source files | EB5 Base',
  description:
    'Official USCIS Excel downloads for the monthly employment-based Form I-485 pending inventory, February 2024 to present. Links go to uscis.gov, not hosted copies.',
  alternates: { canonical: 'https://eb5base.com/analysis/i485/data' },
};

interface ManifestFile {
  file: string;
  as_of_date: string;
  published_date: string | null;
  source_url: string;
  source_title: string;
}

interface Manifest {
  source_page: string;
  notes: string;
  files: ManifestFile[];
}

function loadManifest(): Manifest {
  const p = path.join(process.cwd(), 'data', 'uscis-i485', 'manifest.json');
  return JSON.parse(readFileSync(p, 'utf8')) as Manifest;
}

export default function I485SourceDataPage() {
  const manifest = loadManifest();
  const files = [...manifest.files].sort((a, b) =>
    a.as_of_date < b.as_of_date ? 1 : -1,
  );

  const timeline = buildWorkbookTimeline(files);
  const byYear = new Map<string, WorkbookEntry[]>();
  for (const entry of timeline) {
    const list = byYear.get(entry.year) ?? [];
    list.push(entry);
    byYear.set(entry.year, list);
  }
  for (const list of Array.from(byYear.values())) {
    list.sort((a, b) => (a.ym < b.ym ? 1 : -1));
  }
  const yearsDesc = Array.from(byYear.keys()).sort((a, b) => b.localeCompare(a));

  return (
    <div>
      <PageHero
        eyebrow={
          <span>
            <Link href="/analysis" className="hover:underline">
              Analysis
            </Link>{' '}
            /{' '}
            <Link href={I485_DEFAULT_PATH} className="hover:underline">
              I-485 Pending Inventory
            </Link>{' '}
            / Source data
          </span>
        }
        title="I-485 inventory source files"
        subtitle="USCIS posts a separate workbook for each monthly snapshot. We parse and consolidate those releases into one CSV so you can analyze the inventory across time — and still link you to every official file on uscis.gov."
      />

      <I485ViewBar active="data" />

      <section className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <div className="rounded-xl border-2 border-base-300 bg-base-100 p-4 sm:p-5 text-sm text-neutral leading-relaxed space-y-2">
          <p>
            Library page:{' '}
            <a
              href={USCIS_DATA_PAGE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-secondary underline underline-offset-2 hover:text-primary"
            >
              USCIS Immigration and Citizenship Data
            </a>
          </p>
          <p className="text-xs text-neutral/75">{manifest.notes}</p>
        </div>

        <div className="space-y-3">
          <h2 className="text-sm font-bold text-primary">Consolidated CSV</h2>
          <div className="rounded-xl border-2 border-base-300 bg-base-100 p-4 sm:p-5 space-y-2">
            <p className="text-sm text-neutral leading-relaxed">
              USCIS publishes one Excel workbook per release. That is fine for a single snapshot,
              but awkward for trend work: you would otherwise download, open, and stitch{' '}
              {files.length} files by hand. EB5 Base does that consolidation for you — one CSV
              with every non-zero cell across all monthly snapshots (country, category, visa
              status, priority-date year/month, count).
            </p>
            <p className="text-sm text-neutral leading-relaxed">
              Suppressed USCIS values (&quot;D&quot;) appear with an empty count and{' '}
              <span className="font-mono text-xs">suppressed=true</span>. Priority-date year{' '}
              <span className="font-mono text-xs">0</span> is the USCIS &quot;Prior Years&quot;
              rollup.
            </p>
            <p className="text-xs text-neutral/70 leading-relaxed">
              The CSV is built and maintained by EB5 Base from the official workbooks below. For
              definitive figures, download and verify against the monthly XLSX files on uscis.gov.
            </p>
            <a
              href="/data/i485-pending-inventory.csv"
              download="i485-pending-inventory.csv"
              className="inline-flex items-center text-sm font-semibold text-secondary underline underline-offset-2 hover:text-primary"
            >
              Download i485-pending-inventory.csv
            </a>
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-sm font-bold text-primary">
            Monthly workbooks ({files.length} published)
          </h2>
          <div className="rounded-xl border-2 border-base-300 bg-base-100 p-4 sm:p-5 space-y-4">
            <p className="text-xs text-neutral/70 leading-relaxed">
              Dates are the inventory as-of day; muted text is when USCIS posted the workbook.
              Each link downloads the XLSX from uscis.gov. Months labeled{' '}
              <span className="font-medium text-neutral/80">not posted</span> are gaps where USCIS
              never published a snapshot (for example June and July 2025).
            </p>
            {yearsDesc.map((year) => {
              // Calendar order within the year (Jan → Dec) so a 6-col grid reads as two halves.
              const monthsAsc = [...(byYear.get(year) ?? [])].reverse();
              return (
                <div key={year} className="space-y-1.5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-neutral/60">
                    {year}
                  </h3>
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
                      const asOf = formatAsOfShortDay(f.as_of_date);
                      const posted = f.published_date ? formatMdY(f.published_date) : null;
                      const tip = posted
                        ? `Inventory as of ${formatAsOfLong(f.as_of_date)} · Posted ${formatAsOfLong(f.published_date!)}`
                        : `Inventory as of ${formatAsOfLong(f.as_of_date)}`;
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

        <p className="text-xs text-neutral/70">
          <Link
            href={I485_DEFAULT_PATH}
            className="font-semibold text-secondary underline underline-offset-2 hover:text-primary"
          >
            Back to the inventory explorer
          </Link>
        </p>
      </section>
    </div>
  );
}

type WorkbookEntry =
  | { kind: 'published'; year: string; ym: string; file: ManifestFile }
  | { kind: 'missing'; year: string; ym: string; monthLabel: string };

/** Fill every calendar month from the first through last as-of, marking USCIS gaps. */
function buildWorkbookTimeline(files: ManifestFile[]): WorkbookEntry[] {
  if (files.length === 0) return [];
  const byYm = new Map<string, ManifestFile>();
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

  const entries: WorkbookEntry[] = [];
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

/** Month + day only (year is the group heading). */
function formatAsOfShortDay(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

function formatAsOfLong(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  return d.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

/** Numeric mm/dd/yyyy (UTC). */
function formatMdY(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${m}/${d}/${y}`;
}

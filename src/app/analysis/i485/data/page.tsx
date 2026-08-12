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

  const byYear = new Map<string, ManifestFile[]>();
  for (const f of files) {
    const year = f.as_of_date.slice(0, 4);
    const list = byYear.get(year) ?? [];
    list.push(f);
    byYear.set(year, list);
  }
  const years = Array.from(byYear.keys());

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
        subtitle="Official USCIS workbooks power every chart on the inventory explorer. Download a consolidated CSV for your own analysis, or open individual monthly XLSX files on uscis.gov."
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
              One file with every non-zero cell across all {files.length} monthly snapshots
              (country, category, visa status, priority-date year/month, count). Suppressed
              USCIS values (&quot;D&quot;) appear with an empty count and{' '}
              <span className="font-mono text-xs">suppressed=true</span>. Priority-date year{' '}
              <span className="font-mono text-xs">0</span> is the USCIS &quot;Prior Years&quot;
              rollup.
            </p>
            <p className="text-xs text-neutral/70 leading-relaxed">
              This CSV is assembled by EB5 Base from the USCIS workbooks below. For definitive
              figures, download and verify against the official monthly XLSX files on uscis.gov.
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
            Monthly workbooks ({files.length})
          </h2>
          <div className="rounded-xl border-2 border-base-300 bg-base-100 p-4 sm:p-5 space-y-4">
            <p className="text-xs text-neutral/70 leading-relaxed">
              Dates are the inventory as-of day; muted text is when USCIS posted the workbook.
              Each link downloads the XLSX from uscis.gov.
            </p>
            {years.map((year) => (
              <div key={year} className="space-y-1.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral/60">
                  {year}
                </h3>
                <ul className="flex flex-wrap gap-x-4 gap-y-2">
                  {(byYear.get(year) ?? []).map((f) => {
                    const asOf = formatAsOfShortDay(f.as_of_date);
                    const posted = f.published_date
                      ? formatMdY(f.published_date)
                      : null;
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
            ))}
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

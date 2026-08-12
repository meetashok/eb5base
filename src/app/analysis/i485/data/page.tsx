import type { Metadata } from 'next';
import Link from 'next/link';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import PageHero from '@/components/PageHero';
import { USCIS_DATA_PAGE_URL } from '@/lib/analysis/i485';

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
            <Link href="/analysis/i485" className="hover:underline">
              I-485 Pending Inventory
            </Link>{' '}
            / Source data
          </span>
        }
        title="Source data"
        subtitle="Every chart on the inventory explorer is built from these official USCIS workbooks. Downloads open on uscis.gov - EB5 Base does not host the files."
      />

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
          <h2 className="text-sm font-bold text-primary">
            Monthly workbooks ({files.length})
          </h2>
          <div className="rounded-xl border-2 border-base-300 bg-base-100 p-4 sm:p-5 space-y-4">
            {years.map((year) => (
              <div key={year} className="space-y-1.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral/60">
                  {year}
                </h3>
                <ul className="flex flex-wrap gap-x-3 gap-y-1.5">
                  {(byYear.get(year) ?? []).map((f) => (
                    <li key={f.as_of_date}>
                      <a
                        href={f.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={f.source_title}
                        className="text-sm font-medium text-secondary underline underline-offset-2 hover:text-primary tabular-nums"
                      >
                        {formatAsOfShortDay(f.as_of_date)}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-neutral/70">
          <Link href="/analysis/i485" className="font-semibold text-secondary underline underline-offset-2 hover:text-primary">
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

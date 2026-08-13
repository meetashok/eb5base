'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  I526_TAB_PATHS,
  i526TabFromPathname,
  type I526TabId,
} from '@/lib/analysis/i526Routes';

export type I526ViewId = I526TabId;

export const I526_VIEWS: {
  id: I526TabId;
  label: string;
  shortLabel: string;
  href: string;
}[] = [
  {
    id: 'trend',
    label: 'EB5 filings',
    shortLabel: 'Filings',
    href: I526_TAB_PATHS.trend,
  },
  {
    id: 'throughput',
    label: 'Throughput & processing',
    shortLabel: 'Throughput',
    href: I526_TAB_PATHS.throughput,
  },
];

function tabClass(selected: boolean): string {
  if (selected) {
    return 'shrink-0 whitespace-nowrap px-2.5 sm:px-3.5 md:px-4 py-2 text-[13px] sm:text-sm font-semibold rounded-lg transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary bg-primary text-primary-content shadow-soft';
  }
  return 'shrink-0 whitespace-nowrap px-2.5 sm:px-3.5 md:px-4 py-2 text-[13px] sm:text-sm font-semibold rounded-lg transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary text-neutral bg-base-200/80 hover:bg-base-300 hover:text-primary';
}

export default function I526ViewBar({
  active,
}: {
  active?: I526TabId;
}) {
  const pathname = usePathname();
  const fromPath = i526TabFromPathname(pathname ?? '');
  const current = active ?? fromPath ?? 'trend';

  return (
    <div className="border-b-2 border-base-300 bg-base-100 sticky top-[var(--site-sticky-offset)] z-30 shadow-sm">
      <div className="max-w-4xl mx-auto px-3 sm:px-4">
        <div
          role="tablist"
          aria-label="I-526 filings & processing sections"
          className="flex gap-1 py-2.5 -mx-1 px-1 overflow-x-auto scrollbar-thin"
        >
          {I526_VIEWS.map((t) => {
            const selected = current === t.id;
            return (
              <Link
                key={t.id}
                href={t.href}
                role="tab"
                aria-selected={selected}
                id={`i526-view-${t.id}`}
                className={`${tabClass(selected)} text-center`}
                scroll={false}
              >
                <span className="md:hidden">{t.shortLabel}</span>
                <span className="hidden md:inline">{t.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

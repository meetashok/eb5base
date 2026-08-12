'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  I485_TAB_PATHS,
  i485TabFromPathname,
  type I485TabId,
} from '@/lib/analysis/i485Routes';

/** Chart views only (Data is a sibling tab, not an explorer mode). */
export type I485ViewId = 'snapshot' | 'compare' | 'cohort';

export const I485_VIEWS: {
  id: I485TabId;
  label: string;
  shortLabel: string;
  href: string;
}[] = [
  {
    id: 'snapshot',
    label: 'Inventory at a point in time',
    shortLabel: 'Inventory',
    href: I485_TAB_PATHS.snapshot,
  },
  {
    id: 'cohort',
    label: 'Track a priority-date cohort',
    shortLabel: 'Priority date',
    href: I485_TAB_PATHS.cohort,
  },
  {
    id: 'compare',
    label: 'Compare two snapshots',
    shortLabel: 'Compare',
    href: I485_TAB_PATHS.compare,
  },
  {
    id: 'data',
    label: 'Source data',
    shortLabel: 'Data',
    href: I485_TAB_PATHS.data,
  },
];

function tabClass(selected: boolean): string {
  if (selected) {
    return 'shrink-0 px-3 sm:px-3.5 md:px-4 py-2 text-sm font-semibold rounded-lg transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary bg-primary text-primary-content shadow-soft';
  }
  return 'shrink-0 px-3 sm:px-3.5 md:px-4 py-2 text-sm font-semibold rounded-lg transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary text-neutral bg-base-200/80 hover:bg-base-300 hover:text-primary';
}

export default function I485ViewBar({
  active,
}: {
  /** Optional override; defaults to the tab matching the current path. */
  active?: I485TabId;
}) {
  const pathname = usePathname();
  const fromPath = i485TabFromPathname(pathname ?? '');
  const current = active ?? fromPath ?? 'snapshot';

  return (
    <div className="border-b-2 border-base-300 bg-base-100 sticky top-[var(--site-sticky-offset)] z-30 shadow-sm">
      <div className="max-w-4xl mx-auto px-4">
        <div
          role="tablist"
          aria-label="I-485 inventory sections"
          className="flex gap-1 py-2.5 -mx-1 px-1 overflow-x-auto"
        >
          {I485_VIEWS.map((t) => {
            const selected = current === t.id;
            return (
              <Link
                key={t.id}
                href={t.href}
                role="tab"
                aria-selected={selected}
                id={`i485-view-${t.id}`}
                className={`${tabClass(selected)} flex-1 md:flex-none min-w-0 text-center`}
                scroll={false}
              >
                <span className="md:hidden truncate">{t.shortLabel}</span>
                <span className="hidden md:inline">{t.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

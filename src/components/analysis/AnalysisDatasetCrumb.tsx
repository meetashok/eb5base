'use client';

import Link from 'next/link';
import { I485_DEFAULT_PATH } from '@/lib/analysis/i485Routes';
import { I526_DEFAULT_PATH } from '@/lib/analysis/i526Routes';

export type AnalysisDatasetId = 'i485' | 'i526';

interface Option {
  id: AnalysisDatasetId;
  label: string;
  shortLabel: string;
  description: string;
  href: string;
}

const OPTIONS: Option[] = [
  {
    id: 'i485',
    label: 'I-485 Pending Inventory',
    shortLabel: 'I-485',
    description: 'Monthly snapshots by category, country, priority date',
    href: I485_DEFAULT_PATH,
  },
  {
    id: 'i526',
    label: 'I-526 / I-526E Filings',
    shortLabel: 'I-526',
    description: 'Quarterly filings, throughput, processing times',
    href: I526_DEFAULT_PATH,
  },
];

export default function AnalysisDatasetCrumb({
  current,
}: {
  current: AnalysisDatasetId;
}) {
  const active = OPTIONS.find((o) => o.id === current) ?? OPTIONS[0]!;
  return (
    <div className="dropdown dropdown-hover dropdown-bottom inline-block align-middle">
      <span
        tabIndex={0}
        role="button"
        aria-haspopup="listbox"
        aria-expanded="false"
        className="inline-flex items-center gap-1 cursor-pointer hover:text-primary transition-colors duration-150 rounded px-1 -mx-1"
      >
        <span className="font-semibold">{active.label}</span>
        <svg
          className="w-3.5 h-3.5 opacity-70"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.06l3.71-3.83a.75.75 0 111.08 1.04l-4.25 4.38a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </span>
      <ul
        tabIndex={0}
        role="listbox"
        className="dropdown-content menu bg-base-100 text-neutral rounded-box z-[2] w-72 p-1.5 shadow-sm border border-base-300 mt-1.5"
      >
        {OPTIONS.map((o) => {
          const isActive = o.id === current;
          return (
            <li key={o.id} role="option" aria-selected={isActive}>
              <Link
                href={o.href}
                className={`!rounded-lg !px-3 !py-2.5 flex flex-col items-start gap-0.5 ${
                  isActive ? 'bg-primary/10 text-primary' : 'hover:bg-base-200'
                }`}
              >
                <span className="font-semibold text-[13px] leading-tight flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-10 h-5 rounded text-[10px] font-bold bg-base-300/80 text-neutral/70">
                    {o.shortLabel}
                  </span>
                  {o.label}
                </span>
                <span className="text-[11px] leading-snug text-neutral/65 pl-12">
                  {o.description}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

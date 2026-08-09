'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { href: '/tracker/timeline', label: 'Timeline' },
  { href: '/tracker/insights', label: 'Insights' },
  { href: '/tracker/settings', label: 'Settings' },
] as const;

export default function CaseTrackerNav() {
  const pathname = usePathname();

  return (
    <div className="border-b border-base-300/80 bg-base-100/80">
      <div className="max-w-4xl mx-auto px-4 pt-4 pb-0">
        <p className="text-[10px] uppercase tracking-[0.22em] font-semibold text-secondary mb-2">
          Case Tracker
        </p>
        <nav className="flex gap-1 overflow-x-auto" aria-label="Case Tracker sections">
          {TABS.map((tab) => {
            const active = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  active
                    ? 'border-accent text-primary'
                    : 'border-transparent text-neutral/60 hover:text-primary hover:border-base-300'
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

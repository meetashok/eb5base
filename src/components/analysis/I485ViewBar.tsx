'use client';

export type I485ViewId = 'snapshot' | 'compare' | 'cohort';

export const I485_VIEWS: { id: I485ViewId; label: string; shortLabel: string }[] = [
  { id: 'snapshot', label: 'Inventory at a point in time', shortLabel: 'Point in time' },
  { id: 'cohort', label: 'Track a priority-date cohort', shortLabel: 'Cohort' },
  { id: 'compare', label: 'Compare two snapshots', shortLabel: 'Compare' },
];

function tabClass(selected: boolean): string {
  if (selected) {
    return 'shrink-0 px-3 sm:px-3.5 md:px-4 py-2 text-sm font-semibold rounded-lg transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary bg-primary text-primary-content shadow-soft';
  }
  return 'shrink-0 px-3 sm:px-3.5 md:px-4 py-2 text-sm font-semibold rounded-lg transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary text-neutral bg-base-200/80 hover:bg-base-300 hover:text-primary';
}

export default function I485ViewBar({
  active,
  onSelect,
}: {
  active: I485ViewId;
  onSelect: (id: I485ViewId) => void;
}) {
  return (
    <div className="border-b-2 border-base-300 bg-base-100 sticky top-[var(--site-sticky-offset)] z-30 shadow-sm">
      <div className="max-w-4xl mx-auto px-4">
        <div
          role="tablist"
          aria-label="Inventory views"
          className="flex gap-1 py-2.5 -mx-1 px-1 overflow-x-auto"
        >
          {I485_VIEWS.map((t) => {
            const selected = active === t.id;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={selected}
                id={`i485-view-${t.id}`}
                className={`${tabClass(selected)} flex-1 md:flex-none min-w-0 text-center`}
                onClick={() => onSelect(t.id)}
              >
                <span className="md:hidden truncate">{t.shortLabel}</span>
                <span className="hidden md:inline">{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

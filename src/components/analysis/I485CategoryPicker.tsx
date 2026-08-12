'use client';

import { useState } from 'react';
import { filterChipClass } from '@/components/analysis/filterChipClass';
import {
  EB5_CATEGORY_BUTTONS,
  OTHER_CATEGORY_BUTTONS,
  isEb5CategoryFilter,
  toggleCategoryFilter,
} from '@/lib/analysis/i485';

export default function I485CategoryPicker({
  value,
  onChange,
}: {
  value: string[];
  onChange: (next: string[]) => void;
}) {
  const hasOther = value.some((v) => !isEb5CategoryFilter(v));
  const [otherExpanded, setOtherExpanded] = useState(hasOther);
  const otherOpen = hasOther || otherExpanded;
  const selectedCount = value.length;

  function select(next: string) {
    const updated = toggleCategoryFilter(value, next);
    onChange(updated);
    if (!isEb5CategoryFilter(next)) {
      setOtherExpanded(true);
    }
    if (next === 'EB5_ALL') {
      setOtherExpanded(false);
    }
  }

  return (
    <div className="space-y-2" role="group" aria-label="Preference category">
      <span className="block text-xs font-semibold text-neutral/80">
        Category
        {selectedCount > 1 ? (
          <span className="ml-1.5 font-normal text-neutral/55">({selectedCount} selected)</span>
        ) : null}
      </span>
      <div className="flex flex-wrap gap-1.5">
        {EB5_CATEGORY_BUTTONS.map((o) => {
          const selected = value.includes(o.value);
          return (
            <button
              key={o.value}
              type="button"
              className={filterChipClass(selected)}
              aria-pressed={selected}
              onClick={() => select(o.value)}
            >
              {o.label}
            </button>
          );
        })}
        <button
          type="button"
          className={filterChipClass(otherOpen)}
          aria-pressed={otherOpen}
          aria-expanded={otherOpen}
          onClick={() => {
            if (otherOpen && !hasOther) {
              setOtherExpanded(false);
              return;
            }
            if (!otherOpen) setOtherExpanded(true);
          }}
        >
          Other
        </button>
      </div>
      {otherOpen && (
        <div
          className="flex flex-wrap gap-1.5 pl-0 sm:pl-1"
          role="group"
          aria-label="Other employment-based categories"
        >
          {OTHER_CATEGORY_BUTTONS.map((o) => {
            const selected = value.includes(o.value);
            return (
              <button
                key={o.value}
                type="button"
                className={filterChipClass(selected)}
                aria-pressed={selected}
                onClick={() => select(o.value)}
              >
                {o.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

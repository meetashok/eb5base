'use client';

import { filterChipClass } from '@/components/analysis/filterChipClass';
import {
  EB5_CATEGORY_BUTTONS,
  OTHER_CATEGORY_BUTTONS,
  isEb5CategoryFilter,
} from '@/lib/analysis/i485';

const DEFAULT_OTHER = OTHER_CATEGORY_BUTTONS[0]!.value;

export default function I485CategoryPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const otherOpen = !isEb5CategoryFilter(value);

  return (
    <div className="space-y-2" role="group" aria-label="Preference category">
      <span className="block text-xs font-semibold text-neutral/80">Category</span>
      <div className="flex flex-wrap gap-1.5">
        {EB5_CATEGORY_BUTTONS.map((o) => (
          <button
            key={o.value}
            type="button"
            className={filterChipClass(value === o.value)}
            aria-pressed={value === o.value}
            onClick={() => onChange(o.value)}
          >
            {o.label}
          </button>
        ))}
        <button
          type="button"
          className={filterChipClass(otherOpen)}
          aria-pressed={otherOpen}
          aria-expanded={otherOpen}
          onClick={() => {
            if (!otherOpen) onChange(DEFAULT_OTHER);
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
          {OTHER_CATEGORY_BUTTONS.map((o) => (
            <button
              key={o.value}
              type="button"
              className={filterChipClass(value === o.value)}
              aria-pressed={value === o.value}
              onClick={() => onChange(o.value)}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

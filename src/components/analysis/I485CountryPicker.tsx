'use client';

import { filterChipClass } from '@/components/analysis/filterChipClass';
import { type I485Country } from '@/lib/analysis/i485';

const COUNTRY_BUTTONS: { value: I485Country; label: string }[] = [
  { value: 'india', label: 'India' },
  { value: 'china', label: 'China' },
  { value: 'mexico', label: 'Mexico' },
  { value: 'philippines', label: 'Philippines' },
  { value: 'rest_of_world', label: 'Rest of World' },
];

/**
 * Multi-select country chips. Empty selection means all countries.
 */
export default function I485CountryPicker({
  value,
  onChange,
}: {
  value: I485Country[];
  onChange: (next: I485Country[]) => void;
}) {
  const allSelected = value.length === 0;

  function toggle(country: I485Country) {
    if (value.includes(country)) {
      const next = value.filter((c) => c !== country);
      onChange(next);
      return;
    }
    onChange([...value, country]);
  }

  return (
    <div className="space-y-2" role="group" aria-label="Country of chargeability">
      <span className="block text-xs font-semibold text-neutral/80">
        Country of chargeability
        {!allSelected && value.length > 1 ? (
          <span className="ml-1.5 font-normal text-neutral/55">({value.length} selected)</span>
        ) : null}
      </span>
      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          className={filterChipClass(allSelected)}
          aria-pressed={allSelected}
          onClick={() => onChange([])}
        >
          All
        </button>
        {COUNTRY_BUTTONS.map((o) => {
          const selected = value.includes(o.value);
          return (
            <button
              key={o.value}
              type="button"
              className={filterChipClass(selected)}
              aria-pressed={selected}
              onClick={() => toggle(o.value)}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

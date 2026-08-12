'use client';

import { useState } from 'react';
import { filterChipClass } from '@/components/analysis/filterChipClass';
import {
  DEFAULT_I485_CATEGORIES,
  EB5_CATEGORY_BUTTONS,
  OTHER_CATEGORY_BUTTONS,
  enterNonEb5Categories,
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
  const hasNonEb5 = value.some((v) => !isEb5CategoryFilter(v));
  const [nonEb5Expanded, setNonEb5Expanded] = useState(hasNonEb5);
  const nonEb5Open = hasNonEb5 || nonEb5Expanded;
  const selectedCount = value.length;

  function select(next: string) {
    const updated = toggleCategoryFilter(value, next);
    onChange(updated);
    if (!isEb5CategoryFilter(next)) {
      setNonEb5Expanded(true);
    } else {
      setNonEb5Expanded(false);
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
          const selected = !hasNonEb5 && value.includes(o.value);
          return (
            <button
              key={o.value}
              type="button"
              className={filterChipClass(selected, hasNonEb5)}
              aria-pressed={selected}
              title={
                hasNonEb5
                  ? 'Clear Non-EB5 first, or click to switch back to EB-5'
                  : undefined
              }
              onClick={() => {
                if (hasNonEb5) {
                  // Leave Non-EB5 mode by selecting this EB-5 filter alone.
                  onChange(toggleCategoryFilter([], o.value));
                  setNonEb5Expanded(false);
                  return;
                }
                select(o.value);
              }}
            >
              {o.label}
            </button>
          );
        })}
        <button
          type="button"
          className={filterChipClass(nonEb5Open)}
          aria-pressed={nonEb5Open}
          aria-expanded={nonEb5Open}
          onClick={() => {
            if (hasNonEb5) {
              // Exit Non-EB5 back to the default EB-5 filter.
              onChange([...DEFAULT_I485_CATEGORIES]);
              setNonEb5Expanded(false);
              return;
            }
            if (nonEb5Open && !hasNonEb5) {
              setNonEb5Expanded(false);
              return;
            }
            onChange(enterNonEb5Categories(value));
            setNonEb5Expanded(true);
          }}
        >
          Non-EB5
        </button>
      </div>
      {nonEb5Open && (
        <div
          className="flex flex-wrap gap-1.5 pl-0 sm:pl-1"
          role="group"
          aria-label="Non-EB5 employment-based categories"
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

'use client';

import { filterChipClass } from '@/components/analysis/filterChipClass';
import {
  COHORT_PREVIOUS_YEAR_MIN,
  COHORT_RECENT_YEAR_START,
  normalizePriorityDateYearSelection,
  recentCohortYearChips,
  type PriorityDateYearSelection,
} from '@/lib/analysis/i485';

/**
 * Cohort priority-date years: multi-select recent year chips, plus an optional
 * Previous years range (two year dropdowns).
 */
export default function I485PriorityDateRangePicker({
  value,
  onChange,
  latestYear,
}: {
  value: PriorityDateYearSelection;
  onChange: (next: PriorityDateYearSelection) => void;
  /** Latest calendar year to offer as a recent chip (from data / as-of). */
  latestYear: number;
}) {
  const normalized = normalizePriorityDateYearSelection(value, latestYear);
  const recentYears = recentCohortYearChips(latestYear);
  const previousYearOptions: number[] = [];
  for (let y = COHORT_RECENT_YEAR_START - 1; y >= COHORT_PREVIOUS_YEAR_MIN; y -= 1) {
    previousYearOptions.push(y);
  }

  function toggleYear(year: number) {
    const selected = normalized.years.includes(year);
    let nextYears = selected
      ? normalized.years.filter((y) => y !== year)
      : [...normalized.years, year].sort((a, b) => a - b);

    if (nextYears.length === 0 && !normalized.previousEnabled) {
      // Keep at least one recent year when Previous years is off.
      nextYears = [year];
    }

    onChange(
      normalizePriorityDateYearSelection(
        { ...normalized, years: nextYears },
        latestYear,
      ),
    );
  }

  function togglePrevious() {
    if (normalized.previousEnabled) {
      const nextYears =
        normalized.years.length > 0
          ? normalized.years
          : [Math.min(2024, latestYear)].filter((y) => y >= COHORT_RECENT_YEAR_START);
      onChange(
        normalizePriorityDateYearSelection(
          { ...normalized, previousEnabled: false, years: nextYears },
          latestYear,
        ),
      );
      return;
    }
    onChange(
      normalizePriorityDateYearSelection(
        {
          ...normalized,
          previousEnabled: true,
          previousFromYear: Math.min(normalized.previousFromYear, COHORT_RECENT_YEAR_START - 1),
          previousToYear: Math.min(normalized.previousToYear, COHORT_RECENT_YEAR_START - 1),
        },
        latestYear,
      ),
    );
  }

  return (
    <div className="space-y-2" role="group" aria-label="Priority date years">
      <span className="block text-xs font-semibold text-neutral/80">
        Priority date years
        {normalized.years.length + (normalized.previousEnabled ? 1 : 0) > 1 ? (
          <span className="ml-1.5 font-normal text-neutral/55">
            (
            {normalized.years.length}
            {normalized.previousEnabled ? ' + previous' : ''} selected)
          </span>
        ) : null}
      </span>
      <div className="flex flex-wrap gap-1.5">
        {recentYears.map((year) => {
          const selected = normalized.years.includes(year);
          return (
            <button
              key={year}
              type="button"
              className={filterChipClass(selected)}
              aria-pressed={selected}
              onClick={() => toggleYear(year)}
            >
              {year}
            </button>
          );
        })}
        <button
          type="button"
          className={filterChipClass(normalized.previousEnabled)}
          aria-pressed={normalized.previousEnabled}
          aria-expanded={normalized.previousEnabled}
          onClick={togglePrevious}
        >
          Previous years
        </button>
      </div>
      {normalized.previousEnabled && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl">
          <label className="form-control">
            <span className="label-text text-xs font-semibold text-neutral/80 pb-1">From year</span>
            <select
              className="select select-bordered select-sm"
              value={normalized.previousFromYear}
              onChange={(e) =>
                onChange(
                  normalizePriorityDateYearSelection(
                    {
                      ...normalized,
                      previousFromYear: Number(e.target.value),
                    },
                    latestYear,
                  ),
                )
              }
            >
              {previousYearOptions.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </label>
          <label className="form-control">
            <span className="label-text text-xs font-semibold text-neutral/80 pb-1">To year</span>
            <select
              className="select select-bordered select-sm"
              value={normalized.previousToYear}
              onChange={(e) =>
                onChange(
                  normalizePriorityDateYearSelection(
                    {
                      ...normalized,
                      previousToYear: Number(e.target.value),
                    },
                    latestYear,
                  ),
                )
              }
            >
              {previousYearOptions.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}
    </div>
  );
}

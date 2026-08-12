'use client';

import { filterChipClass } from '@/components/analysis/filterChipClass';
import {
  normalizePriorityDateRange,
  type PriorityDateRange,
} from '@/lib/analysis/i485';

const PRESETS: { id: string; label: string; range: PriorityDateRange }[] = [
  {
    id: '2024',
    label: '2024',
    range: { fromYear: 2024, fromMonth: 1, toYear: 2024, toMonth: 12 },
  },
  {
    id: '2025',
    label: '2025',
    range: { fromYear: 2025, fromMonth: 1, toYear: 2025, toMonth: 12 },
  },
  {
    id: '2026',
    label: '2026',
    range: { fromYear: 2026, fromMonth: 1, toYear: 2026, toMonth: 12 },
  },
  {
    id: '2024-present',
    label: '2024–present',
    range: { fromYear: 2024, fromMonth: 1, toYear: 2026, toMonth: 12 },
  },
];

const MIN_MONTH = '2005-01';
const MAX_MONTH = '2026-12';

function toMonthValue(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`;
}

function parseMonthValue(value: string): { year: number; month: number } | null {
  const match = /^(\d{4})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (month < 1 || month > 12) return null;
  return { year, month };
}

function rangesEqual(a: PriorityDateRange, b: PriorityDateRange): boolean {
  const left = normalizePriorityDateRange(a);
  const right = normalizePriorityDateRange(b);
  return (
    left.fromYear === right.fromYear &&
    left.fromMonth === right.fromMonth &&
    left.toYear === right.toYear &&
    left.toMonth === right.toMonth
  );
}

/**
 * Cohort priority-date range: common presets plus two native month inputs.
 */
export default function I485PriorityDateRangePicker({
  value,
  onChange,
}: {
  value: PriorityDateRange;
  onChange: (next: PriorityDateRange) => void;
}) {
  const normalized = normalizePriorityDateRange(value);
  const activePreset = PRESETS.find((p) => rangesEqual(p.range, normalized))?.id ?? null;

  function setFrom(monthValue: string) {
    const parsed = parseMonthValue(monthValue);
    if (!parsed) return;
    onChange(
      normalizePriorityDateRange({
        ...normalized,
        fromYear: parsed.year,
        fromMonth: parsed.month,
      }),
    );
  }

  function setTo(monthValue: string) {
    const parsed = parseMonthValue(monthValue);
    if (!parsed) return;
    onChange(
      normalizePriorityDateRange({
        ...normalized,
        toYear: parsed.year,
        toMonth: parsed.month,
      }),
    );
  }

  return (
    <div className="space-y-2" role="group" aria-label="Priority date range">
      <span className="block text-xs font-semibold text-neutral/80">Priority date range</span>
      <div className="flex flex-wrap gap-1.5">
        {PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            className={filterChipClass(activePreset === p.id)}
            aria-pressed={activePreset === p.id}
            onClick={() => onChange({ ...p.range })}
          >
            {p.label}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl">
        <label className="form-control">
          <span className="label-text text-xs font-semibold text-neutral/80 pb-1">From</span>
          <input
            type="month"
            className="input input-bordered input-sm w-full"
            min={MIN_MONTH}
            max={MAX_MONTH}
            value={toMonthValue(normalized.fromYear, normalized.fromMonth)}
            onChange={(e) => setFrom(e.target.value)}
          />
        </label>
        <label className="form-control">
          <span className="label-text text-xs font-semibold text-neutral/80 pb-1">To</span>
          <input
            type="month"
            className="input input-bordered input-sm w-full"
            min={MIN_MONTH}
            max={MAX_MONTH}
            value={toMonthValue(normalized.toYear, normalized.toMonth)}
            onChange={(e) => setTo(e.target.value)}
          />
        </label>
      </div>
    </div>
  );
}

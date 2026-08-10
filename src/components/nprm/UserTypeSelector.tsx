'use client';

import { useEffect, useState } from 'react';

export type InvestorFilter = 'all' | 'pre_ria' | 'post_ria' | 'future';

export const USER_TYPE_STORAGE_KEY = 'eb5base_nprm_user_type';

const OPTIONS: {
  id: Exclude<InvestorFilter, 'all'>;
  label: string;
  hint: string;
}[] = [
  {
    id: 'pre_ria',
    label: 'Filed before Mar 2022',
    hint: 'Pre-RIA rules',
  },
  {
    id: 'post_ria',
    label: 'Filed Mar 2022 to now',
    hint: 'Including I-526E filers',
  },
  {
    id: 'future',
    label: 'Planning to file',
    hint: 'Watch future amounts',
  },
];

export function readStoredUserType(): InvestorFilter | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(USER_TYPE_STORAGE_KEY);
    if (raw === 'pre_ria' || raw === 'post_ria' || raw === 'future') return raw;
  } catch {
    // ignore
  }
  return null;
}

export function writeStoredUserType(value: InvestorFilter) {
  try {
    if (value === 'all') localStorage.removeItem(USER_TYPE_STORAGE_KEY);
    else localStorage.setItem(USER_TYPE_STORAGE_KEY, value);
  } catch {
    // ignore
  }
}

/**
 * First-visit investor era picker. Persists to localStorage and notifies parent
 * so Impact Matrix can filter rows for Priya-style questions.
 */
export default function UserTypeSelector({
  value,
  onChange,
}: {
  value: InvestorFilter;
  onChange: (next: InvestorFilter) => void;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = readStoredUserType();
    if (stored && value === 'all') onChange(stored);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!mounted) return null;

  return (
    <div
      className="rounded-xl border-2 border-secondary/40 bg-secondary/10 p-3 sm:p-4 space-y-2"
      role="group"
      aria-label="Which investor are you?"
    >
      <p className="text-sm font-bold text-primary">Which investor are you?</p>
      <p className="text-xs text-neutral leading-relaxed">
        Pick one so the table below highlights what hits your situation first.
        Saved only in this browser.
      </p>
      <div className="flex flex-wrap gap-2 pt-1">
        {OPTIONS.map((opt) => {
          const selected = value === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              aria-pressed={selected}
              onClick={() => {
                writeStoredUserType(opt.id);
                onChange(opt.id);
              }}
              className={`btn btn-sm h-auto min-h-0 py-2 px-3 border focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary ${
                selected
                  ? 'btn-primary text-primary-content border-primary'
                  : 'btn-outline border-neutral/30 bg-base-100'
              }`}
            >
              <span className="flex flex-col items-start text-left gap-0.5">
                <span className="font-semibold">{opt.label}</span>
                <span
                  className={`text-[10px] font-normal normal-case tracking-normal ${
                    selected ? 'text-primary-content/80' : 'text-neutral/70'
                  }`}
                >
                  {opt.hint}
                </span>
              </span>
            </button>
          );
        })}
        {value !== 'all' ? (
          <button
            type="button"
            className="btn btn-ghost btn-sm text-neutral/70"
            onClick={() => {
              writeStoredUserType('all');
              onChange('all');
            }}
          >
            Show all
          </button>
        ) : null}
      </div>
    </div>
  );
}

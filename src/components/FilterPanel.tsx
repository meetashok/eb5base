'use client';

import { useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  F956_OPTIONS,
  PROJECT_TYPES,
  SUBSCRIPTION_OPTIONS,
  TEA_OPTIONS,
  US_STATES,
} from '@/lib/constants';

const INVESTMENT_RANGES = [
  { value: 'under_800k', label: 'Under $800K' },
  { value: '800k', label: '$800K' },
  { value: '800k_1050k', label: '$800K–$1.05M' },
  { value: 'over_1050k', label: 'Over $1.05M' },
];

function parseList(value: string | null): string[] {
  if (!value) return [];
  return value.split(',').filter(Boolean);
}

export default function FilterPanel() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const [stateSearch, setStateSearch] = useState('');

  const tea = parseList(searchParams.get('tea'));
  const f956 = parseList(searchParams.get('f956'));
  const subscription = parseList(searchParams.get('subscription'));
  const projectType = parseList(searchParams.get('type'));
  const state = searchParams.get('state') || '';
  const amount = searchParams.get('amount') || '';

  const activeCount = useMemo(() => {
    let count = tea.length + f956.length + subscription.length + projectType.length;
    if (state) count += 1;
    if (amount) count += 1;
    return count;
  }, [tea, f956, subscription, projectType, state, amount]);

  function updateParam(key: string, values: string[] | string) {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('page');
    if (Array.isArray(values)) {
      if (values.length) params.set(key, values.join(','));
      else params.delete(key);
    } else if (values) {
      params.set(key, values);
    } else {
      params.delete(key);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  function toggleList(key: string, current: string[], value: string) {
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    updateParam(key, next);
  }

  function clearAll() {
    const params = new URLSearchParams(searchParams.toString());
    ['tea', 'f956', 'subscription', 'type', 'state', 'amount', 'page', 'filter'].forEach((k) =>
      params.delete(k)
    );
    const q = params.get('q');
    router.push(q ? `${pathname}?q=${encodeURIComponent(q)}` : pathname);
  }

  const filteredStates = US_STATES.filter(
    (s) =>
      s.name.toLowerCase().includes(stateSearch.toLowerCase()) ||
      s.code.toLowerCase().includes(stateSearch.toLowerCase())
  );

  const filters = (
    <div className="space-y-6 text-sm">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-primary">Filters</h2>
        {activeCount > 0 && (
          <button type="button" onClick={clearAll} className="link link-secondary text-meta">
            Clear all filters
          </button>
        )}
      </div>

      <fieldset>
        <legend className="font-medium mb-2">TEA Type</legend>
        <div className="space-y-1.5">
          {TEA_OPTIONS.map((opt) => (
            <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="checkbox checkbox-sm checkbox-primary"
                checked={tea.includes(opt.value)}
                onChange={() => toggleList('tea', tea, opt.value)}
              />
              <span>{opt.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="font-medium mb-2">I-956F Status</legend>
        <div className="space-y-1.5">
          {F956_OPTIONS.map((opt) => (
            <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="checkbox checkbox-sm checkbox-primary"
                checked={f956.includes(opt.value)}
                onChange={() => toggleList('f956', f956, opt.value)}
              />
              <span>{opt.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="font-medium mb-2">Subscription Status</legend>
        <div className="space-y-1.5">
          {SUBSCRIPTION_OPTIONS.map((opt) => (
            <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="checkbox checkbox-sm checkbox-primary"
                checked={subscription.includes(opt.value)}
                onChange={() => toggleList('subscription', subscription, opt.value)}
              />
              <span>{opt.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="font-medium mb-2">State</legend>
        <input
          type="search"
          placeholder="Search states…"
          className="input input-bordered input-sm w-full mb-2"
          value={stateSearch}
          onChange={(e) => setStateSearch(e.target.value)}
        />
        <select
          className="select select-bordered select-sm w-full"
          value={state}
          onChange={(e) => updateParam('state', e.target.value)}
        >
          <option value="">All states</option>
          {filteredStates.map((s) => (
            <option key={s.code} value={s.code}>
              {s.name}
            </option>
          ))}
        </select>
      </fieldset>

      <fieldset>
        <legend className="font-medium mb-2">Investment Amount</legend>
        <div className="space-y-1.5">
          {INVESTMENT_RANGES.map((opt) => (
            <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="amount"
                className="radio radio-sm radio-primary"
                checked={amount === opt.value}
                onChange={() => updateParam('amount', opt.value)}
              />
              <span>{opt.label}</span>
            </label>
          ))}
          {amount && (
            <button
              type="button"
              className="link link-secondary text-meta"
              onClick={() => updateParam('amount', '')}
            >
              Clear amount
            </button>
          )}
        </div>
      </fieldset>

      <fieldset>
        <legend className="font-medium mb-2">Project Type</legend>
        <div className="space-y-1.5">
          {PROJECT_TYPES.map((opt) => (
            <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="checkbox checkbox-sm checkbox-primary"
                checked={projectType.includes(opt.value)}
                onChange={() => toggleList('type', projectType, opt.value)}
              />
              <span>{opt.label}</span>
            </label>
          ))}
        </div>
      </fieldset>
    </div>
  );

  return (
    <>
      <div className="md:hidden mb-4">
        <button
          type="button"
          className="btn btn-outline btn-sm w-full transition-all duration-150"
          onClick={() => setOpen((o) => !o)}
        >
          Filters{activeCount > 0 ? ` (${activeCount})` : ''}
        </button>
        {open && (
          <div className="mt-3 p-4 border border-base-300 rounded-lg bg-base-100">{filters}</div>
        )}
      </div>

      <aside className="hidden md:block w-60 shrink-0">{filters}</aside>
    </>
  );
}

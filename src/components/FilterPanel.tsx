'use client';

import { useMemo, useRef, useState, useEffect } from 'react';
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

function FilterGroup({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="collapse collapse-arrow border border-base-300/50 rounded-lg bg-base-100">
      <input type="checkbox" defaultChecked={defaultOpen} />
      <div className="collapse-title text-sm font-semibold text-primary uppercase tracking-wide min-h-0 py-3">
        {title}
      </div>
      <div className="collapse-content">{children}</div>
    </div>
  );
}

function StateCombobox({
  value,
  onChange,
}: {
  value: string;
  onChange: (code: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapRef = useRef<HTMLDivElement>(null);

  const selected = US_STATES.find((s) => s.code === value);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const filtered = US_STATES.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div ref={wrapRef} className="relative">
      <input
        type="text"
        className="input input-bordered input-sm w-full"
        placeholder="Search states…"
        value={open ? search : selected?.name || ''}
        onFocus={() => {
          setOpen(true);
          setSearch('');
        }}
        onChange={(e) => {
          setSearch(e.target.value);
          setOpen(true);
        }}
      />
      {open && (
        <ul className="absolute z-20 mt-1 w-full max-h-48 overflow-auto rounded-lg border border-base-300 bg-base-100 shadow-sm menu p-1">
          <li>
            <button
              type="button"
              className={!value ? 'active' : ''}
              onClick={() => {
                onChange('');
                setOpen(false);
              }}
            >
              All states
            </button>
          </li>
          {filtered.map((s) => (
            <li key={s.code}>
              <button
                type="button"
                className={value === s.code ? 'active' : ''}
                onClick={() => {
                  onChange(s.code);
                  setOpen(false);
                }}
              >
                {s.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function FilterPanel() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);

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

  const filters = (
    <div className="space-y-3 text-sm">
      <div className="flex items-center justify-between px-1">
        <h2 className="font-semibold text-primary">Filters</h2>
        {activeCount > 0 && (
          <button type="button" onClick={clearAll} className="link link-secondary text-meta">
            Clear all filters
          </button>
        )}
      </div>

      <FilterGroup title="TEA Type" defaultOpen>
        <div className="space-y-1.5 pt-1">
          {TEA_OPTIONS.map((opt) => (
            <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="checkbox checkbox-sm checkbox-secondary"
                checked={tea.includes(opt.value)}
                onChange={() => toggleList('tea', tea, opt.value)}
              />
              <span>{opt.label}</span>
            </label>
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title="I-956F Status" defaultOpen>
        <div className="space-y-1.5 pt-1">
          {F956_OPTIONS.map((opt) => (
            <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="checkbox checkbox-sm checkbox-secondary"
                checked={f956.includes(opt.value)}
                onChange={() => toggleList('f956', f956, opt.value)}
              />
              <span>{opt.label}</span>
            </label>
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title="Subscription Status" defaultOpen>
        <div className="space-y-1.5 pt-1">
          {SUBSCRIPTION_OPTIONS.map((opt) => (
            <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="checkbox checkbox-sm checkbox-secondary"
                checked={subscription.includes(opt.value)}
                onChange={() => toggleList('subscription', subscription, opt.value)}
              />
              <span>{opt.label}</span>
            </label>
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title="State">
        <div className="pt-1">
          <StateCombobox value={state} onChange={(code) => updateParam('state', code)} />
        </div>
      </FilterGroup>

      <FilterGroup title="Investment Amount">
        <div className="space-y-1.5 pt-1">
          {INVESTMENT_RANGES.map((opt) => (
            <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="amount"
                className="radio radio-sm radio-secondary"
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
      </FilterGroup>

      <FilterGroup title="Project Type">
        <div className="space-y-1.5 pt-1">
          {PROJECT_TYPES.map((opt) => (
            <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="checkbox checkbox-sm checkbox-secondary"
                checked={projectType.includes(opt.value)}
                onChange={() => toggleList('type', projectType, opt.value)}
              />
              <span>{opt.label}</span>
            </label>
          ))}
        </div>
      </FilterGroup>
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
          <div className="mt-3 p-3 border border-base-300 rounded-lg bg-base-100">{filters}</div>
        )}
      </div>

      <aside className="hidden md:block w-60 shrink-0">{filters}</aside>
    </>
  );
}

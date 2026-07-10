'use client';

import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase';

interface RCAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (value: string) => void;
}

export default function RCAutocomplete({ value, onChange, onSelect }: RCAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [allowNew, setAllowNew] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  useEffect(() => {
    if (!value.trim() || value.trim().length < 2) {
      setSuggestions([]);
      setAllowNew(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      const supabase = createClient();
      const { data } = await supabase
        .from('projects')
        .select('regional_center')
        .not('regional_center', 'is', null)
        .ilike('regional_center', `%${value.trim()}%`)
        .is('merged_into', null)
        .limit(50);

      const unique = Array.from(
        new Set((data || []).map((r) => r.regional_center).filter(Boolean) as string[])
      ).sort((a, b) => a.localeCompare(b));

      setSuggestions(unique);
      setAllowNew(!unique.some((s) => s.toLowerCase() === value.trim().toLowerCase()));
      setOpen(true);
      setLoading(false);
    }, 250);

    return () => clearTimeout(timer);
  }, [value]);

  function pick(name: string) {
    onChange(name);
    onSelect?.(name);
    setOpen(false);
  }

  return (
    <div ref={wrapRef} className="relative">
      <input
        type="text"
        className="input input-bordered w-full"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => value.trim().length >= 2 && setOpen(true)}
        placeholder="Start typing a regional center name…"
        autoComplete="off"
        required
      />
      {open && (suggestions.length > 0 || allowNew || loading) && (
        <ul className="absolute z-20 mt-1 w-full max-h-56 overflow-auto rounded-lg border border-base-300 bg-base-100 shadow-sm">
          {loading && <li className="px-3 py-2 text-meta text-neutral/60">Searching…</li>}
          {suggestions.map((s) => (
            <li key={s}>
              <button
                type="button"
                className="w-full text-left px-3 py-2 hover:bg-base-200 transition-all duration-150"
                onClick={() => pick(s)}
              >
                {s}
              </button>
            </li>
          ))}
          {allowNew && value.trim() && (
            <li>
              <button
                type="button"
                className="w-full text-left px-3 py-2 text-secondary hover:bg-base-200 transition-all duration-150"
                onClick={() => pick(value.trim())}
              >
                + Add new regional center “{value.trim()}”
              </button>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}

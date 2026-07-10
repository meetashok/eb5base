'use client';

import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase';
import type { RegionalCenter } from '@/lib/types';

export interface RCSelection {
  id: string | null;
  name: string;
  uscis_rc_id: string | null;
  isNew: boolean;
}

interface RCAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (selection: RCSelection) => void;
}

export default function RCAutocomplete({ value, onChange, onSelect }: RCAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<
    Pick<RegionalCenter, 'id' | 'name' | 'uscis_rc_id'>[]
  >([]);
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
        .from('regional_centers')
        .select('id, name, uscis_rc_id')
        .ilike('name', `%${value.trim()}%`)
        .order('name')
        .limit(10);

      const list = data || [];
      setSuggestions(list);
      setAllowNew(!list.some((s) => s.name.toLowerCase() === value.trim().toLowerCase()));
      setOpen(true);
      setLoading(false);
    }, 250);

    return () => clearTimeout(timer);
  }, [value]);

  function pickExisting(rc: Pick<RegionalCenter, 'id' | 'name' | 'uscis_rc_id'>) {
    onChange(rc.name);
    onSelect({
      id: rc.id,
      name: rc.name,
      uscis_rc_id: rc.uscis_rc_id,
      isNew: false,
    });
    setOpen(false);
  }

  function pickNew() {
    const name = value.trim();
    onChange(name);
    onSelect({
      id: null,
      name,
      uscis_rc_id: null,
      isNew: true,
    });
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
            <li key={s.id}>
              <button
                type="button"
                className="w-full text-left px-3 py-2 hover:bg-base-200 transition-all duration-150"
                onClick={() => pickExisting(s)}
              >
                <span className="font-medium">{s.name}</span>
                {s.uscis_rc_id && (
                  <span className="block text-meta text-neutral/50">{s.uscis_rc_id}</span>
                )}
              </button>
            </li>
          ))}
          {allowNew && value.trim() && (
            <li>
              <button
                type="button"
                className="w-full text-left px-3 py-2 text-secondary hover:bg-base-200 transition-all duration-150"
                onClick={pickNew}
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

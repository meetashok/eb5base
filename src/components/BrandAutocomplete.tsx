'use client';

import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase';
import type { RcBrand } from '@/lib/types';

export interface BrandSelection {
  id: string | null;
  name: string;
  website_url: string | null;
  isNew: boolean;
}

interface BrandAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (selection: BrandSelection) => void;
}

export default function BrandAutocomplete({
  value,
  onChange,
  onSelect,
}: BrandAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<
    Pick<RcBrand, 'id' | 'name' | 'website_url'>[]
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
        .from('rc_brands')
        .select('id, name, website_url')
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

  function pickExisting(brand: Pick<RcBrand, 'id' | 'name' | 'website_url'>) {
    onChange(brand.name);
    onSelect({
      id: brand.id,
      name: brand.name,
      website_url: brand.website_url,
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
      website_url: null,
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
        placeholder="Search, e.g. EB5 United, CMB, Golden Gate Global…"
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
                {s.website_url && (
                  <span className="block text-meta text-neutral/50 truncate">{s.website_url}</span>
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

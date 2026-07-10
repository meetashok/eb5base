'use client';

import { useEffect, useRef, useState } from 'react';
import { countries, type Country } from '@/data/countries';

interface CountrySelectProps {
  value: string | null;
  onChange: (country: Country | null) => void;
  className?: string;
}

export default function CountrySelect({ value, onChange, className }: CountrySelectProps) {
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedCountry = value
    ? countries.find((c) => c.code === value) ||
      countries.find((c) => c.name.toLowerCase() === value.toLowerCase())
    : null;

  const filtered = search
    ? countries.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.code.toLowerCase().includes(search.toLowerCase())
      )
    : [...countries];

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearch('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  return (
    <div ref={wrapperRef} className={`relative ${className || ''}`}>
      <div
        className="input input-bordered flex items-center gap-2 cursor-pointer w-full"
        onClick={() => {
          setIsOpen(true);
          setSearch('');
        }}
      >
        {selectedCountry && !isOpen ? (
          <>
            <span className="text-lg leading-none" aria-hidden>
              {selectedCountry.flag}
            </span>
            <span className="flex-1 text-left">{selectedCountry.name}</span>
            <button
              type="button"
              className="btn btn-ghost btn-xs btn-circle"
              aria-label="Clear country"
              onClick={(e) => {
                e.stopPropagation();
                onChange(null);
                setSearch('');
              }}
            >
              ✕
            </button>
          </>
        ) : (
          <input
            ref={inputRef}
            type="text"
            className="bg-transparent outline-none flex-1 min-w-0"
            placeholder="Search countries..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            autoComplete="off"
          />
        )}
      </div>

      {isOpen && (
        <ul className="absolute z-50 mt-1 w-full bg-base-100 shadow-lg border border-base-300 rounded-lg max-h-60 overflow-auto">
          {filtered.length === 0 ? (
            <li className="p-3 text-sm text-neutral/50">No countries found</li>
          ) : (
            filtered.map((country) => (
              <li key={country.code}>
                <button
                  type="button"
                  className={`w-full text-left px-3 py-2 flex items-center gap-3 hover:bg-base-200 transition-colors duration-150 text-sm ${
                    value === country.code || selectedCountry?.code === country.code
                      ? 'bg-primary/10 font-medium'
                      : ''
                  }`}
                  onClick={() => {
                    onChange(country);
                    setSearch('');
                    setIsOpen(false);
                  }}
                >
                  <span className="text-lg leading-none" aria-hidden>
                    {country.flag}
                  </span>
                  <span>{country.name}</span>
                  <span className="text-xs text-neutral/40 ml-auto">{country.code}</span>
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}

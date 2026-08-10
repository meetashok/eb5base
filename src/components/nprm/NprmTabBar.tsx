'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { NPRM_TABS, type NprmTabId } from '@/lib/nprm/tabs';

const MOBILE_VISIBLE = 3;

function mobileWindow(active: NprmTabId): NprmTabId[] {
  const ids = NPRM_TABS.map((t) => t.id);
  const idx = Math.max(0, ids.indexOf(active));
  const start = Math.max(0, Math.min(idx - 1, ids.length - MOBILE_VISIBLE));
  return ids.slice(start, start + MOBILE_VISIBLE);
}

function tabClass(selected: boolean, emphasize = false): string {
  if (selected) {
    return `shrink-0 px-3 sm:px-3.5 md:px-4 py-2 text-sm font-semibold rounded-lg transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary ${
      emphasize
        ? 'bg-secondary text-secondary-content shadow-soft'
        : 'bg-primary text-primary-content shadow-soft'
    }`;
  }
  if (emphasize) {
    return 'shrink-0 px-3 sm:px-3.5 md:px-4 py-2 text-sm font-semibold rounded-lg transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary text-secondary-content bg-secondary hover:bg-secondary/90 shadow-soft ring-1 ring-secondary/40';
  }
  return 'shrink-0 px-3 sm:px-3.5 md:px-4 py-2 text-sm font-semibold rounded-lg transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary text-neutral bg-base-200/80 hover:bg-base-300 hover:text-primary';
}

function WriteIcon({ className = 'h-3.5 w-3.5' }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path d="M2.695 14.763l-1.262 3.154a.5.5 0 00.65.65l3.155-1.262a4 4 0 001.343-.885L17.5 5.5a2.121 2.121 0 00-3-3L3.58 13.42a4 4 0 00-.885 1.343z" />
    </svg>
  );
}

function TabLabel({ id, label }: { id: NprmTabId; label: string }) {
  if (id !== 'write') return <>{label}</>;
  return (
    <span className="inline-flex items-center justify-center gap-1.5">
      <WriteIcon />
      <span>{label}</span>
    </span>
  );
}

export default function NprmTabBar({
  active,
  onSelect,
}: {
  active: NprmTabId;
  onSelect: (id: NprmTabId) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const visibleMobile = mobileWindow(active);

  useEffect(() => {
    setMenuOpen(false);
  }, [active]);

  useEffect(() => {
    if (!menuOpen) return;
    function onPointerDown(event: MouseEvent | TouchEvent) {
      const target = event.target as Node | null;
      if (menuRef.current && target && !menuRef.current.contains(target)) {
        setMenuOpen(false);
      }
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setMenuOpen(false);
    }
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  return (
    <div className="border-b-2 border-base-300 bg-base-100 sticky top-[var(--site-sticky-offset)] z-30 shadow-sm">
      <div className="max-w-6xl mx-auto px-4">
        {/* Desktop / tablet: full tab row */}
        <div
          role="tablist"
          aria-label="EB-5 proposed rule sections"
          className="hidden md:flex gap-1 py-2.5 -mx-1 px-1"
        >
          {NPRM_TABS.map((t) => {
            const selected = active === t.id;
            const emphasize = t.id === 'write';
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={selected}
                id={`nprm-tab-${t.id}`}
                className={tabClass(selected, emphasize)}
                onClick={() => onSelect(t.id)}
              >
                <TabLabel id={t.id} label={t.label} />
              </button>
            );
          })}
        </div>

        {/* Mobile: up to 3 tabs around the active one + More menu */}
        <div
          role="tablist"
          aria-label="EB-5 proposed rule sections"
          className="md:hidden flex items-center gap-1 py-2.5 -mx-1 px-1"
        >
          {visibleMobile.map((id) => {
            const t = NPRM_TABS.find((tab) => tab.id === id);
            if (!t) return null;
            const selected = active === t.id;
            const emphasize = t.id === 'write';
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={selected}
                id={`nprm-tab-mobile-${t.id}`}
                className={`${tabClass(selected, emphasize)} flex-1 min-w-0 truncate text-center`}
                onClick={() => onSelect(t.id)}
              >
                <TabLabel id={t.id} label={t.label} />
              </button>
            );
          })}

          <div className="relative shrink-0" ref={menuRef}>
            <button
              type="button"
              className={`${tabClass(false)} px-2.5 inline-flex items-center justify-center gap-1`}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              aria-controls={menuId}
              onClick={() => setMenuOpen((open) => !open)}
            >
              <span className="sr-only">All sections</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-5 w-5"
                aria-hidden
              >
                <path d="M3 5.75A.75.75 0 013.75 5h12.5a.75.75 0 010 1.5H3.75A.75.75 0 013 5.75zm0 4.25a.75.75 0 01.75-.75h12.5a.75.75 0 010 1.5H3.75A.75.75 0 013 10zm0 4.25a.75.75 0 01.75-.75h12.5a.75.75 0 010 1.5H3.75a.75.75 0 01-.75-.75z" />
              </svg>
            </button>
            {menuOpen ? (
              <div
                id={menuId}
                role="menu"
                aria-label="All NPRM sections"
                className="absolute right-0 top-full mt-1 z-40 min-w-[11rem] rounded-xl border-2 border-base-300 bg-base-100 p-1.5 shadow-soft"
              >
                {NPRM_TABS.map((t) => {
                  const selected = active === t.id;
                  const emphasize = t.id === 'write';
                  return (
                    <button
                      key={t.id}
                      type="button"
                      role="menuitem"
                      className={`w-full text-left px-3 py-2.5 text-sm font-semibold rounded-lg ${
                        selected
                          ? emphasize
                            ? 'bg-secondary text-secondary-content'
                            : 'bg-primary text-primary-content'
                          : emphasize
                            ? 'text-secondary-content bg-secondary hover:bg-secondary/90'
                            : 'text-neutral hover:bg-base-200'
                      }`}
                      onClick={() => {
                        onSelect(t.id);
                        setMenuOpen(false);
                      }}
                    >
                      <TabLabel id={t.id} label={t.label} />
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

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

function tabClass(selected: boolean): string {
  return `shrink-0 px-3 sm:px-3.5 md:px-4 py-2 text-sm font-semibold rounded-lg transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary ${
    selected
      ? 'bg-primary text-primary-content shadow-soft'
      : 'text-neutral bg-base-200/80 hover:bg-base-300 hover:text-primary'
  }`;
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
  const overflow = NPRM_TABS.filter((t) => !visibleMobile.includes(t.id));

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
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={selected}
                id={`nprm-tab-${t.id}`}
                className={tabClass(selected)}
                onClick={() => onSelect(t.id)}
              >
                {t.label}
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
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={selected}
                id={`nprm-tab-mobile-${t.id}`}
                className={`${tabClass(selected)} flex-1 min-w-0 truncate text-center`}
                onClick={() => onSelect(t.id)}
              >
                {t.label}
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
              <span className="sr-only">More sections</span>
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
                aria-label="More NPRM sections"
                className="absolute right-0 top-full mt-1 z-40 min-w-[11rem] rounded-xl border-2 border-base-300 bg-base-100 p-1.5 shadow-soft"
              >
                {overflow.map((t) => {
                  const selected = active === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      role="menuitem"
                      className={`w-full text-left px-3 py-2.5 text-sm font-semibold rounded-lg ${
                        selected
                          ? 'bg-primary text-primary-content'
                          : 'text-neutral hover:bg-base-200'
                      }`}
                      onClick={() => {
                        onSelect(t.id);
                        setMenuOpen(false);
                      }}
                    >
                      {t.label}
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

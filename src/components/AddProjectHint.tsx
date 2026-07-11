'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ADD_PROJECT_HINT_STORAGE_KEY } from '@/lib/constants';

const HINT_DURATION_MS = 3000;
const FADE_MS = 500;
const SCROLL_DISMISS_PX = 50;

type HintPhase = 'hidden' | 'visible' | 'fading';

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function isElementVisible(el: HTMLElement): boolean {
  const rect = el.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return false;
  const style = window.getComputedStyle(el);
  if (style.visibility === 'hidden' || style.display === 'none' || style.opacity === '0') {
    return false;
  }
  return rect.bottom > 0 && rect.right > 0 && rect.top < window.innerHeight && rect.left < window.innerWidth;
}

function findHintTarget(): HTMLElement | null {
  const primary = document.querySelector<HTMLElement>('[data-add-project-hint="primary"]');
  if (primary && isElementVisible(primary)) return primary;

  const navTargets = Array.from(
    document.querySelectorAll<HTMLElement>('[data-add-project-hint="nav"]')
  );
  for (let i = 0; i < navTargets.length; i++) {
    const nav = navTargets[i];
    if (isElementVisible(nav)) return nav;
  }

  return null;
}

function persistHintSeen() {
  try {
    localStorage.setItem(ADD_PROJECT_HINT_STORAGE_KEY, '1');
  } catch {
    // ignore storage errors
  }
}

function hasSeenHint(): boolean {
  try {
    return localStorage.getItem(ADD_PROJECT_HINT_STORAGE_KEY) === '1';
  } catch {
    return true;
  }
}

export default function AddProjectHint() {
  const [mounted, setMounted] = useState(false);
  const [phase, setPhase] = useState<HintPhase>('hidden');
  const [active, setActive] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number; rotation: number } | null>(
    null
  );
  const [reducedMotion, setReducedMotion] = useState(false);
  const targetRef = useRef<HTMLElement | null>(null);
  const scrollStartRef = useRef<number | null>(null);
  const dismissedRef = useRef(false);

  const dismiss = useCallback((persist = true) => {
    if (dismissedRef.current) return;
    dismissedRef.current = true;
    targetRef.current?.classList.remove('add-project-hint-target');
    if (persist) persistHintSeen();
    setActive(false);
    setPhase('hidden');
    setPosition(null);
  }, []);

  const startFade = useCallback(() => {
    if (dismissedRef.current) return;
    setPhase('fading');
    window.setTimeout(() => dismiss(true), FADE_MS);
  }, [dismiss]);

  const updatePosition = useCallback(() => {
    const target = targetRef.current;
    if (!target) return;
    const rect = target.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const arrowLeft = centerX - 100;
    const arrowTop = centerY - 95;
    const dx = centerX - (arrowLeft + 95);
    const dy = centerY - (arrowTop + 85);
    const rotation = (Math.atan2(dy, dx) * 180) / Math.PI;

    setPosition({ top: arrowTop, left: arrowLeft, rotation });
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || hasSeenHint()) return;

    const reduced = prefersReducedMotion();
    setReducedMotion(reduced);

    const tryShow = () => {
      const target = findHintTarget();
      if (!target) return false;

      targetRef.current = target;
      target.classList.add('add-project-hint-target');
      setActive(true);

      if (reduced) {
        window.setTimeout(() => dismiss(true), 1000);
        return true;
      }

      updatePosition();
      setPhase('visible');
      window.setTimeout(startFade, HINT_DURATION_MS - FADE_MS);
      return true;
    };

    const showTimer = window.setTimeout(() => {
      if (!tryShow()) {
        window.setTimeout(() => {
          if (!tryShow()) dismiss(false);
        }, 400);
      }
    }, 350);

    return () => window.clearTimeout(showTimer);
  }, [mounted, dismiss, startFade, updatePosition]);

  useEffect(() => {
    if (!active) return;

    scrollStartRef.current = window.scrollY;

    const onScroll = () => {
      if (Math.abs(window.scrollY - (scrollStartRef.current ?? 0)) > SCROLL_DISMISS_PX) {
        dismiss(true);
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dismiss(true);
    };

    const onClick = () => dismiss(true);

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('click', onClick, { capture: true });
    window.addEventListener('resize', updatePosition);

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('click', onClick, { capture: true });
      window.removeEventListener('resize', updatePosition);
    };
  }, [active, dismiss, updatePosition]);

  if (!mounted || reducedMotion || phase === 'hidden' || !position) {
    return null;
  }

  return createPortal(
    <div
      className={`add-project-hint-overlay pointer-events-none fixed z-40 ${
        phase === 'fading' ? 'add-project-hint-fade' : ''
      }`}
      style={{ top: position.top, left: position.left }}
      aria-hidden
    >
      <p className="add-project-hint-label mb-1 whitespace-nowrap">Know a project? Add it here</p>
      <svg
        className="add-project-hint-arrow"
        width="110"
        height="90"
        viewBox="0 0 110 90"
        fill="none"
        style={{ transform: `rotate(${position.rotation - 18}deg)` }}
      >
        <path
          className="add-project-hint-arrow-path"
          d="M8 12 C 28 8, 52 6, 72 18 S 98 42, 92 68 L 88 62 M 92 68 L 98 72 L 86 76"
          stroke="#d4af37"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          className="add-project-hint-arrow-shadow"
          d="M8 12 C 28 8, 52 6, 72 18 S 98 42, 92 68 L 88 62 M 92 68 L 98 72 L 86 76"
          stroke="#b87333"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.25"
        />
      </svg>
    </div>,
    document.body
  );
}

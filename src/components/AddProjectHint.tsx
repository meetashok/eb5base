'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ADD_PROJECT_HINT_STORAGE_KEY } from '@/lib/constants';

const HINT_DURATION_MS = 3000;
const FADE_MS = 500;
const SCROLL_DISMISS_PX = 50;
const ARROW_WIDTH = 150;
const ARROW_HEIGHT = 120;
const GAP_BELOW_PX = 12;

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

    const overlayWidth = ARROW_WIDTH;
    let left = centerX - overlayWidth / 2;
    const padding = 8;
    left = Math.max(padding, Math.min(left, window.innerWidth - overlayWidth - padding));

    const top = rect.bottom + GAP_BELOW_PX;
    const offsetFromCenter = centerX - (left + overlayWidth / 2);
    const rotation = Math.max(-8, Math.min(8, offsetFromCenter * 0.08));

    setPosition({ top, left, rotation });
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
      className={`add-project-hint-overlay pointer-events-none fixed z-40 flex flex-col items-center ${
        phase === 'fading' ? 'add-project-hint-fade' : ''
      }`}
      style={{
        top: position.top,
        left: position.left,
        width: ARROW_WIDTH,
      }}
      aria-hidden
    >
      <div
        className="add-project-hint-arrow-wrap"
        style={{ ['--hint-rotation' as string]: `${position.rotation}deg` }}
      >
        <img
          src="/hints/brush-arrow-red.png"
          alt=""
          width={ARROW_WIDTH}
          height={ARROW_HEIGHT}
          className="add-project-hint-arrow-img"
        />
      </div>
      <p className="add-project-hint-label mt-1 whitespace-nowrap text-center">
        Know a project? Add it here
      </p>
    </div>,
    document.body
  );
}

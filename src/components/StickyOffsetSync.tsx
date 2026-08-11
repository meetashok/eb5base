'use client';

import { useLayoutEffect } from 'react';

/** Measures sticky #site-chrome (nav) and sets --site-sticky-offset for nested stickies. */
export default function StickyOffsetSync() {
  useLayoutEffect(() => {
    const el = document.getElementById('site-chrome');
    if (!el) return;

    const apply = () => {
      const h = Math.ceil(el.getBoundingClientRect().height);
      if (h <= 0) return;
      document.documentElement.style.setProperty(
        '--site-sticky-offset',
        `${h}px`
      );
    };

    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    window.addEventListener('resize', apply);
    // Fonts / logo can change navbar height after first paint.
    void document.fonts?.ready?.then(apply);

    return () => {
      ro.disconnect();
      window.removeEventListener('resize', apply);
    };
  }, []);

  return null;
}

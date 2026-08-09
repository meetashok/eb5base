'use client';

import { useEffect } from 'react';

/** Measures #site-chrome (nav + trust bar) and sets --site-sticky-offset for nested stickies. */
export default function StickyOffsetSync() {
  useEffect(() => {
    const el = document.getElementById('site-chrome');
    if (!el) return;

    const apply = () => {
      const h = Math.ceil(el.getBoundingClientRect().height);
      document.documentElement.style.setProperty(
        '--site-sticky-offset',
        `${h}px`
      );
    };

    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    window.addEventListener('resize', apply);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', apply);
    };
  }, []);

  return null;
}

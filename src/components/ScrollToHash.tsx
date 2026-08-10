'use client';

import { useEffect } from 'react';

/** Scroll to hash targets like #disclaimer after navigation. */
export default function ScrollToHash({ id }: { id: string }) {
  useEffect(() => {
    const scroll = () => {
      if (window.location.hash !== `#${id}`) return;
      const el = document.getElementById(id);
      if (!el) return;
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
    scroll();
    window.addEventListener('hashchange', scroll);
    return () => window.removeEventListener('hashchange', scroll);
  }, [id]);

  return null;
}

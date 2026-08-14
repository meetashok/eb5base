'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

/**
 * Renders children only once the wrapper scrolls near the viewport. Used to
 * keep below-the-fold chart cards (and their lazy chunks) out of the initial
 * render/hydration path. Reserves `minHeight` until mounted to limit layout shift.
 */
export default function DeferUntilVisible({
  children,
  minHeight = 300,
  rootMargin = '300px',
}: {
  children: ReactNode;
  minHeight?: number;
  rootMargin?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (visible) return;
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [visible, rootMargin]);

  return (
    <div ref={ref} style={visible ? undefined : { minHeight }}>
      {visible ? children : null}
    </div>
  );
}

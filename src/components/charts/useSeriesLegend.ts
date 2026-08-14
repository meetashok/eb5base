'use client';

import { useCallback, useEffect, useState } from 'react';

export interface SeriesEmphasis {
  strokeWidth: number;
  opacity: number;
}

/**
 * Legend state for multi-series charts: hover-to-highlight (focus) and
 * click-to-toggle (hide), keeping at least one series visible. Resets when the
 * set of series or the default-hidden set changes.
 */
export function useSeriesLegend(seriesKeys: string[], initialHiddenKeys: string[] = []) {
  const [focusKey, setFocusKey] = useState<string | null>(null);
  const [hiddenKeys, setHiddenKeys] = useState<Set<string>>(() => new Set(initialHiddenKeys));

  const keySig = seriesKeys.join('|');
  const hiddenSig = initialHiddenKeys.join('|');
  useEffect(() => {
    setHiddenKeys(new Set(initialHiddenKeys));
    setFocusKey(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keySig, hiddenSig]);

  const total = seriesKeys.length;
  const toggleSeries = useCallback(
    (key: string) => {
      setHiddenKeys((prev) => {
        const next = new Set(prev);
        if (next.has(key)) {
          next.delete(key);
          return next;
        }
        if (total - next.size <= 1) return prev; // keep >= 1 visible
        next.add(key);
        return next;
      });
    },
    [total],
  );

  const emphasis = useCallback(
    (key: string): SeriesEmphasis => {
      if (!focusKey) return { strokeWidth: 2.25, opacity: 1 };
      if (focusKey === key) return { strokeWidth: 3.25, opacity: 1 };
      return { strokeWidth: 1.5, opacity: 0.25 };
    },
    [focusKey],
  );

  return { hiddenKeys, focusKey, setFocusKey, toggleSeries, emphasis };
}

'use client';

import { useEffect, useState } from 'react';
import { countdownParts } from '@/lib/nprm/utils';

type Parts = ReturnType<typeof countdownParts>;

/** Compact live deadline countdown (label + timer only). */
export default function CountdownBadge() {
  // Null until mount so SSR and first client paint match.
  const [parts, setParts] = useState<Parts | null>(null);

  useEffect(() => {
    const tick = () => setParts(countdownParts());
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  if (parts?.expired) {
    return (
      <div
        className="inline-flex flex-wrap items-baseline gap-x-3 gap-y-0.5 rounded-lg border-2 border-error/40 bg-error/10 px-3 py-2 text-error"
        role="status"
      >
        <span className="text-[11px] uppercase tracking-wider font-bold opacity-80">
          Comment deadline
        </span>
        <span className="font-bold tracking-tight text-sm sm:text-base">
          Window closed
        </span>
      </div>
    );
  }

  return (
    <div
      className="inline-flex flex-wrap items-baseline gap-x-3 gap-y-0.5 rounded-lg border-2 border-accent/50 bg-accent/20 px-3 py-2 text-primary"
      role="status"
    >
      <span className="text-[11px] uppercase tracking-wider font-bold text-secondary">
        Comment deadline
      </span>
      <span
        className="font-bold tabular-nums tracking-tight text-sm sm:text-base min-h-[1.25rem]"
        aria-live="polite"
      >
        {parts ? (
          <>
            {parts.preciseLabel}
            <span className="sr-only"> remaining</span>
          </>
        ) : (
          <span className="text-neutral/60 font-semibold">Counting down</span>
        )}
      </span>
    </div>
  );
}

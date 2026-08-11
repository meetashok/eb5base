'use client';

import { useEffect, useState } from 'react';
import { countdownParts } from '@/lib/nprm/utils';

type Parts = ReturnType<typeof countdownParts>;

function pad(n: number) {
  return String(n).padStart(2, '0');
}

/** Live deadline clock nested inside the Overview TLDR (not its own card). */
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
      <p className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5 pt-1 border-t border-secondary/20" role="status">
        <span className="text-[11px] uppercase tracking-[0.18em] font-bold text-error/80">
          Time left
        </span>
        <span className="text-base sm:text-lg font-bold tracking-tight text-error">
          Window closed
        </span>
      </p>
    );
  }

  const dayWord = parts?.days === 1 ? 'day' : 'days';

  return (
    <p
      className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5 pt-1 border-t border-secondary/20"
      role="status"
    >
      <span className="text-[11px] uppercase tracking-[0.18em] font-bold text-secondary">
        Time left
      </span>
      <span
        className="font-bold tabular-nums tracking-tight text-lg sm:text-xl text-primary min-h-[1.5rem]"
        aria-live="polite"
      >
        {parts ? (
          <>
            {parts.days}{' '}
            <span className="font-medium text-neutral/65 text-[0.85em]">
              {dayWord}
            </span>{' '}
            {pad(parts.hours)}:{pad(parts.minutes)}
            <span className="text-error">:{pad(parts.seconds)}</span>
            <span className="sr-only"> remaining</span>
          </>
        ) : (
          <span className="text-neutral/50 text-base font-semibold">—</span>
        )}
      </span>
    </p>
  );
}

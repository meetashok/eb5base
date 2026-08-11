'use client';

import { useEffect, useState } from 'react';
import { countdownParts } from '@/lib/nprm/utils';

type Parts = ReturnType<typeof countdownParts>;

/** Compact live deadline countdown for the NPRM hero. */
export default function CountdownBadge({ endsLabel }: { endsLabel: string }) {
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
        className="inline-flex flex-col gap-0.5 rounded-xl px-3.5 py-2.5 text-sm border-2 bg-error/10 border-error/40 text-error"
        role="status"
      >
        <span className="text-[11px] uppercase tracking-wider font-bold opacity-80">
          Comment deadline
        </span>
        <span className="font-bold tracking-tight">Window closed</span>
        <span className="text-xs font-medium opacity-80">Ended {endsLabel}</span>
      </div>
    );
  }

  return (
    <div
      className="inline-flex flex-col gap-0.5 rounded-xl px-3.5 py-2.5 text-sm border-2 bg-accent/20 border-accent/50 text-primary shadow-sm"
      role="status"
    >
      <span className="text-[11px] uppercase tracking-wider font-bold text-secondary">
        Comment deadline
      </span>
      <span
        className="font-bold tabular-nums tracking-tight text-base sm:text-lg min-h-[1.5rem]"
        aria-live="polite"
      >
        {parts ? (
          <>
            {parts.preciseLabel}
            <span className="sr-only"> remaining</span>
          </>
        ) : (
          <span>Until {endsLabel}</span>
        )}
      </span>
      <span className="text-xs font-medium text-neutral">Closes {endsLabel}</span>
    </div>
  );
}

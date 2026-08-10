'use client';

import { useEffect, useState } from 'react';
import { countdownParts } from '@/lib/nprm/utils';

export default function CountdownBadge({ endsLabel }: { endsLabel: string }) {
  const [label, setLabel] = useState<string | null>(null);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    const tick = () => {
      const next = countdownParts();
      setLabel(next.label);
      setExpired(next.expired);
    };
    tick();
    const id = window.setInterval(tick, 30_000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div
      className={`inline-flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 rounded-xl px-3.5 py-2.5 text-sm border-2 ${
        expired
          ? 'bg-error/10 border-error/40 text-error'
          : 'bg-accent/20 border-accent/50 text-primary'
      }`}
    >
      <span className="font-bold tabular-nums tracking-tight" aria-live="polite">
        {label ?? (expired ? 'Comment window closed' : 'Counting down')}
      </span>
      <span className="text-xs font-medium text-neutral">Closes {endsLabel}</span>
    </div>
  );
}

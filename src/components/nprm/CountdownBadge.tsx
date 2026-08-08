'use client';

import { useEffect, useState } from 'react';
import { countdownParts } from '@/lib/nprm/utils';

export default function CountdownBadge({ endsLabel }: { endsLabel: string }) {
  const [label, setLabel] = useState(() => countdownParts().label);
  const [expired, setExpired] = useState(() => countdownParts().expired);

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
      className={`inline-flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 rounded-lg px-3 py-2 text-sm border ${
        expired
          ? 'bg-error/10 border-error/30 text-error'
          : 'bg-accent/15 border-accent/40 text-primary'
      }`}
    >
      <span className="font-semibold tabular-nums tracking-tight">{label}</span>
      <span className="text-xs text-neutral/60">Closes {endsLabel}</span>
    </div>
  );
}

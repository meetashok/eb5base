'use client';

import { useEffect, useState } from 'react';
import { COMMENT_ON_URL, countdownParts } from '@/lib/nprm/utils';

/** Full-width deadline banner for the NPRM hub. */
export default function CountdownBanner({
  endsLabel = 'August 31, 2026 · 11:59pm ET',
}: {
  endsLabel?: string;
}) {
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
      className={`rounded-xl border-2 px-4 py-2.5 text-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 ${
        expired
          ? 'bg-error/10 border-error/40 text-error'
          : 'bg-amber-50 border-amber-300 text-amber-950'
      }`}
    >
      <div className="space-y-0.5">
        <p className="font-bold tabular-nums tracking-tight">
          {expired ? 'Comment window closed' : `Comment deadline: ${endsLabel}`}
        </p>
        {!expired ? (
          <p className="text-xs font-medium opacity-90" aria-live="polite">
            {label ? `${label} remaining · 60-day window` : '60-day comment window'}
          </p>
        ) : null}
      </div>
      <a
        href={COMMENT_ON_URL}
        target="_blank"
        rel="noopener noreferrer"
        data-goatcounter-click="nprm-regulations-gov"
        className="shrink-0 font-semibold underline underline-offset-2 hover:opacity-80"
      >
        Submit on regulations.gov →
      </a>
    </div>
  );
}

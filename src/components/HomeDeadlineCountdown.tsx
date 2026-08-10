'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { countdownParts } from '@/lib/nprm/utils';

/** Live comment-deadline countdown for the homepage alert strip. */
export default function HomeDeadlineCountdown() {
  const [parts, setParts] = useState(() => countdownParts());

  useEffect(() => {
    const tick = () => setParts(countdownParts());
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  if (parts.expired) {
    return (
      <div className="space-y-1" role="status">
        <p className="text-sm sm:text-base font-bold text-amber-950">
          Comment window closed
        </p>
        <p className="text-xs sm:text-sm text-amber-950/80 leading-relaxed">
          The proposed EB-5 rule comment period ended August 31, 2026. You can
          still read the explainer and filed comments.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
      <div className="space-y-0.5 min-w-0">
        <p className="text-[11px] uppercase tracking-wider font-bold text-amber-900/80">
          Comment deadline
        </p>
        <p className="text-lg sm:text-xl font-bold tabular-nums tracking-tight text-amber-950">
          {parts.preciseLabel}
          <span className="sr-only"> remaining</span>
        </p>
        <p className="text-xs sm:text-sm text-amber-950/80 leading-relaxed">
          until comments close August 31, 2026. Weigh in while the window is
          open.
        </p>
      </div>
      <Link
        href="/nprm"
        className="btn btn-sm btn-primary text-primary-content shrink-0 self-center"
      >
        Read explainer
      </Link>
    </div>
  );
}

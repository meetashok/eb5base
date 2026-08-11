'use client';

import { useEffect, useState } from 'react';
import {
  fetchPromptCopyCount,
  formatPromptCopyCount,
} from '@/lib/nprm/promptUse';

/** Soft social-proof line for NPRM prompt copies (Supabase aggregate). */
export default function PromptCopyCount({
  className = '',
  count: countProp,
}: {
  className?: string;
  /** Controlled count from parent (e.g. Write tab after copy). */
  count?: number | null;
}) {
  const controlled = countProp !== undefined;
  const [fetched, setFetched] = useState<number | null>(null);

  useEffect(() => {
    if (controlled) return;
    let cancelled = false;
    fetchPromptCopyCount().then((n) => {
      if (!cancelled) setFetched(n);
    });
    return () => {
      cancelled = true;
    };
  }, [controlled]);

  const count = controlled ? countProp ?? null : fetched;
  if (count == null || count < 1) return null;

  return (
    <p className={`text-sm text-neutral/75 leading-relaxed ${className}`.trim()}>
      <span className="font-semibold text-primary tabular-nums">
        {formatPromptCopyCount(count)}
      </span>{' '}
      {count === 1 ? 'investor has' : 'investors have'} already used EB5 Base to
      build a prompt for their comment.
    </p>
  );
}

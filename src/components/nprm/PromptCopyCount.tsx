'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  fetchPromptCopyCount,
  formatPromptCopyCount,
} from '@/lib/nprm/promptUse';
import { nprmTabHref } from '@/lib/nprm/tabs';

/** Soft social-proof line for NPRM prompt copies (Supabase aggregate). */
export default function PromptCopyCount({
  className = '',
  count: countProp,
  onWrite,
}: {
  className?: string;
  /** Controlled count from parent (e.g. Write tab after copy). */
  count?: number | null;
  /** Overview: switch to Write when the linked phrase is clicked. */
  onWrite?: () => void;
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

  const writeHref = nprmTabHref('write');
  const promptLink = onWrite ? (
    <button
      type="button"
      onClick={onWrite}
      className="font-semibold text-secondary underline underline-offset-2 hover:text-primary"
    >
      build a prompt for their comment
    </button>
  ) : (
    <Link
      href={writeHref}
      className="font-semibold text-secondary underline underline-offset-2 hover:text-primary"
    >
      build a prompt for their comment
    </Link>
  );

  return (
    <p
      className={`text-sm sm:text-[0.95rem] font-medium text-primary leading-snug ${className}`.trim()}
      data-testid="nprm-prompt-copy-count"
    >
      <span className="font-bold tabular-nums text-secondary">
        {formatPromptCopyCount(count)}
      </span>{' '}
      {count === 1 ? 'investor has' : 'investors have'} already used EB5 Base to{' '}
      {promptLink}.
    </p>
  );
}

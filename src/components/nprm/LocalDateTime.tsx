'use client';

import { useEffect, useState } from 'react';
import { formatLastPull } from '@/lib/nprm/utils';

/**
 * Renders an absolute timestamp in the viewer's browser timezone.
 * Formats only after mount so SSR never stamps a server TZ.
 */
export default function LocalDateTime({
  value,
  className,
}: {
  value?: string | null;
  className?: string;
}) {
  const [label, setLabel] = useState<string | null>(null);

  useEffect(() => {
    setLabel(formatLastPull(value || undefined));
  }, [value]);

  if (!value) {
    return <span className={className}>n/a</span>;
  }

  // Stable placeholder until the client applies the local timezone.
  return (
    <span className={className} suppressHydrationWarning>
      {label ?? '…'}
    </span>
  );
}

'use client';

import { formatLastPull } from '@/lib/nprm/utils';

/**
 * Renders an absolute timestamp in the viewer's local timezone.
 * suppressHydrationWarning avoids SSR (UTC/server) vs client mismatch.
 */
export default function LocalDateTime({
  value,
  className,
}: {
  value?: string | null;
  className?: string;
}) {
  return (
    <span className={className} suppressHydrationWarning>
      {formatLastPull(value || undefined)}
    </span>
  );
}

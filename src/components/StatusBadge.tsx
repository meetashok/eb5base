import { cn } from '@/lib/utils';
import type { BadgeVariant } from '@/lib/utils';

const variantClass: Record<BadgeVariant, string> = {
  success: 'badge-success text-white',
  warning: 'badge-warning text-white',
  error: 'badge-error text-white',
  info: 'badge-info text-white',
  muted: 'bg-base-200 text-neutral/60 border-0',
};

interface StatusBadgeProps {
  label: string;
  variant?: BadgeVariant;
  className?: string;
}

export default function StatusBadge({
  label,
  variant = 'muted',
  className,
}: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'badge rounded-full text-xs font-semibold px-3 py-1',
        variantClass[variant],
        className
      )}
    >
      {label}
    </span>
  );
}

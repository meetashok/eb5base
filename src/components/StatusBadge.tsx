import { cn } from '@/lib/utils';
import type { BadgeVariant } from '@/lib/utils';

const variantClass: Record<BadgeVariant, string> = {
  success: 'bg-secondary text-secondary-content border-0',
  warning: 'bg-copper text-white border-0',
  error: 'bg-error text-white border-0',
  info: 'bg-info text-white border-0',
  muted: 'bg-base-200 text-neutral/70 border border-base-300/60',
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

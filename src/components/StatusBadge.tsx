import { cn } from '@/lib/utils';
import type { BadgeVariant } from '@/lib/utils';

const variantClass: Record<BadgeVariant, string> = {
  success: 'badge-success',
  warning: 'badge-warning',
  error: 'badge-error',
  info: 'badge-info',
  ghost: 'badge-ghost',
};

interface StatusBadgeProps {
  label: string;
  variant?: BadgeVariant;
  className?: string;
}

export default function StatusBadge({
  label,
  variant = 'ghost',
  className,
}: StatusBadgeProps) {
  return (
    <span className={cn('badge rounded-full text-xs font-medium', variantClass[variant], className)}>
      {label}
    </span>
  );
}

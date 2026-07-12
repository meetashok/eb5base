import { cn, teaLabel } from '@/lib/utils';

interface TEATagProps {
  designation: string;
  variant?: 'filled' | 'subtle';
  className?: string;
}

const teaFilledClass: Record<string, string> = {
  rural: 'bg-secondary text-secondary-content border-0',
  hua: 'bg-copper text-white border-0',
  infra: 'bg-primary/90 text-primary-content border-0',
};

const teaSubtleClass: Record<string, string> = {
  rural: 'bg-base-100 text-neutral/65 border border-base-300/70',
  hua: 'bg-base-100 text-neutral/65 border border-copper/30',
  infra: 'bg-base-100 text-neutral/65 border border-primary/20',
};

export default function TEATag({ designation, variant = 'filled', className }: TEATagProps) {
  const palette = variant === 'subtle' ? teaSubtleClass : teaFilledClass;

  return (
    <span
      className={cn(
        'badge rounded-full text-xs font-semibold px-3 py-1',
        palette[designation] || (variant === 'subtle'
          ? 'bg-base-100 text-neutral/65 border border-base-300/70'
          : 'bg-info text-white border-0'),
        className
      )}
    >
      {teaLabel(designation)}
    </span>
  );
}

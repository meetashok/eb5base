import { cn, teaLabel } from '@/lib/utils';

interface TEATagProps {
  designation: string;
  className?: string;
}

const teaClass: Record<string, string> = {
  rural: 'bg-secondary text-secondary-content border-0',
  hua: 'bg-copper text-white border-0',
  infra: 'bg-primary/90 text-primary-content border-0',
};

export default function TEATag({ designation, className }: TEATagProps) {
  return (
    <span
      className={cn(
        'badge rounded-full text-xs font-semibold px-3 py-1',
        teaClass[designation] || 'bg-info text-white border-0',
        className
      )}
    >
      {teaLabel(designation)}
    </span>
  );
}

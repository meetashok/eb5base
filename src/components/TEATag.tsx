import { cn, teaLabel } from '@/lib/utils';

interface TEATagProps {
  designation: string;
}

const teaClass: Record<string, string> = {
  rural: 'badge badge-info text-white',
  hua: 'bg-purple-100 text-purple-700 border-0',
  infra: 'bg-teal-100 text-teal-700 border-0',
};

export default function TEATag({ designation }: TEATagProps) {
  return (
    <span
      className={cn(
        'badge rounded-full text-xs font-semibold px-3 py-1',
        teaClass[designation] || 'badge badge-info text-white'
      )}
    >
      {teaLabel(designation)}
    </span>
  );
}

import { teaLabel } from '@/lib/utils';

interface TEATagProps {
  designation: string;
}

export default function TEATag({ designation }: TEATagProps) {
  return (
    <span className="badge badge-info rounded-full text-xs font-medium text-white">
      {teaLabel(designation)}
    </span>
  );
}

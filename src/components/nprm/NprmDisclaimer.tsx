import { NPRM_DISCLAIMER } from '@/lib/nprm/constants';

export default function NprmDisclaimer({ className = '' }: { className?: string }) {
  return (
    <p
      className={`text-meta text-neutral/55 leading-relaxed border border-base-300/80 bg-base-200/50 rounded-md px-3 py-2 ${className}`}
    >
      {NPRM_DISCLAIMER}
    </p>
  );
}

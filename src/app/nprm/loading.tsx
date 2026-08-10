import { ListSkeleton } from '@/components/LoadingSkeleton';

export default function NprmLoading() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-12" role="status" aria-label="Loading NPRM guide">
      <div className="skeleton-shimmer h-8 w-64 mb-4" />
      <div className="skeleton-shimmer h-4 w-full max-w-xl mb-8" />
      <ListSkeleton count={3} />
    </div>
  );
}

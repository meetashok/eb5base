/** Lightweight placeholders for failed/slow NPRM and tool fetches. */
export function CardSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div
      className="rounded-xl border-2 border-base-300 bg-base-100 p-4 sm:p-5 shadow-sm animate-pulse space-y-3"
      aria-hidden
    >
      <div className="h-4 w-2/5 rounded bg-base-300" />
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className={`h-3 rounded bg-base-200 ${i === rows - 1 ? 'w-3/5' : 'w-full'}`}
        />
      ))}
    </div>
  );
}

export function ListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-3" role="status" aria-label="Loading">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} rows={3} />
      ))}
      <span className="sr-only">Loading content…</span>
    </div>
  );
}

export function ErrorRetry({
  message = 'Something went wrong loading this data.',
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div
      role="alert"
      className="rounded-xl border-2 border-dashed border-base-300 bg-base-100 p-5 space-y-3 text-center"
    >
      <p className="text-sm text-neutral leading-relaxed">{message}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="btn btn-sm btn-outline border-neutral/30"
        >
          Retry
        </button>
      ) : null}
    </div>
  );
}

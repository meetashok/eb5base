export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton-shimmer ${className}`} />;
}

export function ProjectCardSkeleton() {
  return (
    <div className="card card-bordered border-base-300/50 shadow-sm animate-pulse">
      <div className="card-body p-4">
        <div className="h-5 bg-base-300 rounded w-3/4 mb-3" />
        <div className="h-3 bg-base-300 rounded w-1/2 mb-2" />
        <div className="h-3 bg-base-300 rounded w-1/3 mb-4" />
        <div className="flex gap-2">
          <div className="h-5 bg-base-300 rounded-full w-16" />
          <div className="h-5 bg-base-300 rounded-full w-20" />
        </div>
      </div>
    </div>
  );
}

export function RCCardSkeleton() {
  return (
    <div className="card card-bordered shadow-sm animate-pulse">
      <div className="card-body p-5">
        <div className="h-5 bg-base-300 rounded w-2/3 mb-3" />
        <div className="h-4 bg-base-300 rounded-full w-24 mb-3" />
        <div className="h-3 bg-base-300 rounded w-1/3 mb-2" />
        <div className="flex gap-1 mt-2">
          <div className="h-5 bg-base-300 rounded-full w-12" />
          <div className="h-5 bg-base-300 rounded-full w-12" />
          <div className="h-5 bg-base-300 rounded-full w-12" />
        </div>
      </div>
    </div>
  );
}

export function AddProjectCTACard() {
  return (
    <div className="card card-bordered border-dashed border-2 border-base-300 bg-base-100 h-full">
      <div className="card-body items-center text-center py-12">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-10 h-10 text-secondary/40 mb-2"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <h3 className="font-semibold text-neutral/70">Know an EB-5 project?</h3>
        <p className="text-sm text-neutral/50">
          Help fellow investors by adding it to the directory
        </p>
        <a href="/projects/new" className="btn btn-outline btn-secondary btn-sm mt-3">
          Add a Project
        </a>
      </div>
    </div>
  );
}

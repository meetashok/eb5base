import { AddProjectLink } from '@/components/AuthGatedLinks';

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton-shimmer ${className}`} />;
}

export function ProjectCardSkeleton() {
  return (
    <div className="card-elevated animate-pulse">
      <div className="card-body p-3 gap-2">
        <div className="flex justify-between gap-2 mb-1">
          <div className="h-4 bg-base-300 rounded w-3/4" />
          <div className="h-4 bg-base-300 rounded w-12" />
        </div>
        <div className="h-3 bg-base-300 rounded w-1/2" />
        <div className="flex gap-1 mt-1.5">
          <div className="h-5 bg-base-300 rounded-full w-12" />
          <div className="h-5 bg-base-300 rounded-full w-16" />
        </div>
        <div className="h-8 bg-base-300 rounded w-full mt-1" />
      </div>
    </div>
  );
}

export function RCCardSkeleton() {
  return (
    <div className="card-elevated animate-pulse">
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

export function AddProjectCTACard({ prominent = false }: { prominent?: boolean }) {
  if (prominent) {
    return (
      <div className="card-elevated project-grid-card border-2 border-secondary/40 bg-gradient-to-br from-secondary/15 via-secondary/5 to-base-100 shadow-soft">
        <div className="card-body items-center text-center p-5 py-6 project-grid-card-body justify-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-10 h-10 text-secondary mb-2"
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
          <h3 className="text-base font-bold text-primary">Know an EB-5 project?</h3>
          <p className="text-sm text-neutral/60 mt-1 max-w-xs">
            Help fellow investors by adding it to the directory
          </p>
          <AddProjectLink className="btn btn-secondary text-secondary-content btn-sm mt-4 rounded-full shadow-soft">
            Add a Project
          </AddProjectLink>
        </div>
      </div>
    );
  }

  return (
    <div className="card-elevated project-grid-card border-dashed border-2 border-secondary/25">
      <div className="card-body items-center text-center p-4 py-6 project-grid-card-body justify-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-8 h-8 text-secondary/40 mb-1.5"
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
        <h3 className="text-sm font-semibold text-neutral/70">Know an EB-5 project?</h3>
        <p className="text-xs text-neutral/50 mt-0.5">
          Help fellow investors by adding it to the directory
        </p>
        <AddProjectLink className="btn btn-outline btn-secondary btn-xs mt-2">
          Add a Project
        </AddProjectLink>
      </div>
    </div>
  );
}

import { AddProjectLink } from '@/components/AuthGatedLinks';

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton-shimmer ${className}`} />;
}

export function ProjectCardSkeleton() {
  return (
    <div className="card-elevated animate-pulse">
      <div className="card-body p-3 pb-3 gap-2">
        <div className="h-4 bg-base-300 rounded w-full mb-1" />
        <div className="h-3 bg-base-300 rounded w-4/5" />
        <div className="h-3 bg-base-300 rounded w-1/2" />
        <div className="flex gap-1 mt-1.5">
          <div className="h-5 bg-base-300 rounded-full w-12" />
          <div className="h-5 bg-base-300 rounded-full w-16" />
        </div>
        <div className="h-3 bg-base-300 rounded w-2/3 mt-1" />
        <div className="border-t border-base-200/70 pt-2 mt-1">
          <div className="h-6 bg-base-300 rounded w-full" />
        </div>
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
      <div className="card-elevated border-2 border-accent/50 bg-gradient-to-br from-accent/25 via-copper/10 to-base-100 shadow-glow">
        <div className="card-body items-center text-center p-5 py-10">
          <div className="w-12 h-12 rounded-full bg-accent/15 flex items-center justify-center mb-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-7 h-7 text-accent"
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
          </div>
          <h3 className="text-base font-bold text-primary">Know an EB-5 project?</h3>
          <p className="text-sm text-neutral/60 mt-1 max-w-xs">
            Help fellow investors by adding it to the directory
          </p>
          <AddProjectLink className="btn btn-accent text-accent-content btn-sm mt-4 rounded-full shadow-soft">
            Add a Project
          </AddProjectLink>
        </div>
      </div>
    );
  }

  return (
    <div className="card-elevated border-dashed border-2 border-accent/30">
      <div className="card-body items-center text-center p-4 py-8">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-8 h-8 text-accent/50 mb-1.5"
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
        <AddProjectLink className="btn btn-outline border-accent/40 text-primary btn-xs mt-2 rounded-full">
          Add a Project
        </AddProjectLink>
      </div>
    </div>
  );
}

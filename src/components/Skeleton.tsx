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
        <div className="h-5 bg-base-300 rounded-full w-20 mt-1.5" />
        <div className="h-3 bg-base-300 rounded w-1/2 mt-1" />
        <div className="flex gap-1 mt-1.5">
          <div className="h-5 bg-base-300 rounded-full w-12 border border-base-300/70" />
          <div className="h-5 bg-base-300 rounded-full w-10 border border-base-300/70" />
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
  return (
    <div
      className={
        prominent
          ? 'card-elevated border-2 border-accent/50 bg-gradient-to-br from-accent/25 via-copper/10 to-base-100 shadow-glow'
          : 'card-elevated border-dashed border-2 border-accent/30'
      }
    >
      <div className="card-body p-3 pb-3 gap-2">
        <div className="min-w-0">
          <div className="flex items-start gap-2">
            <div
              className={`rounded-full bg-accent/15 flex items-center justify-center shrink-0 ${
                prominent ? 'w-7 h-7' : 'w-6 h-6'
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={prominent ? 'w-4 h-4 text-accent' : 'w-3.5 h-3.5 text-accent/70'}
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
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-primary leading-snug">
                Know an EB-5 project?
              </h3>
              <p className="text-xs text-neutral/60 mt-0.5 leading-snug">
                Help fellow investors by adding it to the directory
              </p>
            </div>
          </div>
        </div>
        <div className="border-t border-base-200/70 pt-2 mt-1">
          <AddProjectLink
            className={`btn w-full rounded-full min-h-0 h-6 px-2 text-[10px] font-medium ${
              prominent
                ? 'btn-accent text-accent-content shadow-soft'
                : 'btn-outline border-accent/40 text-primary'
            }`}
          >
            Add a Project
          </AddProjectLink>
        </div>
      </div>
    </div>
  );
}

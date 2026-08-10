'use client';

export default function NprmError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
      <h2 className="text-xl font-bold text-primary">Could not load the NPRM guide</h2>
      <p className="text-sm text-neutral leading-relaxed">
        Something went wrong loading this page. Check your connection and try again. The official
        text is always on the Federal Register and regulations.gov.
      </p>
      {error?.digest ? (
        <p className="text-xs text-neutral/50 font-mono">Ref: {error.digest}</p>
      ) : null}
      <div className="flex flex-wrap gap-2 justify-center pt-2">
        <button type="button" className="btn btn-primary text-primary-content" onClick={reset}>
          Retry
        </button>
        <a
          href="https://www.regulations.gov/docket/USCIS-2026-0100"
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-outline"
        >
          Open regulations.gov
        </a>
      </div>
    </div>
  );
}

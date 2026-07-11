import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="max-w-lg mx-auto px-4 py-24 text-center">
      <div className="text-5xl mb-4" aria-hidden>
        🔍
      </div>
      <h1 className="text-3xl font-bold text-primary mb-2">Page not found</h1>
      <p className="text-neutral/60 mb-8">
        That page doesn&apos;t exist or may have been moved.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link href="/" className="btn btn-primary rounded-full">
          Go home
        </Link>
        <Link href="/projects" className="btn btn-ghost rounded-full">
          Browse projects
        </Link>
      </div>
    </div>
  );
}

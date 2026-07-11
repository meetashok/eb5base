import Link from 'next/link';
import { AddProjectLink } from '@/components/AuthGatedLinks';
import StatusBadge from '@/components/StatusBadge';

export default function NotFound() {
  return (
    <div>
      <section className="hero-glow border-b border-base-300/80">
        <div className="max-w-xl mx-auto px-4 py-16 md:py-20 text-center">
          <p className="hero-eyebrow mb-3">Error 404 · Results pending</p>
          <h1 className="text-3xl md:text-4xl font-bold hero-headline tracking-tight text-balance">
            This page isn&apos;t open for subscriptions
          </h1>
        </div>
      </section>

      <div className="max-w-xl mx-auto px-4 py-10 md:py-14">
        <div className="card-elevated p-8 md:p-10 text-center space-y-6">
          <p className="text-neutral/70 leading-relaxed">
            You may have invested $800,000 of attention navigating here, but unlike an EB-5
            project, this URL offers no guarantee of approval and no timeline for results. We
            couldn&apos;t locate the page you requested.
          </p>

          <div className="flex flex-wrap gap-2 justify-center">
            <StatusBadge label="Route · Not found" variant="error" />
            <StatusBadge label="956F · N/A" variant="muted" />
            <StatusBadge label="Refund · Pending" variant="warning" />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Link href="/" className="btn btn-primary rounded-full">
              Go home
            </Link>
            <Link href="/projects" className="btn btn-outline btn-secondary rounded-full">
              Browse projects
            </Link>
            <AddProjectLink className="btn btn-ghost rounded-full">
              Add a project
            </AddProjectLink>
          </div>
        </div>
      </div>
    </div>
  );
}

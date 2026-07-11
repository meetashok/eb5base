import Link from 'next/link';
import { AddProjectLink } from '@/components/AuthGatedLinks';
import SearchBar from '@/components/SearchBar';
import ProjectCard from '@/components/ProjectCard';
import { AddProjectCTACard } from '@/components/Skeleton';
import { getHomeStats, getRecentProjects } from '@/lib/projects';
import type { ProjectWithVotes } from '@/lib/types';

export const dynamic = 'force-dynamic';

const QUICK_FILTERS = [
  { label: 'Rural', href: '/projects?filter=rural' },
  { label: 'HUA', href: '/projects?filter=hua' },
  { label: 'Open Subscriptions', href: '/projects?filter=open' },
  { label: 'I-956F Approved', href: '/projects?filter=approved' },
];

const STEPS = [
  {
    title: 'Browse projects',
    body: 'Search the directory by name, regional center, location, TEA, and status.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 100-15 7.5 7.5 0 000 15z" />
      </svg>
    ),
  },
  {
    title: 'Confirm status',
    body: 'Share whether a project is still open for subscriptions — help keep listings current.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    title: 'Add what you know',
    body: 'Contribute factual project details so fellow investors can make informed decisions.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
      </svg>
    ),
  },
];

export default async function HomePage() {
  let stats = { projects: 0, regionalCenters: 0, investors: 0, confirmations: 0 };
  let recent: ProjectWithVotes[] = [];

  try {
    [stats, recent] = await Promise.all([getHomeStats(), getRecentProjects(6)]);
  } catch {
    // Supabase may be unconfigured during local setup
  }

  const ctaCount = recent.length < 3 ? Math.max(0, 3 - recent.length) : 0;

  return (
    <div>
      <section className="hero-glow border-b border-base-300/80 relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none opacity-40"
          aria-hidden
          style={{
            background:
              'radial-gradient(ellipse 40% 50% at 90% 10%, rgba(184, 115, 51, 0.2), transparent 60%)',
          }}
        />
        <div className="max-w-6xl mx-auto px-4 py-20 md:py-28 text-center relative">
          <p className="hero-eyebrow mb-4">Community-built · Investor-led</p>
          <h1 className="text-4xl md:text-5xl font-bold hero-headline tracking-tight text-balance">
            The EB-5 Project Directory
          </h1>
          <p className="mt-4 text-base md:text-lg text-neutral/70 max-w-2xl mx-auto">
            Built by investors, for investors. Browse regional center projects, confirm
            subscription status, and help keep the community informed.
          </p>
          <div className="mt-8">
            <SearchBar large />
          </div>
          <div className="flex flex-wrap gap-3 justify-center mt-6">
            <Link href="/projects" className="btn btn-primary rounded-full">
              Browse Projects
            </Link>
            <AddProjectLink className="btn btn-accent text-accent-content rounded-full shadow-soft hover:shadow-glow" data-add-project-hint="primary">
              + Add a Project
            </AddProjectLink>
          </div>
          {stats.projects >= 10 ? (
            <div className="mt-10 flex flex-wrap justify-center gap-4 md:gap-6">
              <div className="stat-pill border-copper/20">
                <p className="text-4xl font-bold text-primary">{stats.projects}</p>
                <p className="text-xs uppercase tracking-widest text-neutral/50 mt-1">Projects</p>
              </div>
              <div className="stat-pill">
                <p className="text-4xl font-bold text-primary">{stats.regionalCenters}</p>
                <p className="text-xs uppercase tracking-widest text-neutral/50 mt-1">
                  Regional Centers
                </p>
              </div>
              <div className="stat-pill">
                <p className="text-4xl font-bold text-primary">{stats.investors}</p>
                <p className="text-xs uppercase tracking-widest text-neutral/50 mt-1">Investors</p>
              </div>
              <div className="stat-pill">
                <p className="text-4xl font-bold text-primary">{stats.confirmations}</p>
                <p className="text-xs uppercase tracking-widest text-neutral/50 mt-1">
                  Confirmations
                </p>
              </div>
            </div>
          ) : (
            <p className="mt-10 text-sm text-neutral/50 italic">
              A growing, community-built directory
            </p>
          )}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-wrap gap-2 justify-center">
          {QUICK_FILTERS.map((f) => (
            <Link
              key={f.href}
              href={f.href}
              className="btn btn-outline btn-sm rounded-full border-secondary/40 text-secondary hover:bg-secondary hover:text-secondary-content transition-all duration-150"
            >
              {f.label}
            </Link>
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-primary">Recently Added</h2>
          <Link href="/projects" className="link link-secondary text-sm">
            View all
          </Link>
        </div>
        {recent.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            <AddProjectCTACard />
            <AddProjectCTACard />
            <AddProjectCTACard />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {recent.map((p) => (
              <ProjectCard key={p.id} project={p} showConfirmationSummary={false} />
            ))}
            {Array.from({ length: ctaCount }).map((_, i) => (
              <AddProjectCTACard key={`cta-${i}`} />
            ))}
          </div>
        )}
      </section>

      <section className="surface-muted mt-6 border-y border-base-300/60">
        <div className="max-w-6xl mx-auto px-4 py-14">
          <h2 className="text-2xl font-bold text-primary text-center mb-3">How it works</h2>
          <p className="text-sm text-neutral/60 text-center mb-10 max-w-xl mx-auto">
            Built for investors researching EB-5 and regional center representatives keeping
            listings up to date.
          </p>
          <div className="relative grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="hidden md:block absolute top-12 left-[16%] right-[16%] border-t-2 border-dashed border-secondary/25 z-0" />
            {STEPS.map((step, i) => (
              <div key={step.title} className="step-card relative z-10 text-center md:text-left">
                <div className="relative inline-block mb-4">
                  <div className="w-16 h-16 rounded-full bg-icon-ring shadow-soft flex items-center justify-center">
                    {step.icon}
                  </div>
                  <span className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-accent text-accent-content text-xs font-bold flex items-center justify-center shadow-soft">
                    {i + 1}
                  </span>
                </div>
                <p className="text-xs uppercase tracking-widest text-secondary font-semibold mb-1">
                  For investors
                </p>
                <h3 className="text-lg font-bold text-primary mb-2">{step.title}</h3>
                <p className="text-sm text-neutral/70">{step.body}</p>
              </div>
            ))}
          </div>

          <div className="card-elevated max-w-3xl mx-auto p-6 md:p-8 text-center md:text-left">
            <p className="text-xs uppercase tracking-widest text-copper font-semibold mb-1">
              For regional center representatives
            </p>
            <h3 className="text-lg font-bold text-primary mb-2">Manage your project listings</h3>
            <p className="text-sm text-neutral/70 mb-5 leading-relaxed">
              Sign in, verify that you represent your regional center, then claim and edit your
              RC&apos;s project listings to keep investors informed.
            </p>
            <div className="flex flex-wrap gap-3 justify-center md:justify-start">
              <Link href="/login" className="btn btn-secondary btn-sm rounded-full">
                Sign in as RC representative
              </Link>
              <Link href="/about" className="btn btn-ghost btn-sm rounded-full">
                Learn more
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-14 text-center">
        <div className="card-elevated max-w-2xl mx-auto p-10">
        <h2 className="text-2xl font-bold text-primary mb-3">Explore Regional Centers</h2>
        <p className="text-neutral/70 mb-6 max-w-xl mx-auto">
          Browse USCIS-approved regional centers and see their active projects
        </p>
        <Link href="/rc" className="btn btn-primary rounded-full">
          Browse Regional Centers
        </Link>
        </div>
      </section>
    </div>
  );
}

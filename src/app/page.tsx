import Link from 'next/link';
import SearchBar from '@/components/SearchBar';
import ProjectCard from '@/components/ProjectCard';
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
      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 100-15 7.5 7.5 0 000 15z" />
      </svg>
    ),
  },
  {
    title: 'Vote on status',
    body: 'Share whether a project is still open for subscriptions — help keep listings current.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    title: 'Add what you know',
    body: 'Contribute factual project details so fellow investors can make informed decisions.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
      </svg>
    ),
  },
];

export default async function HomePage() {
  let stats = { projects: 0, investors: 0, votes: 0 };
  let recent: ProjectWithVotes[] = [];

  try {
    [stats, recent] = await Promise.all([getHomeStats(), getRecentProjects(6)]);
  } catch {
    // Supabase may be unconfigured during local setup
  }

  return (
    <div>
      <section className="bg-gradient-to-b from-base-200 to-base-100 border-b border-base-300">
        <div className="max-w-6xl mx-auto px-4 py-16 md:py-20 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-primary tracking-tight text-balance">
            The open directory of EB-5 projects
          </h1>
          <p className="mt-4 text-base md:text-lg text-neutral/70 max-w-2xl mx-auto">
            Search, compare, and contribute to a free, community-driven project directory
          </p>
          <div className="mt-8">
            <SearchBar large />
          </div>
          <div className="mt-10 flex flex-wrap justify-center gap-8 md:gap-16">
            <div>
              <p className="text-3xl font-bold text-primary">{stats.projects}</p>
              <p className="text-meta text-neutral/60 uppercase tracking-wide mt-1">Projects</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-primary">{stats.investors}</p>
              <p className="text-meta text-neutral/60 uppercase tracking-wide mt-1">Investors</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-primary">{stats.votes}</p>
              <p className="text-meta text-neutral/60 uppercase tracking-wide mt-1">Votes</p>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-wrap gap-2 justify-center">
          {QUICK_FILTERS.map((f) => (
            <Link
              key={f.href}
              href={f.href}
              className="btn btn-outline btn-sm rounded-full transition-all duration-150"
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
          <p className="text-neutral/60 py-8 text-center">
            No projects yet. Be the first to{' '}
            <Link href="/projects/new" className="link link-secondary">
              add a project
            </Link>
            .
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recent.map((p) => (
              <ProjectCard key={p.id} project={p} showVoteSummary={false} />
            ))}
          </div>
        )}
      </section>

      <section className="bg-base-200 mt-6">
        <div className="max-w-6xl mx-auto px-4 py-14">
          <h2 className="text-2xl font-bold text-primary text-center mb-10">How it works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {STEPS.map((step, i) => (
              <div key={step.title} className="text-center md:text-left">
                <div className="inline-flex items-center justify-center text-secondary mb-3">
                  {step.icon}
                </div>
                <p className="text-meta text-accent font-semibold mb-1">Step {i + 1}</p>
                <h3 className="font-bold text-lg text-primary mb-2">{step.title}</h3>
                <p className="text-sm text-neutral/70">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

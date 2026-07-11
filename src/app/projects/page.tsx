import { Suspense } from 'react';
import { AddProjectLink } from '@/components/AuthGatedLinks';
import SearchBar from '@/components/SearchBar';
import FilterPanel from '@/components/FilterPanel';
import PageHero from '@/components/PageHero';
import ProjectsClient from './ProjectsClient';
import { getFilteredProjects, getHomeStats, type ProjectFilters } from '@/lib/projects';
import { PAGE_SIZE } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Browse Projects',
};

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: ProjectFilters;
}) {
  const [{ projects, total, page }, stats] = await Promise.all([
    getFilteredProjects(searchParams).catch(() => ({
      projects: [],
      total: 0,
      page: 1,
    })),
    getHomeStats().catch(() => ({ projects: 0, regionalCenters: 0, investors: 0, confirmations: 0 })),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <PageHero
        eyebrow="Directory"
        title="Browse Projects"
        subtitle="Search EB-5 regional center projects by name, location, TEA designation, and status."
      >
        <AddProjectLink className="btn btn-accent text-accent-content rounded-full shadow-soft hover:shadow-glow" data-add-project-hint="primary">
          + Add Project
        </AddProjectLink>
      </PageHero>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <Suspense fallback={<div className="skeleton-shimmer h-12 w-full mb-6" />}>
          <SearchBar initialQuery={searchParams.q || ''} className="mb-6" large />
        </Suspense>

        <div className="flex flex-col md:flex-row gap-6">
          <Suspense fallback={<div className="hidden md:block w-60 skeleton-shimmer h-96" />}>
            <FilterPanel />
          </Suspense>

          <div className="flex-1 min-w-0">
            <ProjectsClient
              projects={projects}
              total={total}
              directoryTotal={stats.projects}
              page={page}
              totalPages={totalPages}
              filters={searchParams}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

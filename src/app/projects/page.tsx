import { Suspense } from 'react';
import SearchBar from '@/components/SearchBar';
import FilterPanel from '@/components/FilterPanel';
import ProjectsClient from './ProjectsClient';
import { getFilteredProjects, type ProjectFilters } from '@/lib/projects';
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
  const { projects, total, page } = await getFilteredProjects(searchParams).catch(() => ({
    projects: [],
    total: 0,
    page: 1,
  }));

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-primary mb-4">Browse Projects</h1>
      <Suspense fallback={<div className="skeleton-shimmer h-12 w-full mb-6" />}>
        <SearchBar initialQuery={searchParams.q || ''} className="mb-6" />
      </Suspense>

      <div className="flex flex-col md:flex-row gap-6">
        <Suspense fallback={<div className="hidden md:block w-60 skeleton-shimmer h-96" />}>
          <FilterPanel />
        </Suspense>

        <div className="flex-1 min-w-0">
          <ProjectsClient
            projects={projects}
            total={total}
            page={page}
            totalPages={totalPages}
            filters={searchParams}
          />
        </div>
      </div>
    </div>
  );
}

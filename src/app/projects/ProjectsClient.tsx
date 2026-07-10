'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ProjectCard from '@/components/ProjectCard';
import type { ProjectWithVotes } from '@/lib/types';
import type { ProjectFilters } from '@/lib/projects';

interface ProjectsClientProps {
  projects: ProjectWithVotes[];
  total: number;
  page: number;
  totalPages: number;
  filters: ProjectFilters;
}

function buildQuery(filters: ProjectFilters, overrides: Record<string, string | undefined> = {}) {
  const params = new URLSearchParams();
  const merged = { ...filters, ...overrides };
  Object.entries(merged).forEach(([k, v]) => {
    if (v) params.set(k, v);
  });
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export default function ProjectsClient({
  projects,
  total,
  page,
  totalPages,
  filters,
}: ProjectsClientProps) {
  const router = useRouter();

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <p className="text-sm text-neutral/70">
          Showing <span className="font-semibold text-neutral">{total}</span> project
          {total === 1 ? '' : 's'}
        </p>
        <label className="flex items-center gap-2 text-sm">
          <span className="text-neutral/60">Sort</span>
          <select
            className="select select-bordered select-sm"
            value={filters.sort || 'newest'}
            onChange={(e) => {
              router.push(`/projects${buildQuery(filters, { sort: e.target.value, page: undefined })}`);
            }}
          >
            <option value="newest">Newest first</option>
            <option value="votes">Most votes</option>
            <option value="az">A–Z</option>
            <option value="amount">Investment amount</option>
          </select>
        </label>
      </div>

      {projects.length === 0 ? (
        <div className="py-16 text-center text-neutral/60">
          <p>No projects match your filters. Try broadening your search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {projects.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-center gap-2 mt-8">
          {page > 1 && (
            <Link
              href={`/projects${buildQuery(filters, { page: String(page - 1) })}`}
              className="btn btn-outline btn-sm transition-all duration-150"
            >
              Previous
            </Link>
          )}
          <span className="text-sm text-neutral/60 px-2">
            Page {page} of {totalPages}
          </span>
          {page < totalPages && (
            <Link
              href={`/projects${buildQuery(filters, { page: String(page + 1) })}`}
              className="btn btn-primary btn-sm transition-all duration-150"
            >
              Load more
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

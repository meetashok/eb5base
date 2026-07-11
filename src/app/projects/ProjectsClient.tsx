'use client';

import Link from 'next/link';
import { AddProjectLink } from '@/components/AuthGatedLinks';
import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import ProjectCard from '@/components/ProjectCard';
import type { ProjectWithVotes } from '@/lib/types';
import type { ProjectFilters } from '@/lib/projects';
import {
  F956_OPTIONS,
  PROJECT_TYPES,
  SUBSCRIPTION_OPTIONS,
  TEA_OPTIONS,
  US_STATES,
} from '@/lib/constants';

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

function parseList(value?: string): string[] {
  if (!value) return [];
  return value.split(',').filter(Boolean);
}

const AMOUNT_LABELS: Record<string, string> = {
  under_800k: 'Under $800K',
  '800k': '$800K',
  '800k_1050k': '$800K–$1.05M',
  over_1050k: 'Over $1.05M',
};

const FILTER_CHIP_LABELS: Record<string, string> = {
  rural: 'Rural',
  hua: 'HUA',
  open: 'Open Subscriptions',
  approved: 'I-956F Approved',
};

export default function ProjectsClient({
  projects,
  total,
  page,
  totalPages,
  filters,
}: ProjectsClientProps) {
  const router = useRouter();

  const activeChips = useMemo(() => {
    const chips: { key: string; value: string; label: string }[] = [];

    parseList(filters.tea).forEach((v) => {
      chips.push({
        key: 'tea',
        value: v,
        label: TEA_OPTIONS.find((o) => o.value === v)?.label || v,
      });
    });
    parseList(filters.f956).forEach((v) => {
      chips.push({
        key: 'f956',
        value: v,
        label: F956_OPTIONS.find((o) => o.value === v)?.label || v,
      });
    });
    parseList(filters.subscription).forEach((v) => {
      chips.push({
        key: 'subscription',
        value: v,
        label: SUBSCRIPTION_OPTIONS.find((o) => o.value === v)?.label || v,
      });
    });
    parseList(filters.type).forEach((v) => {
      chips.push({
        key: 'type',
        value: v,
        label: PROJECT_TYPES.find((o) => o.value === v)?.label || v,
      });
    });
    if (filters.state) {
      chips.push({
        key: 'state',
        value: filters.state,
        label: US_STATES.find((s) => s.code === filters.state)?.name || filters.state,
      });
    }
    if (filters.rc) {
      chips.push({
        key: 'rc',
        value: filters.rc,
        label: filters.rc_name || 'Regional Center',
      });
    }
    if (filters.amount) {
      chips.push({
        key: 'amount',
        value: filters.amount,
        label: AMOUNT_LABELS[filters.amount] || filters.amount,
      });
    }
    if (filters.filter) {
      chips.push({
        key: 'filter',
        value: filters.filter,
        label: FILTER_CHIP_LABELS[filters.filter] || filters.filter,
      });
    }
    return chips;
  }, [filters]);

  function removeChip(key: string, value: string) {
    const next: ProjectFilters = { ...filters };
    delete next.page;

    if (['tea', 'f956', 'subscription', 'type'].includes(key)) {
      const current = filters[key as 'tea' | 'f956' | 'subscription' | 'type'];
      const list = parseList(current).filter((v) => v !== value);
      if (list.length) {
        next[key as 'tea' | 'f956' | 'subscription' | 'type'] = list.join(',');
      } else {
        delete next[key as 'tea' | 'f956' | 'subscription' | 'type'];
      }
    } else if (key === 'state') {
      delete next.state;
    } else if (key === 'amount') {
      delete next.amount;
    } else if (key === 'filter') {
      delete next.filter;
    } else if (key === 'rc') {
      delete next.rc;
      delete next.rc_name;
    }

    router.push(`/projects${buildQuery(next)}`);
  }

  function clearAll() {
    const next: ProjectFilters = {};
    if (filters.q) next.q = filters.q;
    if (filters.sort) next.sort = filters.sort;
    router.push(`/projects${buildQuery(next)}`);
  }

  return (
    <div>
      {activeChips.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4 items-center">
          {activeChips.map((chip) => (
            <span
              key={`${chip.key}-${chip.value}`}
              className="badge bg-secondary/15 text-secondary border border-secondary/30 gap-1 rounded-full"
            >
              {chip.label}
              <button
                type="button"
                className="ml-0.5"
                aria-label={`Remove ${chip.label}`}
                onClick={() => removeChip(chip.key, chip.value)}
              >
                ✕
              </button>
            </span>
          ))}
          <button
            type="button"
            className="text-sm text-secondary hover:underline"
            onClick={clearAll}
          >
            Clear all
          </button>
        </div>
      )}

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
              router.push(
                `/projects${buildQuery(filters, { sort: e.target.value, page: undefined })}`
              );
            }}
          >
            <option value="newest">Newest first</option>
            <option value="most_confirmed">Most confirmed status</option>
            <option value="amount_low">Investment: low to high</option>
            <option value="amount_high">Investment: high to low</option>
            <option value="alpha">Alphabetical</option>
          </select>
        </label>
      </div>

      {projects.length === 0 ? (
        <div className="card-elevated py-16 text-center px-6">
          <h2 className="text-lg font-bold text-neutral/80">No projects match your filters</h2>
          <p className="text-sm text-neutral/50 mt-2 mb-4">
            Try broadening your search, or add a project the community is missing.
          </p>
          <AddProjectLink className="btn btn-primary btn-sm rounded-full">
            + Add Project
          </AddProjectLink>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {projects.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
          {projects.length < 3 && (
            <div className="card-elevated border-dashed border-2 border-copper/30">
              <div className="p-8 items-center text-center flex flex-col">
                <h3 className="font-bold text-neutral/80">Know a project not listed here?</h3>
                <p className="text-sm text-neutral/50 mt-1">
                  Help the community by adding it to the directory
                </p>
                <AddProjectLink className="btn btn-primary btn-sm rounded-full mt-3">
                  + Add Project
                </AddProjectLink>
              </div>
            </div>
          )}
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

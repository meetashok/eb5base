import type { I485ViewId } from '@/components/analysis/I485ViewBar';

/** Explorer chart views (excludes the Data tab). */
export type I485ExplorerViewId = I485ViewId;

export type I485TabId = I485ExplorerViewId | 'data';

export const I485_TAB_PATHS: Record<I485TabId, string> = {
  snapshot: '/analysis/i485/inventory',
  cohort: '/analysis/i485/priority-date',
  compare: '/analysis/i485/compare',
  data: '/analysis/i485/data',
};

export const I485_DEFAULT_PATH = I485_TAB_PATHS.snapshot;

export function i485TabFromPathname(pathname: string): I485TabId | null {
  const normalized = pathname.replace(/\/$/, '') || '/';
  for (const [id, path] of Object.entries(I485_TAB_PATHS) as [I485TabId, string][]) {
    if (normalized === path) return id;
  }
  if (normalized === '/analysis/i485') return 'snapshot';
  return null;
}

export function pathForI485View(view: I485ExplorerViewId): string {
  return I485_TAB_PATHS[view];
}

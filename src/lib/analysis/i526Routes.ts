export type I526TabId = 'trend' | 'throughput' | 'data';

export const I526_TAB_PATHS: Record<I526TabId, string> = {
  trend: '/analysis/i526/trend',
  throughput: '/analysis/i526/throughput',
  data: '/analysis/i526/data',
};

export const I526_DEFAULT_PATH: string = I526_TAB_PATHS.trend;

export function i526TabFromPathname(pathname: string): I526TabId | null {
  const normalized = pathname.replace(/\/$/, '') || '/';
  for (const [id, path] of Object.entries(I526_TAB_PATHS) as [I526TabId, string][]) {
    if (normalized === path) return id;
  }
  if (normalized === '/analysis/i526') return 'trend';
  return null;
}

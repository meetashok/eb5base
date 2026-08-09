export const NPRM_TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'themes', label: 'Themes' },
  { id: 'comments', label: 'Comments' },
  { id: 'write', label: 'Write' },
  { id: 'about', label: 'About' },
] as const;

export type NprmTabId = (typeof NPRM_TABS)[number]['id'];

export function isNprmTabId(v: string | null | undefined): v is NprmTabId {
  return !!v && NPRM_TABS.some((t) => t.id === v);
}

export function nprmTabHref(id: NprmTabId): string {
  return id === 'overview' ? '/nprm' : `/nprm/${id}`;
}

export function tabFromPathname(pathname: string | null): NprmTabId {
  if (!pathname) return 'overview';
  if (pathname === '/nprm' || pathname === '/nprm/') return 'overview';
  const m = pathname.match(/^\/nprm\/([^/]+)\/?$/);
  if (m && isNprmTabId(m[1])) return m[1];
  return 'overview';
}

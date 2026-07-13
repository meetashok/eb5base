import { createClient } from '@/lib/supabase-server';
import type { ProjectWithVotes } from '@/lib/types';
import { F956_FILED_STATUSES, PAGE_SIZE } from '@/lib/constants';
import { ensureSlugsForProjects } from '@/lib/ensure-slugs';

/** Prefer brand join; fall back to plain select if embed fails (pre-migration DB) */
const LIST_SELECT =
  '*, cover_image:project_images!cover_image_id(id, url), rc_brands!brand_id(id, name, website_url, slug), regional_centers(id, name, uscis_rc_id, website_url)';
const LIST_SELECT_NO_IMAGES =
  '*, rc_brands!brand_id(id, name, website_url, slug), regional_centers(id, name, uscis_rc_id, website_url)';
const LIST_SELECT_LEGACY = '*, regional_centers(id, name, uscis_rc_id, website_url)';

type VoteSummary = {
  count: number;
  last_status: string | null;
  last_at: string | null;
  open_7d: number;
  closed_7d: number;
};

function emptyVoteSummary(): VoteSummary {
  return { count: 0, last_status: null, last_at: null, open_7d: 0, closed_7d: 0 };
}

function finalizeVoteSummary(summary: VoteSummary) {
  const confirmations_7d = summary.open_7d + summary.closed_7d;
  const consensus_7d =
    confirmations_7d === 0
      ? null
      : summary.open_7d >= summary.closed_7d
        ? ('open' as const)
        : ('closed' as const);
  const open_pct_7d =
    confirmations_7d === 0 ? null : Math.round((summary.open_7d / confirmations_7d) * 100);
  return { ...summary, confirmations_7d, consensus_7d, open_pct_7d };
}

function withCounts(
  projects: ProjectWithVotes[],
  voteMap?: Map<string, VoteSummary>
): ProjectWithVotes[] {
  return projects.map((p) => {
    const v = voteMap?.get(p.id);
    const count = v?.count ?? p.project_votes?.[0]?.count ?? 0;
    const finalized = v ? finalizeVoteSummary(v) : finalizeVoteSummary(emptyVoteSummary());
    return {
      ...p,
      vote_count: count,
      confirmation_count: count,
      last_vote_status: v?.last_status || null,
      last_vote_at: v?.last_at || null,
      confirmations_7d: finalized.confirmations_7d,
      open_7d: finalized.open_7d,
      closed_7d: finalized.closed_7d,
      consensus_7d: finalized.consensus_7d,
      open_pct_7d: finalized.open_pct_7d,
    };
  });
}

async function attachVoteSummaries(projects: ProjectWithVotes[]) {
  if (!projects.length) return projects;
  const supabase = createClient();
  const ids = projects.map((p) => p.id);
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const { data: votes } = await supabase
    .from('project_votes')
    .select('project_id, subscription_status, created_at')
    .in('project_id', ids)
    .order('created_at', { ascending: false });

  const byProject = new Map<string, VoteSummary>();
  for (const v of votes || []) {
    const cur = byProject.get(v.project_id) || emptyVoteSummary();
    cur.count += 1;
    if (!cur.last_at) {
      cur.last_status = v.subscription_status;
      cur.last_at = v.created_at;
    }
    if (new Date(v.created_at).getTime() >= sevenDaysAgo) {
      if (v.subscription_status === 'open') cur.open_7d += 1;
      else if (v.subscription_status === 'closed') cur.closed_7d += 1;
    }
    byProject.set(v.project_id, cur);
  }
  return withCounts(projects, byProject);
}

export async function getHomeStats() {
  const supabase = createClient();
  const [{ count: projects }, brandsRes, legacyRcRes, { count: investors }, { count: votes }] =
    await Promise.all([
      supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .is('merged_into', null),
      supabase.from('rc_brands').select('*', { count: 'exact', head: true }),
      supabase.from('regional_centers').select('*', { count: 'exact', head: true }),
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('project_votes').select('*', { count: 'exact', head: true }),
    ]);

  const regionalCenters =
    brandsRes.error != null
      ? legacyRcRes.count || 0
      : brandsRes.count || 0;

  return {
    projects: projects || 0,
    regionalCenters,
    investors: investors || 0,
    confirmations: votes || 0,
  };
}

export async function getRecentProjects(limit = 6): Promise<ProjectWithVotes[]> {
  const supabase = createClient();

  let { data, error } = await supabase
    .from('projects')
    .select(LIST_SELECT)
    .is('merged_into', null)
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('getRecentProjects brand select failed:', error.message);
    ({ data, error } = await supabase
      .from('projects')
      .select(LIST_SELECT)
      .is('merged_into', null)
      .order('created_at', { ascending: false })
      .limit(limit));
  }

  if (error) {
    console.error('getRecentProjects cover image select failed:', error.message);
    ({ data, error } = await supabase
      .from('projects')
      .select(LIST_SELECT_NO_IMAGES)
      .is('merged_into', null)
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(limit));
  }

  if (error) {
    console.error('getRecentProjects retry without status failed:', error.message);
    ({ data, error } = await supabase
      .from('projects')
      .select(LIST_SELECT_LEGACY)
      .is('merged_into', null)
      .order('created_at', { ascending: false })
      .limit(limit));
  }

  if (error) {
    console.error('getRecentProjects joined select failed:', error.message);
    const fallback = await supabase
      .from('projects')
      .select('*')
      .is('merged_into', null)
      .order('created_at', { ascending: false })
      .limit(limit);
    data = fallback.data;
    error = fallback.error;
  }

  if (error || !data) {
    console.error('getRecentProjects failed:', error?.message);
    return [];
  }

  return ensureSlugsForProjects(await attachVoteSummaries((data as unknown as ProjectWithVotes[]) || []));
}

function parseList(value: string | undefined): string[] {
  if (!value) return [];
  return value.split(',').filter(Boolean);
}

function expandF956FilterValues(values: string[]): string[] {
  const expanded = new Set<string>();
  for (const v of values) {
    if (v === 'filed') {
      F956_FILED_STATUSES.forEach((s) => expanded.add(s));
    } else {
      expanded.add(v);
    }
  }
  return Array.from(expanded);
}

export interface ProjectFilters {
  q?: string;
  tea?: string;
  f956?: string;
  subscription?: string;
  type?: string;
  state?: string;
  amount?: string;
  rc?: string;
  rc_name?: string;
  rc_verified?: string;
  filter?: string;
  sort?: string;
  page?: string;
}

export async function getFilteredProjects(filters: ProjectFilters) {
  const supabase = createClient();
  const page = Math.max(1, parseInt(filters.page || '1', 10) || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let tea = parseList(filters.tea);
  let f956 = expandF956FilterValues(parseList(filters.f956));
  let subscription = parseList(filters.subscription);
  if (filters.filter === 'rural') tea = Array.from(new Set([...tea, 'rural']));
  if (filters.filter === 'hua') tea = Array.from(new Set([...tea, 'hua']));
  if (filters.filter === 'open')
    subscription = Array.from(new Set([...subscription, 'open']));
  if (filters.filter === 'approved') f956 = Array.from(new Set([...f956, 'approved']));

  let brandIdsFromSearch: string[] = [];
  let rcIdsFromSearch: string[] = [];
  if (filters.q?.trim() && !filters.rc) {
    const q = filters.q.trim();
    const [{ data: brands }, { data: rcs }] = await Promise.all([
      supabase.from('rc_brands').select('id').ilike('name', `%${q}%`).limit(50),
      supabase.from('regional_centers').select('id').ilike('name', `%${q}%`).limit(50),
    ]);
    brandIdsFromSearch = (brands || []).map((r) => r.id);
    rcIdsFromSearch = (rcs || []).map((r) => r.id);
  }

  function applyFilters(select: string, requireApproved = true) {
    let query = supabase
      .from('projects')
      .select(select, { count: 'exact' })
      .is('merged_into', null);

    if (requireApproved) {
      query = query.eq('status', 'approved');
    }

    // filters.rc may be a brand id (preferred) or legacy rc entity id
    if (filters.rc) {
      query = query.or(`brand_id.eq.${filters.rc},rc_id.eq.${filters.rc}`);
    }

    if (filters.q?.trim()) {
      const q = filters.q.trim();
      const parts = [
        `name.ilike.%${q}%`,
        `location_city.ilike.%${q}%`,
        `location_state.ilike.%${q}%`,
      ];
      if (brandIdsFromSearch.length) {
        parts.push(`brand_id.in.(${brandIdsFromSearch.join(',')})`);
      }
      if (rcIdsFromSearch.length) {
        parts.push(`rc_id.in.(${rcIdsFromSearch.join(',')})`);
      }
      query = query.or(parts.join(','));
    }

    for (const t of tea) query = query.contains('tea_designations', [t]);
    for (const t of parseList(filters.type)) query = query.contains('project_type', [t]);
    if (f956.length) query = query.in('f956_status', f956);
    if (subscription.length) query = query.in('subscription_status', subscription);
    if (filters.state) query = query.eq('location_state', filters.state);

    if (filters.rc_verified === 'yes' || filters.rc_verified === '1') {
      query = query.not('rc_verified_at', 'is', null);
    }

    const sort = filters.sort || 'newest';
    if (sort === 'az' || sort === 'alpha') query = query.order('name', { ascending: true });
    else query = query.order('created_at', { ascending: false });

    return query.range(from, to);
  }

  let { data, count, error } = await applyFilters(LIST_SELECT);

  if (error) {
    console.error('getFilteredProjects brand select failed:', error.message);
    ({ data, count, error } = await applyFilters(LIST_SELECT_NO_IMAGES));
  }

  if (error) {
    console.error('getFilteredProjects cover image select failed:', error.message);
    ({ data, count, error } = await applyFilters(LIST_SELECT_LEGACY));
  }

  if (error) {
    console.error('getFilteredProjects joined select failed:', error.message);
    ({ data, count, error } = await applyFilters('*'));
  }

  // Pre-migration DBs may not have status yet
  if (error) {
    console.error('getFilteredProjects approved filter failed:', error.message);
    ({ data, count, error } = await applyFilters(LIST_SELECT, false));
  }

  if (error) {
    console.error('getFilteredProjects failed:', error);
    return { projects: [] as ProjectWithVotes[], total: 0, page };
  }

  let projects = await ensureSlugsForProjects(
    await attachVoteSummaries(((data as unknown as ProjectWithVotes[]) || []))
  );

  if (filters.sort === 'votes' || filters.sort === 'most_confirmed') {
    projects = [...projects].sort(
      (a, b) => (b.confirmation_count || 0) - (a.confirmation_count || 0)
    );
  }

  return { projects, total: count || 0, page };
}

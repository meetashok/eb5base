import { createClient } from '@/lib/supabase-server';
import type { ProjectWithVotes } from '@/lib/types';
import { PROJECT_SELECT } from '@/lib/types';
import { PAGE_SIZE } from '@/lib/constants';

export async function getHomeStats() {
  const supabase = createClient();
  const [{ count: projects }, { count: regionalCenters }, { count: investors }, { count: votes }] =
    await Promise.all([
      supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .is('merged_into', null),
      supabase.from('regional_centers').select('*', { count: 'exact', head: true }),
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('project_votes').select('*', { count: 'exact', head: true }),
    ]);
  return {
    projects: projects || 0,
    regionalCenters: regionalCenters || 0,
    investors: investors || 0,
    confirmations: votes || 0,
  };
}

export async function getRecentProjects(limit = 6): Promise<ProjectWithVotes[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from('projects')
    .select(PROJECT_SELECT)
    .is('merged_into', null)
    .order('created_at', { ascending: false })
    .limit(limit);
  return ((data as ProjectWithVotes[]) || []).map((p) => ({
    ...p,
    confirmation_count: p.project_votes?.[0]?.count ?? 0,
    vote_count: p.project_votes?.[0]?.count ?? 0,
  }));
}

function parseList(value: string | undefined): string[] {
  if (!value) return [];
  return value.split(',').filter(Boolean);
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
  let f956 = parseList(filters.f956);
  let subscription = parseList(filters.subscription);
  if (filters.filter === 'rural') tea = Array.from(new Set([...tea, 'rural']));
  if (filters.filter === 'hua') tea = Array.from(new Set([...tea, 'hua']));
  if (filters.filter === 'open')
    subscription = Array.from(new Set([...subscription, 'open']));
  if (filters.filter === 'approved') f956 = Array.from(new Set([...f956, 'approved']));

  let rcIdsFromSearch: string[] = [];
  if (filters.q?.trim() && !filters.rc) {
    const { data: matchingRcs } = await supabase
      .from('regional_centers')
      .select('id')
      .ilike('name', `%${filters.q.trim()}%`)
      .limit(50);
    rcIdsFromSearch = (matchingRcs || []).map((r) => r.id);
  }

  let query = supabase
    .from('projects')
    .select(PROJECT_SELECT, { count: 'exact' })
    .is('merged_into', null);

  if (filters.rc) {
    query = query.eq('rc_id', filters.rc);
  }

  if (filters.q?.trim()) {
    const q = filters.q.trim();
    if (rcIdsFromSearch.length) {
      query = query.or(
        `name.ilike.%${q}%,location_city.ilike.%${q}%,location_state.ilike.%${q}%,rc_id.in.(${rcIdsFromSearch.join(',')})`
      );
    } else {
      query = query.or(
        `name.ilike.%${q}%,location_city.ilike.%${q}%,location_state.ilike.%${q}%`
      );
    }
  }

  for (const t of tea) {
    query = query.contains('tea_designations', [t]);
  }
  for (const t of parseList(filters.type)) {
    query = query.contains('project_type', [t]);
  }
  if (f956.length) query = query.in('f956_status', f956);
  if (subscription.length) query = query.in('subscription_status', subscription);
  if (filters.state) query = query.eq('location_state', filters.state);

  if (filters.amount === 'under_800k') query = query.lt('investment_amount', 800000);
  if (filters.amount === '800k') query = query.eq('investment_amount', 800000);
  if (filters.amount === '800k_1050k')
    query = query.gte('investment_amount', 800000).lte('investment_amount', 1050000);
  if (filters.amount === 'over_1050k') query = query.gt('investment_amount', 1050000);

  const sort = filters.sort || 'newest';
  if (sort === 'az') query = query.order('name', { ascending: true });
  else if (sort === 'amount')
    query = query.order('investment_amount', { ascending: true, nullsFirst: false });
  else query = query.order('created_at', { ascending: false });

  const { data, count, error } = await query.range(from, to);
  if (error) {
    console.error('getFilteredProjects', error);
    return { projects: [] as ProjectWithVotes[], total: 0, page };
  }

  let projects = (data as ProjectWithVotes[]) || [];

  if (projects.length) {
    const ids = projects.map((p) => p.id);
    const { data: votes } = await supabase
      .from('project_votes')
      .select('project_id, subscription_status, created_at')
      .in('project_id', ids)
      .order('created_at', { ascending: false });

    const byProject = new Map<
      string,
      { count: number; last_status: string | null; last_at: string | null }
    >();
    for (const v of votes || []) {
      const cur = byProject.get(v.project_id) || {
        count: 0,
        last_status: null,
        last_at: null,
      };
      cur.count += 1;
      if (!cur.last_at) {
        cur.last_status = v.subscription_status;
        cur.last_at = v.created_at;
      }
      byProject.set(v.project_id, cur);
    }

    projects = projects.map((p) => {
      const v = byProject.get(p.id);
      const countFromJoin = p.project_votes?.[0]?.count;
      return {
        ...p,
        vote_count: countFromJoin ?? v?.count ?? 0,
        confirmation_count: countFromJoin ?? v?.count ?? 0,
        last_vote_status: v?.last_status || null,
        last_vote_at: v?.last_at || null,
      };
    });

    if (sort === 'votes') {
      projects = [...projects].sort(
        (a, b) => (b.confirmation_count || 0) - (a.confirmation_count || 0)
      );
    }
  }

  return { projects, total: count || 0, page };
}

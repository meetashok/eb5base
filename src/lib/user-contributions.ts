import type { SupabaseClient } from '@supabase/supabase-js';
import {
  duplicateStatusBadgeClass,
  duplicateStatusLabel,
  statusBadgeClass,
  statusLabel,
} from '@/lib/approvals';
import { brandPath, projectEditPath, projectPath } from '@/lib/slugs';
import type {
  ContentSubmission,
  DuplicateReportGroup,
  Project,
  ProjectVote,
  RcBrand,
} from '@/lib/types';
import { PROJECT_SELECT } from '@/lib/types';
import { formatDate } from '@/lib/utils';

export type TimelineEventKind =
  | 'confirmation'
  | 'project_added'
  | 'project_claimed'
  | 'submission'
  | 'duplicate'
  | 'brand';

export type TimelineFilter = 'all' | 'confirmations' | 'projects' | 'reports';

export interface TimelineEvent {
  id: string;
  kind: TimelineEventKind;
  title: string;
  subtitle: string;
  created_at: string;
  href?: string | null;
  status?: string | null;
  statusClass?: string;
  statusText?: string;
  rejection_reason?: string | null;
}

interface ConfirmationRow extends ProjectVote {
  projects?: {
    id: string;
    name: string;
    slug?: string | null;
    brand_id?: string | null;
    rc_brands?: { id: string; slug?: string | null } | null;
  } | null;
}

interface SubmissionRow extends ContentSubmission {
  title: string;
}

interface DuplicateReportRow extends DuplicateReportGroup {
  title: string;
  duplicate_titles: string[];
}

export interface UserContributions {
  confirmations: ConfirmationRow[];
  projects: Project[];
  claimedProjects: Project[];
  submissions: SubmissionRow[];
  duplicateReports: DuplicateReportRow[];
  brands: RcBrand[];
}

export async function fetchUserContributions(
  supabase: SupabaseClient,
  userId: string
): Promise<UserContributions> {
  const [
    { data: votes },
    { data: myProjects },
    brandsRes,
    subsRes,
    dupRes,
    claimedRes,
  ] = await Promise.all([
    supabase
      .from('project_votes')
      .select('*, projects:project_id(id, name, slug, brand_id, rc_brands!brand_id(id, slug))')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }),
    supabase
      .from('projects')
      .select(PROJECT_SELECT)
      .eq('added_by', userId)
      .is('merged_into', null)
      .order('created_at', { ascending: false }),
    supabase
      .from('rc_brands')
      .select('*')
      .eq('added_by', userId)
      .order('created_at', { ascending: false }),
    supabase
      .from('content_submissions')
      .select('*')
      .eq('submitted_by', userId)
      .order('created_at', { ascending: false }),
    supabase
      .from('duplicate_report_groups')
      .select('*')
      .eq('reported_by', userId)
      .order('created_at', { ascending: false }),
    supabase
      .from('projects')
      .select(PROJECT_SELECT)
      .eq('claimed_by', userId)
      .is('merged_into', null)
      .order('claimed_at', { ascending: false }),
  ]);

  const projects = (myProjects as Project[]) || [];
  const brands = brandsRes.error ? [] : ((brandsRes.data as RcBrand[]) || []);

  const subRows = subsRes.error ? [] : ((subsRes.data as ContentSubmission[]) || []);
  const submissions: SubmissionRow[] = [];
  for (const s of subRows) {
    let title =
      typeof s.payload?.name === 'string'
        ? s.payload.name
        : `${s.entity_type} ${s.entity_id.slice(0, 8)}`;
    if (s.entity_type === 'project') {
      const match = projects.find((x) => x.id === s.entity_id);
      if (match?.name) title = match.name;
    } else {
      const match = brands.find((x) => x.id === s.entity_id);
      if (match?.name) title = match.name;
    }
    submissions.push({ ...s, title });
  }

  const dupRows = dupRes.error ? [] : ((dupRes.data as DuplicateReportGroup[]) || []);
  const duplicateReports: DuplicateReportRow[] = [];
  for (const d of dupRows) {
    const table = d.entity_type === 'project' ? 'projects' : 'rc_brands';
    const { data: reported } = await supabase
      .from(table)
      .select('name')
      .eq('id', d.reported_entity_id)
      .maybeSingle();
    const duplicateTitles: string[] = [];
    for (const dupId of d.duplicate_entity_ids || []) {
      const { data: dup } = await supabase
        .from(table)
        .select('name')
        .eq('id', dupId)
        .maybeSingle();
      if (dup?.name) duplicateTitles.push(dup.name);
    }
    duplicateReports.push({
      ...d,
      title: reported?.name || d.reported_entity_id.slice(0, 8),
      duplicate_titles: duplicateTitles,
    });
  }

  return {
    confirmations: (votes as ConfirmationRow[]) || [],
    projects,
    claimedProjects: (claimedRes.data as Project[]) || [],
    submissions,
    duplicateReports,
    brands,
  };
}

export function buildTimelineEvents(data: UserContributions): TimelineEvent[] {
  const rows: TimelineEvent[] = [];
  const submissionProjectCreates = new Set(
    data.submissions
      .filter((s) => s.entity_type === 'project' && s.action === 'create')
      .map((s) => s.entity_id)
  );

  for (const v of data.confirmations) {
    const projectName = v.projects?.name || 'Project';
    rows.push({
      id: `vote-${v.id}`,
      kind: 'confirmation',
      title: projectName,
      subtitle: `Confirmed ${v.subscription_status === 'open' ? 'Open' : 'Closed'} · ${formatDate(v.created_at)}`,
      created_at: v.created_at,
      href: v.projects ? projectPath(v.projects) : `/projects/${v.project_id}`,
    });
  }

  for (const p of data.projects) {
    if (submissionProjectCreates.has(p.id)) continue;
    rows.push({
      id: `project-${p.id}`,
      kind: 'project_added',
      title: p.name,
      subtitle: `Added project · ${formatDate(p.created_at)}`,
      created_at: p.created_at,
      href: projectPath(p),
      status: p.status,
      statusClass: statusBadgeClass(p.status),
      statusText: statusLabel(p.status),
      rejection_reason: p.rejection_reason,
    });
  }

  for (const p of data.claimedProjects) {
    rows.push({
      id: `claimed-${p.id}`,
      kind: 'project_claimed',
      title: p.name,
      subtitle: `Claimed project · ${p.claimed_at ? formatDate(p.claimed_at) : formatDate(p.created_at)}`,
      created_at: p.claimed_at || p.created_at,
      href: projectEditPath(p),
    });
  }

  for (const s of data.submissions) {
    rows.push({
      id: `sub-${s.id}`,
      kind: 'submission',
      title: s.title,
      subtitle: `${s.action === 'create' ? 'Created' : 'Edited'} ${
        s.entity_type === 'project' ? 'project' : 'regional center'
      } · ${formatDate(s.created_at)}`,
      created_at: s.created_at,
      status: s.status,
      statusClass: statusBadgeClass(s.status),
      statusText: statusLabel(s.status),
      rejection_reason: s.rejection_reason,
      href:
        s.entity_type === 'project'
          ? projectPath({ id: s.entity_id, slug: null })
          : brandPath({ id: s.entity_id, slug: null }),
    });
  }

  for (const b of data.brands) {
    if (
      data.submissions.some((s) => s.entity_type === 'rc_brand' && s.entity_id === b.id)
    ) {
      continue;
    }
    rows.push({
      id: `brand-${b.id}`,
      kind: 'brand',
      title: b.name,
      subtitle: `Regional center · ${formatDate(b.created_at)}`,
      created_at: b.created_at,
      status: b.status,
      statusClass: statusBadgeClass(b.status),
      statusText: statusLabel(b.status),
      rejection_reason: b.rejection_reason,
      href: brandPath(b),
    });
  }

  for (const d of data.duplicateReports) {
    rows.push({
      id: `dup-${d.id}`,
      kind: 'duplicate',
      title: d.title,
      subtitle: `Duplicate report${
        d.duplicate_titles.length ? `: ${d.duplicate_titles.join(', ')}` : ''
      } · ${formatDate(d.created_at)}`,
      created_at: d.created_at,
      status: d.status,
      statusClass: duplicateStatusBadgeClass(d.status),
      statusText: duplicateStatusLabel(d.status),
      href:
        d.entity_type === 'project'
          ? projectPath({ id: d.reported_entity_id, slug: null })
          : brandPath({ id: d.reported_entity_id, slug: null }),
    });
  }

  return rows.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

export function filterTimelineEvents(
  events: TimelineEvent[],
  filter: TimelineFilter
): TimelineEvent[] {
  if (filter === 'all') return events;
  if (filter === 'confirmations') {
    return events.filter((e) => e.kind === 'confirmation');
  }
  if (filter === 'projects') {
    return events.filter((e) =>
      ['project_added', 'project_claimed', 'submission', 'brand'].includes(e.kind)
    );
  }
  if (filter === 'reports') {
    return events.filter((e) => e.kind === 'duplicate');
  }
  return events;
}

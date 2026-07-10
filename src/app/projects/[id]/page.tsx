import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import TEATag from '@/components/TEATag';
import StatusBadge from '@/components/StatusBadge';
import ConfirmationWidget from '@/components/ConfirmationWidget';
import ReportDuplicateButton from './ReportDuplicateButton';
import type { Project, ProjectContact, Profile } from '@/lib/types';
import {
  formatCurrency,
  formatDate,
  f956Label,
  f956Variant,
  projectTypeLabel,
  subscriptionLabel,
  subscriptionVariant,
} from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data } = await supabase
    .from('projects')
    .select('name')
    .eq('id', params.id)
    .maybeSingle();
  return { title: data?.name || 'Project' };
}

async function loadProject(id: string): Promise<Project | null> {
  const supabase = createClient();

  // Prefer joined select; fall back if embeds fail (RLS / FK naming)
  const joined = await supabase
    .from('projects')
    .select(
      '*, regional_centers(id, name, uscis_rc_id, website_url), profiles!added_by(display_name, avatar_url)'
    )
    .eq('id', id)
    .maybeSingle();

  if (!joined.error && joined.data) {
    return joined.data as Project;
  }

  if (joined.error) {
    console.error('Project detail joined select failed:', joined.error.message);
  }

  const basic = await supabase.from('projects').select('*').eq('id', id).maybeSingle();
  if (basic.error || !basic.data) {
    if (basic.error) console.error('Project detail basic select failed:', basic.error.message);
    return null;
  }

  const project = basic.data as Project;

  if (project.rc_id) {
    const { data: rc } = await supabase
      .from('regional_centers')
      .select('id, name, uscis_rc_id, website_url')
      .eq('id', project.rc_id)
      .maybeSingle();
    project.regional_centers = rc;
  }

  if (project.added_by) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name, avatar_url')
      .eq('id', project.added_by)
      .maybeSingle();
    project.profiles = profile;
  }

  return project;
}

export default async function ProjectDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const project = await loadProject(params.id);

  if (!project) notFound();

  const p = project;
  if (p.merged_into) redirect(`/projects/${p.merged_into}`);

  const [{ data: contacts }, { data: auth }] = await Promise.all([
    supabase
      .from('project_contacts')
      .select('*')
      .eq('project_id', p.id)
      .order('created_at', { ascending: true }),
    supabase.auth.getUser(),
  ]);

  const userId = auth.user?.id ?? null;
  let canEdit = Boolean(userId && p.added_by === userId);

  if (!canEdit && userId && p.rc_id) {
    const { data: membership } = await supabase
      .from('rc_memberships')
      .select('id')
      .eq('rc_id', p.rc_id)
      .eq('user_id', userId)
      .eq('active', true)
      .not('verified_at', 'is', null)
      .is('revoked_at', null)
      .maybeSingle();
    canEdit = Boolean(membership);
  }

  const location = [p.location_city, p.location_state].filter(Boolean).join(', ');
  const adder = p.profiles as Pick<Profile, 'display_name'> | null | undefined;
  const rc = p.regional_centers;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="text-meta breadcrumbs mb-4">
        <ul>
          <li>
            <Link href="/">Home</Link>
          </li>
          <li>
            <Link href="/projects">Projects</Link>
          </li>
          <li>{p.name}</li>
        </ul>
      </div>

      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-primary">{p.name}</h1>
          <div className="flex flex-wrap gap-1.5 mt-3">
            {(p.tea_designations || []).map((tea) => (
              <TEATag key={tea} designation={tea} />
            ))}
            {p.f956_status && (
              <StatusBadge
                label={`956F ${f956Label(p.f956_status)}`}
                variant={f956Variant(p.f956_status)}
              />
            )}
            {p.subscription_status && (
              <StatusBadge
                label={subscriptionLabel(p.subscription_status)}
                variant={subscriptionVariant(p.subscription_status)}
              />
            )}
          </div>
        </div>
        <div className="flex flex-col items-start md:items-end gap-2 shrink-0">
          <ReportDuplicateButton projectId={p.id} userId={userId} />
          {canEdit && (
            <Link
              href={`/projects/${p.id}/edit`}
              className="btn btn-outline btn-sm transition-all duration-150"
            >
              Edit Project
            </Link>
          )}
        </div>
      </div>

      <section className="grid grid-cols-1 md:grid-cols-2 mb-8 border border-base-300 rounded-lg overflow-hidden">
        <InfoRow label="Location" value={location || '—'} />
        <InfoRow
          label="Regional Center"
          value={
            rc ? (
              <>
                <Link href={`/rc/${rc.id}`} className="link link-secondary">
                  {rc.name}
                </Link>
                {rc.uscis_rc_id && (
                  <span className="text-meta text-neutral/50 ml-2 font-normal">
                    {rc.uscis_rc_id}
                  </span>
                )}
              </>
            ) : (
              '—'
            )
          }
        />
        <InfoRow label="Investment Amount" value={formatCurrency(p.investment_amount)} />
        <InfoRow
          label="Project Type"
          value={
            (p.project_type || []).length ? (
              <span className="flex flex-wrap gap-1">
                {(p.project_type || []).map((t) => (
                  <span
                    key={t}
                    className="badge bg-base-200 text-neutral/70 border-0 rounded-full text-xs font-semibold px-3 py-1"
                  >
                    {projectTypeLabel(t)}
                  </span>
                ))}
              </span>
            ) : (
              '—'
            )
          }
        />
        <InfoRow
          label="Website"
          value={
            p.website_url ? (
              <a
                href={p.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="link link-secondary break-all font-semibold"
              >
                {p.website_url}
              </a>
            ) : (
              '—'
            )
          }
        />
        <InfoRow label="Date Added" value={formatDate(p.created_at)} />
        <InfoRow label="Added By" value={adder?.display_name || 'Anonymous'} />
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-bold text-primary mb-3">Project Contacts</h2>
        {(contacts as ProjectContact[] | null)?.length ? (
          <ul className="space-y-3">
            {(contacts as ProjectContact[]).map((c) => (
              <li
                key={c.id}
                className="flex flex-wrap items-center gap-3 p-3 border border-base-300 rounded-lg"
              >
                <span className="font-medium">{c.name}</span>
                {c.role && (
                  <span className="badge badge-ghost rounded-full">{c.role}</span>
                )}
                {c.email && (
                  <a href={`mailto:${c.email}`} className="link link-secondary text-sm">
                    {c.email}
                  </a>
                )}
                {c.phone && (
                  <a href={`tel:${c.phone}`} className="link link-secondary text-sm">
                    {c.phone}
                  </a>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-neutral/60">No contacts listed yet</p>
        )}
      </section>

      <div className="mb-8">
        <ConfirmationWidget projectId={p.id} />
      </div>

      <section className="mb-8">
        <h2 className="text-lg font-bold text-primary mb-3">Notes</h2>
        {p.notes ? (
          <p className="text-sm whitespace-pre-wrap text-neutral/80">{p.notes}</p>
        ) : (
          <p className="text-sm text-neutral/60">No additional notes</p>
        )}
      </section>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="border-b border-base-200 py-3 px-4">
      <p className="text-xs uppercase tracking-wide text-neutral/50 mb-1">{label}</p>
      <div className="text-base font-semibold text-neutral">{value}</div>
    </div>
  );
}

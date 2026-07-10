import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import TEATag from '@/components/TEATag';
import StatusBadge from '@/components/StatusBadge';
import VoteWidget from '@/components/VoteWidget';
import ReportDuplicateButton from './ReportDuplicateButton';
import ClaimProjectButton from './ClaimProjectButton';
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
  const supabase = await createClient();
  const { data } = await supabase
    .from('projects')
    .select('name')
    .eq('id', params.id)
    .maybeSingle();
  return { title: data?.name || 'Project' };
}

export default async function ProjectDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();

  const { data: project, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', params.id)
    .maybeSingle();

  if (error || !project) notFound();

  const p = project as Project;
  if (p.merged_into) redirect(`/projects/${p.merged_into}`);

  const [{ data: contacts }, { data: adder }, { data: auth }] = await Promise.all([
    supabase
      .from('project_contacts')
      .select('*')
      .eq('project_id', p.id)
      .order('created_at', { ascending: true }),
    p.added_by
      ? supabase
          .from('profiles')
          .select('display_name')
          .eq('id', p.added_by)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    supabase.auth.getUser(),
  ]);

  const location = [p.location_city, p.location_state].filter(Boolean).join(', ');
  const userId = auth.user?.id ?? null;

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
          {!p.claimed_by && <ClaimProjectButton projectId={p.id} userId={userId} />}
          {p.claimed_by && (
            <span className="text-meta text-neutral/50">
              {p.claim_verified ? 'Claimed & verified' : 'Claim pending verification'}
            </span>
          )}
        </div>
      </div>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 p-4 border border-base-300 rounded-lg">
        <InfoRow label="Location" value={location || '—'} />
        <InfoRow
          label="Regional Center"
          value={
            <>
              {p.regional_center || '—'}
              {p.regional_center_id && (
                <span className="text-meta text-neutral/50 ml-2">{p.regional_center_id}</span>
              )}
            </>
          }
        />
        <InfoRow label="Investment Amount" value={formatCurrency(p.investment_amount)} />
        <InfoRow
          label="Project Type"
          value={
            (p.project_type || []).length ? (
              <span className="flex flex-wrap gap-1">
                {(p.project_type || []).map((t) => (
                  <span key={t} className="badge badge-ghost rounded-full">
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
                className="link link-secondary break-all"
              >
                {p.website_url}
              </a>
            ) : (
              '—'
            )
          }
        />
        <InfoRow label="Date Added" value={formatDate(p.created_at)} />
        <InfoRow
          label="Added By"
          value={(adder as Profile | null)?.display_name || 'Anonymous'}
        />
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
        <VoteWidget projectId={p.id} />
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
    <div>
      <p className="text-meta text-neutral/50 mb-0.5">{label}</p>
      <div className="text-sm font-medium">{value}</div>
    </div>
  );
}

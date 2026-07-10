import Link from 'next/link';
import { notFound } from 'next/navigation';
import ProjectCard from '@/components/ProjectCard';
import { createClient } from '@/lib/supabase-server';
import type { ProjectWithVotes, RegionalCenter } from '@/lib/types';
import { PROJECT_SELECT } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data } = await supabase
    .from('regional_centers')
    .select('name')
    .eq('id', params.id)
    .maybeSingle();
  return { title: data?.name || 'Regional Center' };
}

export default async function RCProfilePage({ params }: { params: { id: string } }) {
  const supabase = createClient();

  const { data: rc, error } = await supabase
    .from('regional_centers')
    .select('*')
    .eq('id', params.id)
    .maybeSingle();

  if (error || !rc) notFound();

  const center = rc as RegionalCenter;

  const { data: projects } = await supabase
    .from('projects')
    .select(PROJECT_SELECT)
    .eq('rc_id', params.id)
    .is('merged_into', null)
    .order('created_at', { ascending: false });

  const list = (projects as ProjectWithVotes[]) || [];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="text-meta breadcrumbs mb-4">
        <ul>
          <li>
            <Link href="/">Home</Link>
          </li>
          <li>
            <Link href="/regional-centers">Regional Centers</Link>
          </li>
          <li>{center.name}</li>
        </ul>
      </div>

      <div className="mb-6">
        <h1 className="text-3xl font-bold text-primary">{center.name}</h1>
        <div className="flex flex-wrap items-center gap-3 mt-3">
          {center.uscis_rc_id && (
            <span className="badge bg-base-200 text-neutral/60 border-0 rounded-full text-xs font-semibold px-3 py-1">
              {center.uscis_rc_id}
            </span>
          )}
          {center.website_url && (
            <a
              href={center.website_url}
              target="_blank"
              rel="noopener noreferrer"
              className="link link-secondary text-sm"
            >
              Website
            </a>
          )}
        </div>
      </div>

      <section className="border border-base-300 rounded-lg p-4 md:p-6 mb-10 space-y-4">
        {center.description && (
          <p className="text-sm text-neutral/80 leading-relaxed">{center.description}</p>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-neutral/50 mb-1">
              Headquarters State
            </p>
            <p className="font-semibold">{center.headquarters_state || '—'}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-neutral/50 mb-1">
              Operating States
            </p>
            {(center.operating_states || []).length ? (
              <div className="flex flex-wrap gap-1">
                {(center.operating_states || []).map((s) => (
                  <span
                    key={s}
                    className="badge bg-base-200 text-neutral/70 border-0 rounded-full text-xs font-semibold px-3 py-1"
                  >
                    {s}
                  </span>
                ))}
              </div>
            ) : (
              <p className="font-semibold">—</p>
            )}
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-neutral/50 mb-1">Contact Email</p>
            {center.contact_email ? (
              <a href={`mailto:${center.contact_email}`} className="link link-secondary font-semibold">
                {center.contact_email}
              </a>
            ) : (
              <p className="font-semibold">—</p>
            )}
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-neutral/50 mb-1">Contact Phone</p>
            {center.contact_phone ? (
              <a href={`tel:${center.contact_phone}`} className="link link-secondary font-semibold">
                {center.contact_phone}
              </a>
            ) : (
              <p className="font-semibold">—</p>
            )}
          </div>
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-primary">Projects by {center.name}</h2>
          <p className="text-sm text-neutral/60">
            {list.length} project{list.length === 1 ? '' : 's'}
          </p>
        </div>
        {list.length === 0 ? (
          <p className="text-neutral/60 py-8">
            No projects listed for this regional center yet. Know one?{' '}
            <Link href="/projects/new" className="link link-secondary">
              Add it
            </Link>
            .
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {list.map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

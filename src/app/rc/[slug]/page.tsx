import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import ProjectCard from '@/components/ProjectCard';
import { createClient } from '@/lib/supabase-server';
import { brandEditPath, brandPath, isUuid } from '@/lib/slugs';
import type {
  ProjectWithVotes,
  RcBrand,
  RcBrandContact,
  RegionalCenter,
} from '@/lib/types';
import { PROJECT_SELECT } from '@/lib/types';

export const dynamic = 'force-dynamic';

async function resolveBrand(param: string): Promise<RcBrand | null> {
  const supabase = createClient();

  // Prefer slug
  const { data: bySlug } = await supabase
    .from('rc_brands')
    .select('*')
    .eq('slug', param)
    .maybeSingle();
  if (bySlug) return bySlug as RcBrand;

  if (isUuid(param)) {
    const { data: byId } = await supabase
      .from('rc_brands')
      .select('*')
      .eq('id', param)
      .maybeSingle();
    if (byId) return byId as RcBrand;

    // Legacy entity UUID → parent brand
    const { data: entity } = await supabase
      .from('regional_centers')
      .select('brand_id')
      .eq('id', param)
      .maybeSingle();
    if (entity?.brand_id) {
      const { data: parent } = await supabase
        .from('rc_brands')
        .select('*')
        .eq('id', entity.brand_id)
        .maybeSingle();
      return (parent as RcBrand) || null;
    }
  }

  return null;
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const brand = await resolveBrand(params.slug);
  return { title: brand?.name || 'Regional Center' };
}

export default async function RCBrandDetailPage({ params }: { params: { slug: string } }) {
  const brand = await resolveBrand(params.slug);
  if (!brand) notFound();

  // Canonicalize UUID / legacy URLs to slug when available
  if (brand.slug && params.slug !== brand.slug) {
    redirect(brandPath(brand));
  }

  const supabase = createClient();
  const brandId = brand.id;

  const [{ data: contacts }, projectsRes, { data: entities }] = await Promise.all([
    supabase.from('rc_brand_contacts').select('*').eq('brand_id', brandId),
    supabase
      .from('projects')
      .select(PROJECT_SELECT)
      .eq('brand_id', brandId)
      .is('merged_into', null)
      .eq('status', 'approved')
      .order('created_at', { ascending: false }),
    supabase
      .from('regional_centers')
      .select('*')
      .eq('brand_id', brandId)
      .order('name'),
  ]);

  let projects = projectsRes.data;
  if (projectsRes.error) {
    console.error('Brand projects (approved) failed:', projectsRes.error.message);
    const retry = await supabase
      .from('projects')
      .select(PROJECT_SELECT)
      .eq('brand_id', brandId)
      .is('merged_into', null)
      .order('created_at', { ascending: false });
    projects = retry.data;
  }

  let list = (projects as ProjectWithVotes[]) || [];

  if (!list.length && (entities || []).length) {
    const entityIds = (entities as RegionalCenter[]).map((e) => e.id);
    const { data: legacyProjects } = await supabase
      .from('projects')
      .select(PROJECT_SELECT)
      .in('rc_id', entityIds)
      .is('merged_into', null)
      .order('created_at', { ascending: false });
    list = (legacyProjects as ProjectWithVotes[]) || [];
  }

  const contactList = (contacts as RcBrandContact[]) || [];
  const entityList = (entities as RegionalCenter[]) || [];

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div>
      <section className="page-hero">
        <div className="page-hero-inner">
          <div className="text-meta breadcrumbs mb-3 text-neutral/50 [&_a]:text-secondary [&_a:hover]:text-secondary/80">
            <ul>
              <li>
                <Link href="/">Home</Link>
              </li>
              <li>
                <Link href="/rc">Regional Centers</Link>
              </li>
              <li>{brand.name}</li>
            </ul>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <p className="page-hero-eyebrow mb-2">Regional Center</p>
              <h1 className="page-hero-title">{brand.name}</h1>
              {brand.website_url && (
                <a
                  href={brand.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-secondary hover:underline mt-2 inline-block"
                >
                  {brand.website_url}
                </a>
              )}
              {brand.description && (
                <p className="page-hero-subtitle">{brand.description}</p>
              )}
            </div>
            {user && (
              <Link
                href={brandEditPath(brand)}
                className="btn btn-outline btn-sm border-primary/30 text-primary hover:bg-primary/5 rounded-full shrink-0"
              >
                Edit
              </Link>
            )}
          </div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto py-8 px-4">
      {contactList.length > 0 && (
        <div className="card-elevated mb-6 p-5">
            <h2 className="font-bold text-primary mb-3">Contacts</h2>
            <div className="space-y-2">
              {contactList.map((c) => (
                <div key={c.id} className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                  {c.name && <span className="font-medium">{c.name}</span>}
                  {c.role && (
                    <span className="badge badge-sm badge-outline rounded-full">{c.role}</span>
                  )}
                  {c.email && (
                    <a href={`mailto:${c.email}`} className="text-secondary">
                      {c.email}
                    </a>
                  )}
                  {c.phone && <span className="text-neutral/50">{c.phone}</span>}
                </div>
              ))}
            </div>
        </div>
      )}

      <div className="mb-8">
        <h2 className="text-xl font-bold text-primary mb-4">Projects ({list.length})</h2>
        {list.length === 0 ? (
          <p className="text-neutral/50 text-sm">
            No projects listed yet.{' '}
            <Link href="/projects/add" className="link link-secondary">
              Add one
            </Link>
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {list.map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </div>
        )}
      </div>

      {entityList.length > 0 && (
        <details className="collapse collapse-arrow card-elevated">
          <summary className="collapse-title font-bold text-primary">
            USCIS Entities ({entityList.length})
          </summary>
          <div className="collapse-content">
            <p className="text-xs text-neutral/50 mb-3">
              Official USCIS-registered regional center entities under this organization.
            </p>
            <div className="overflow-x-auto">
              <table className="table table-sm">
                <thead>
                  <tr>
                    <th>Entity Name</th>
                    <th>USCIS ID</th>
                    <th>Operating States</th>
                  </tr>
                </thead>
                <tbody>
                  {entityList.map((e) => (
                    <tr key={e.id}>
                      <td className="text-sm">{e.name}</td>
                      <td className="text-xs font-mono text-neutral/50">{e.uscis_rc_id}</td>
                      <td className="text-xs">{(e.operating_states || []).join(', ')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </details>
      )}
    </div>
    </div>
  );
}

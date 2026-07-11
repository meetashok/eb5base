import Link from 'next/link';
import AuthGateLink from '@/components/AuthGateLink';
import TEATag from '@/components/TEATag';
import StatusBadge from '@/components/StatusBadge';
import ConfirmationWidget from '@/components/ConfirmationWidget';
import ReportDuplicateButton from '@/app/projects/[id]/ReportDuplicateButton';
import type { Project, ProjectContact, Profile } from '@/lib/types';
import { brandPath, projectEditPath } from '@/lib/slugs';
import {
  formatCurrency,
  formatDate,
  f956Label,
  f956Variant,
  projectTypeLabel,
  subscriptionLabel,
  subscriptionVariant,
} from '@/lib/utils';

interface ProjectDetailProps {
  project: Project;
  contacts: ProjectContact[];
  userId: string | null;
  canEdit: boolean;
}

export default function ProjectDetail({
  project: p,
  contacts,
  userId,
  canEdit,
}: ProjectDetailProps) {
  const location = [p.location_city, p.location_state].filter(Boolean).join(', ');
  const adder = p.profiles as Pick<Profile, 'display_name'> | null | undefined;
  const brand = p.rc_brands;
  const rc = p.regional_centers;
  const brandDisplayName = brand?.name || rc?.name;
  const brandHref =
    brand?.id || p.brand_id
      ? brandPath({
          id: brand?.id || p.brand_id!,
          slug: brand?.slug,
          name: brand?.name,
        })
      : null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="text-meta breadcrumbs mb-4 text-neutral/60">
        <ul>
          <li>
            <Link href="/">Home</Link>
          </li>
          {brandHref && brandDisplayName ? (
            <>
              <li>
                <Link href="/rc">Regional Centers</Link>
              </li>
              <li>
                <Link href={brandHref}>{brandDisplayName}</Link>
              </li>
            </>
          ) : (
            <li>
              <Link href="/projects">Projects</Link>
            </li>
          )}
          <li>{p.name}</li>
        </ul>
      </div>

      <section className="card-elevated overflow-hidden mb-8">
        <div className="bg-page-hero-gradient text-primary-content px-6 py-8 md:px-8">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div>
              <p className="hero-eyebrow text-accent mb-2">Project</p>
              <h1 className="text-3xl font-bold">{p.name}</h1>
              <div className="flex flex-wrap gap-1.5 mt-4">
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
                <AuthGateLink
                  href={projectEditPath(p)}
                  className="btn btn-outline btn-sm border-primary-content/40 text-primary-content hover:bg-primary-content/10 rounded-full"
                >
                  Edit Project
                </AuthGateLink>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="card-elevated overflow-hidden mb-8 grid grid-cols-1 md:grid-cols-2">
        <InfoRow label="Location" value={location || 'Not listed'} />
        <InfoRow
          label="Regional Center"
          value={
            brandDisplayName ? (
              brandHref ? (
                <Link href={brandHref} className="link link-secondary">
                  {brandDisplayName}
                </Link>
              ) : (
                brandDisplayName
              )
            ) : (
              'Not listed'
            )
          }
        />
        <InfoRow label="Investment Amount" value={formatCurrency(p.investment_amount)} />
        <InfoRow
          label="Investor Positions"
          value={
            p.total_slots != null && p.total_slots > 0
              ? p.total_slots.toLocaleString()
              : 'Not listed'
          }
        />
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
              'Not listed'
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
              'Not listed'
            )
          }
        />
        <InfoRow label="Date Added" value={formatDate(p.created_at)} />
        <InfoRow label="Added By" value={adder?.display_name || 'Anonymous'} />
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-bold text-primary mb-3">Project Contacts</h2>
        {contacts.length ? (
          <ul className="space-y-3">
            {contacts.map((c) => (
              <li
                key={c.id}
                className="card-elevated flex flex-wrap items-center gap-3 p-4"
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

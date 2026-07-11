import Link from 'next/link';
import type { ProjectWithVotes } from '@/lib/types';
import { projectBrandName } from '@/lib/types';
import { projectPath } from '@/lib/slugs';
import StatusBadge from './StatusBadge';
import TEATag from './TEATag';
import ConfirmStatusButtons from './ConfirmStatusButtons';
import {
  formatCurrency,
  f956Label,
  f956Variant,
  subscriptionLabel,
  subscriptionVariant,
} from '@/lib/utils';

interface ProjectCardProps {
  project: ProjectWithVotes;
  showConfirmationSummary?: boolean;
}

const compactBadge = 'text-[10px] px-2 py-0 min-h-0 h-5 font-medium';

export default function ProjectCard({
  project,
  showConfirmationSummary = true,
}: ProjectCardProps) {
  const location = [project.location_city, project.location_state].filter(Boolean).join(', ');
  const brandName = projectBrandName(project);
  const confirmationCount =
    project.confirmation_count ??
    project.project_votes?.[0]?.count ??
    project.vote_count ??
    0;
  const metaLine = [location, brandName].filter(Boolean).join(' · ');
  const amount = formatCurrency(project.investment_amount);

  return (
    <div className="card-elevated h-full">
      <div className="card-body p-3 gap-2">
        <Link href={projectPath(project)} className="block group">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm font-bold text-primary leading-snug line-clamp-2 group-hover:text-secondary transition-colors">
              {project.name}
            </h3>
            <span className="text-xs font-semibold text-neutral shrink-0 tabular-nums">{amount}</span>
          </div>

          {metaLine && (
            <p className="text-xs text-neutral/60 truncate mt-0.5">{metaLine}</p>
          )}

          {project.total_slots != null && project.total_slots > 0 && (
            <p className="text-[11px] text-neutral/50 mt-0.5">
              {project.total_slots.toLocaleString()} positions
            </p>
          )}

          <div className="flex flex-wrap gap-1 mt-1.5">
            {(project.tea_designations || []).map((tea) => (
              <TEATag key={tea} designation={tea} className={compactBadge} />
            ))}
            {project.f956_status && (
              <StatusBadge
                label={`956F ${f956Label(project.f956_status)}`}
                variant={f956Variant(project.f956_status)}
                className={compactBadge}
              />
            )}
            {project.subscription_status && (
              <StatusBadge
                label={subscriptionLabel(project.subscription_status)}
                variant={subscriptionVariant(project.subscription_status)}
                className={compactBadge}
              />
            )}
          </div>

          {showConfirmationSummary && confirmationCount > 0 && (
            <p className="text-[10px] text-neutral/50 mt-1">
              {confirmationCount} confirmation{confirmationCount === 1 ? '' : 's'}
            </p>
          )}
        </Link>

        <ConfirmStatusButtons
          projectId={project.id}
          confirmationCount={confirmationCount}
          showCount={false}
          compact
        />
      </div>
    </div>
  );
}

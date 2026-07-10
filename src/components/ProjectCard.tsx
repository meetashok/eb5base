import Link from 'next/link';
import type { ProjectWithVotes } from '@/lib/types';
import StatusBadge from './StatusBadge';
import TEATag from './TEATag';
import {
  formatCurrency,
  f956Label,
  f956Variant,
  subscriptionLabel,
  subscriptionVariant,
  timeAgo,
} from '@/lib/utils';

interface ProjectCardProps {
  project: ProjectWithVotes;
  showVoteSummary?: boolean;
}

export default function ProjectCard({ project, showVoteSummary = true }: ProjectCardProps) {
  const location = [project.location_city, project.location_state].filter(Boolean).join(', ');
  const rcName = project.regional_centers?.name;

  return (
    <Link
      href={`/projects/${project.id}`}
      className="card card-bordered border-base-300/50 bg-base-100 shadow-sm block h-full transition-all duration-150 hover:shadow-md hover:-translate-y-0.5 hover:border-l-4 hover:border-l-primary"
    >
      <div className="card-body p-4 gap-3">
        <h3 className="card-title text-base font-bold text-primary leading-snug">
          {project.name}
        </h3>

        {location && <p className="text-sm text-neutral/80">{location}</p>}

        {rcName && <p className="text-meta text-neutral/60">{rcName}</p>}

        <div className="flex flex-wrap gap-1.5">
          {(project.tea_designations || []).map((tea) => (
            <TEATag key={tea} designation={tea} />
          ))}
          {project.f956_status && (
            <StatusBadge
              label={`956F ${f956Label(project.f956_status)}`}
              variant={f956Variant(project.f956_status)}
            />
          )}
          {project.subscription_status && (
            <StatusBadge
              label={subscriptionLabel(project.subscription_status)}
              variant={subscriptionVariant(project.subscription_status)}
            />
          )}
        </div>

        <div className="flex items-center justify-between gap-2 mt-auto pt-1">
          <span className="text-sm font-semibold text-neutral">
            {formatCurrency(project.investment_amount)}
          </span>
          {showVoteSummary && (
            <span className="text-meta text-neutral/60">
              {project.vote_count != null && project.vote_count > 0
                ? `${project.vote_count} vote${project.vote_count === 1 ? '' : 's'}${
                    project.last_vote_status
                      ? `, last: ${project.last_vote_status} ${timeAgo(project.last_vote_at)}`
                      : ''
                  }`
                : 'No votes yet'}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

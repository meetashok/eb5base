import Link from 'next/link';
import type { ProjectWithVotes } from '@/lib/types';
import { projectBrandName } from '@/lib/types';
import { projectPath } from '@/lib/slugs';
import StatusBadge from './StatusBadge';
import TEATag from './TEATag';
import ConfirmStatusButtons from './ConfirmStatusButtons';
import {
  consensus7dLabel,
  f956Label,
  f956Variant,
  formatConfirmations7d,
  formatOpenPct7d,
} from '@/lib/utils';

interface ProjectCardProps {
  project: ProjectWithVotes;
}

const compactBadge = 'text-[10px] px-2 py-0 min-h-0 h-5 font-medium';

export default function ProjectCard({ project }: ProjectCardProps) {
  const location = [project.location_city, project.location_state].filter(Boolean).join(', ');
  const brandName = projectBrandName(project);
  const confirmationCount =
    project.confirmation_count ??
    project.project_votes?.[0]?.count ??
    project.vote_count ??
    0;
  const confirmations7d = project.confirmations_7d ?? 0;
  const consensus = project.consensus_7d;
  const openPctLine = formatOpenPct7d(project.open_pct_7d);
  const detailHref = projectPath(project);

  return (
    <div className="card-elevated h-full">
      <div className="card-body p-3 gap-2">
        <Link href={detailHref} className="block group">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-bold text-primary leading-snug line-clamp-2 group-hover:text-secondary transition-colors">
                {project.name}
              </h3>
              {brandName && (
                <p className="text-xs font-semibold text-secondary truncate mt-0.5">{brandName}</p>
              )}
              {location && (
                <p className="text-xs text-neutral/60 truncate mt-0.5">{location}</p>
              )}
            </div>

            {confirmations7d > 0 && consensus && (
              <div className="text-right shrink-0 leading-tight">
                <p
                  className={`text-xs font-bold ${
                    consensus === 'open' ? 'text-secondary' : 'text-error'
                  }`}
                >
                  {consensus7dLabel(consensus)}
                </p>
                <p className="text-[10px] text-neutral/50 mt-0.5">
                  {formatConfirmations7d(confirmations7d)}
                </p>
                {openPctLine && (
                  <p className="text-[10px] text-neutral/50">{openPctLine}</p>
                )}
              </div>
            )}
          </div>

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
          </div>
        </Link>

        <ConfirmStatusButtons
          projectId={project.id}
          projectHref={detailHref}
          confirmationCount={confirmationCount}
          showCount={false}
          variant="card"
        />
      </div>
    </div>
  );
}

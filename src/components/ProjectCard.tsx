'use client';

import Link from 'next/link';
import type { ProjectWithVotes } from '@/lib/types';
import { projectBrandName, projectCoverUrl } from '@/lib/types';
import { projectPath } from '@/lib/slugs';
import StatusBadge from './StatusBadge';
import TEATag from './TEATag';
import ConfirmStatusButtons from './ConfirmStatusButtons';
import RcVerifiedBadge from './RcVerifiedBadge';
import {
  consensus7dLabel,
  f956BrowseLabel,
  f956Variant,
  formatConfirmations7d,
  formatOpenPct7d,
} from '@/lib/utils';
import { cn } from '@/lib/utils';

interface ProjectCardProps {
  project: ProjectWithVotes;
}

const compactBadge = 'text-[10px] px-2 py-0 min-h-0 h-5 font-medium';
const subtleTeaBadge = cn(compactBadge, 'font-medium');

export default function ProjectCard({ project }: ProjectCardProps) {
  const location = [project.location_city, project.location_state].filter(Boolean).join(', ');
  const brandName = projectBrandName(project);
  const coverUrl = projectCoverUrl(project);
  const confirmationCount =
    project.confirmation_count ??
    project.project_votes?.[0]?.count ??
    project.vote_count ??
    0;
  const confirmations7d = project.confirmations_7d ?? 0;
  const consensus = project.consensus_7d;
  const openPctLine = formatOpenPct7d(project.open_pct_7d);
  const detailHref = projectPath(project);

  const consensusMeta =
    confirmations7d > 0 && consensus
      ? [
          formatConfirmations7d(confirmations7d),
          openPctLine,
          `Community says ${consensus7dLabel(consensus).toLowerCase()}`,
        ]
          .filter(Boolean)
          .join(' · ')
      : null;
  const teaDesignations = project.tea_designations || [];

  return (
    <div className="card-elevated group relative overflow-hidden h-full flex flex-col">
      {coverUrl && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={coverUrl}
            alt=""
            aria-hidden
            className="absolute top-0 right-0 h-full w-[48%] object-cover object-center pointer-events-none"
          />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'linear-gradient(to right, hsl(var(--b1)) 0%, hsl(var(--b1) / 0.92) 35%, hsl(var(--b1) / 0.55) 55%, transparent 72%)',
            }}
          />
        </>
      )}
      <div className="card-body p-3 pb-3 gap-2 relative z-10 flex flex-col flex-1">
        <Link href={detailHref} className="block min-w-0 flex-1">
          {brandName && (
            <h3 className="text-sm font-bold text-primary leading-snug line-clamp-2 group-hover:text-secondary transition-colors">
              {brandName}
            </h3>
          )}
          <p className={`text-xs font-medium text-neutral/70 line-clamp-2 ${brandName ? 'mt-0.5' : ''}`}>
            {project.name}
          </p>

          {project.f956_status && (
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              <StatusBadge
                label={`956F ${f956BrowseLabel(project.f956_status)}`}
                variant={f956Variant(project.f956_status)}
                className={compactBadge}
              />
              {project.rc_verified_at && <RcVerifiedBadge size="sm" />}
            </div>
          )}

          {!project.f956_status && project.rc_verified_at && (
            <div className="mt-1.5">
              <RcVerifiedBadge size="sm" />
            </div>
          )}

          {location && (
            <p className="text-xs text-neutral/50 truncate mt-1">{location}</p>
          )}

          {project.total_slots != null && project.total_slots > 0 && (
            <p className="text-[11px] text-neutral/50 mt-0.5">
              {project.total_slots.toLocaleString()} positions
            </p>
          )}

          {teaDesignations.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {teaDesignations.map((tea) => (
                <TEATag
                  key={tea}
                  designation={tea}
                  variant="subtle"
                  className={subtleTeaBadge}
                />
              ))}
            </div>
          )}

          {consensusMeta && (
            <p className="text-[11px] text-neutral/50 mt-1.5 leading-snug">{consensusMeta}</p>
          )}
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

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import {
  chartHeaderBarClass,
  chartHeaderControlsClass,
  chartHeaderRowClass,
} from './tokens';

/** The raw tinted header bar (bleeds to the card edges). */
export function ChartHeaderBar({ children }: { children: ReactNode }) {
  return <header className={chartHeaderBarClass}>{children}</header>;
}

/** Right-aligned controls container (toggles/selectors). */
export function ChartHeaderControls({ children }: { children: ReactNode }) {
  return <div className={chartHeaderControlsClass}>{children}</div>;
}

export interface ChartTitleBlockProps {
  title: ReactNode;
  /** Free-form description line. Takes precedence over metric/metricNote. */
  subtitle?: ReactNode;
  /** Emphasized metric value (colored, tabular-nums). */
  metric?: ReactNode;
  metricClassName?: string;
  /** Muted note after the metric. */
  metricNote?: ReactNode;
  loading?: boolean;
  /** Compact action (e.g. Share) anchored under the title. */
  action?: ReactNode;
}

/** The left title block: title (+ loading), a subtitle or metric line, action. */
export function ChartTitleBlock({
  title,
  subtitle,
  metric,
  metricClassName = 'text-primary',
  metricNote,
  loading,
  action,
}: ChartTitleBlockProps) {
  return (
    <div className="min-w-0 w-full space-y-1 sm:flex-1">
      <h2 className="text-sm font-semibold leading-snug text-primary sm:text-base">
        {title}
        {loading ? (
          <span className="ml-2 text-xs font-normal text-neutral/40">Updating…</span>
        ) : null}
      </h2>
      {subtitle != null ? (
        <p className="text-sm leading-snug text-neutral/70">{subtitle}</p>
      ) : metric != null || metricNote != null ? (
        <p className="text-sm leading-snug text-neutral/70">
          {metric != null ? (
            <span className={cn('font-semibold tabular-nums', metricClassName)}>{metric}</span>
          ) : null}
          {metric != null && metricNote != null ? (
            <span className="text-neutral/45"> · </span>
          ) : null}
          {metricNote != null ? <span>{metricNote}</span> : null}
        </p>
      ) : null}
      {action ? <div className="pt-0.5">{action}</div> : null}
    </div>
  );
}

export interface ChartHeaderProps extends ChartTitleBlockProps {
  /** Right-side toggles/selectors. */
  controls?: ReactNode;
}

/**
 * The standard chart header: tinted bar with a title block on the left and
 * controls on the right. Used by every analysis explorer for consistency.
 */
export default function ChartHeader({ controls, ...titleProps }: ChartHeaderProps) {
  return (
    <ChartHeaderBar>
      <div className={chartHeaderRowClass}>
        <ChartTitleBlock {...titleProps} />
        {controls ? <ChartHeaderControls>{controls}</ChartHeaderControls> : null}
      </div>
    </ChartHeaderBar>
  );
}

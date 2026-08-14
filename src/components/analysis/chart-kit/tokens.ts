/**
 * Shared class tokens for the analysis chart kit. These are the single source
 * of truth for chart chrome; do not paste these class strings inline in
 * explorers - use the kit components (ChartCard, ChartHeader, ToggleGroup).
 */

export const chartCardClass =
  'rounded-xl border-2 border-base-300 bg-base-100 p-4 sm:p-5 shadow-sm space-y-4 overflow-x-hidden';

export const chartHeaderBarClass =
  '-mx-4 border-b-2 border-base-300 bg-base-200/50 px-4 py-3 first:-mt-4 first:rounded-t-[0.65rem] sm:-mx-5 sm:px-5 sm:py-3.5 sm:first:-mt-5';

export const chartHeaderRowClass =
  'flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between';

export const chartHeaderControlsClass =
  'flex w-full flex-col items-stretch gap-2 sm:w-auto sm:items-end sm:gap-1.5';

export const controlLabelClass =
  'text-[11px] font-semibold uppercase tracking-wide text-neutral/55 sm:text-[10px]';

export const controlRowClass = 'flex flex-wrap items-center gap-2 sm:gap-1.5';

export const toggleGroupClass =
  'inline-flex max-w-full flex-wrap rounded-full border border-base-300 p-0.5 bg-base-200/60 gap-0.5';

export function toggleBtnClass(active: boolean, extra = ''): string {
  return [
    'rounded-full border-0 min-h-0 h-7 px-2.5 text-xs font-semibold leading-none transition-colors sm:h-6 sm:px-2 sm:text-[10px]',
    active ? 'bg-primary text-primary-content' : 'bg-transparent text-neutral hover:bg-base-300/70',
    extra,
  ]
    .filter(Boolean)
    .join(' ');
}

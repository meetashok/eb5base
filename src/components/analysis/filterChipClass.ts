/** Shared chip button styles for I-485 filter pickers. */
export function filterChipClass(selected: boolean, disabled = false): string {
  if (disabled) {
    return 'shrink-0 px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition-colors duration-150 text-neutral/40 bg-base-200/50 cursor-not-allowed';
  }
  if (selected) {
    return 'shrink-0 px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary bg-primary text-primary-content shadow-soft';
  }
  return 'shrink-0 px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary text-neutral bg-base-200/80 hover:bg-base-300 hover:text-primary';
}

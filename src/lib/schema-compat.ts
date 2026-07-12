/** True when Supabase/Postgres reports a missing column (pre-migration DB). */
export function isMissingColumn(
  message: string | undefined,
  column: string
): boolean {
  if (!message) return false;
  return new RegExp(`column .*\\.${column} does not exist`, 'i').test(message);
}

export function isMissingRcBrandMergedInto(message: string | undefined): boolean {
  return isMissingColumn(message, 'merged_into');
}

export function isMissingProjectClaimFields(message: string | undefined): boolean {
  return (
    isMissingColumn(message, 'claimed_by') ||
    isMissingColumn(message, 'rc_verified_at')
  );
}

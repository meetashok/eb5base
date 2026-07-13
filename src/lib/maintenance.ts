/**
 * When enabled, every public URL serves the maintenance page
 * (including /projects, /rc, /about, etc.).
 *
 * Default: ON. Set MAINTENANCE_MODE=false to restore the site.
 */
export function isMaintenanceMode(): boolean {
  const raw = process.env.MAINTENANCE_MODE?.trim().toLowerCase();
  if (raw == null || raw === '') return true;
  return raw === 'true' || raw === '1' || raw === 'yes' || raw === 'on';
}

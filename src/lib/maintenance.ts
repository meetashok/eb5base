import { cookies } from 'next/headers';

/**
 * When enabled, every public URL serves the maintenance page
 * (including /projects, /rc, /about, etc.).
 *
 * Default: ON. Set MAINTENANCE_MODE=false to restore the directory for everyone.
 *
 * Private unlock (owner + counsel): set MAINTENANCE_BYPASS_SECRET and visit
 * https://eb5base.com/?access=YOUR_SECRET once. A cookie keeps access open.
 * Public visitors without the cookie still see the maintenance page.
 */
/** Cookie set after a valid ?access= unlock (also mirrored as eb5base_access=1). */
export const MAINTENANCE_BYPASS_COOKIE = 'eb5_maint_bypass';

/** Public-facing access flag from the site review (non-secret marker). */
export const EB5BASE_ACCESS_COOKIE = 'eb5base_access';

export function isMaintenanceMode(): boolean {
  const raw = process.env.MAINTENANCE_MODE?.trim().toLowerCase();
  if (raw == null || raw === '') return true;
  return raw === 'true' || raw === '1' || raw === 'yes' || raw === 'on';
}

export function getMaintenanceBypassSecret(): string | null {
  const secret = process.env.MAINTENANCE_BYPASS_SECRET?.trim();
  return secret ? secret : null;
}

export function isValidMaintenanceBypassToken(token: string | null | undefined): boolean {
  const secret = getMaintenanceBypassSecret();
  if (!secret || !token) return false;
  return token === secret;
}

/** True when this request has a valid unlock cookie (server components / layout). */
export function hasMaintenanceBypass(): boolean {
  if (!isMaintenanceMode()) return false;
  const secret = getMaintenanceBypassSecret();
  if (!secret) return false;
  return cookies().get(MAINTENANCE_BYPASS_COOKIE)?.value === secret;
}

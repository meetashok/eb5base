import { cookies } from 'next/headers';

/**
 * Optional site-wide maintenance gate for the project directory.
 *
 * Default: OFF (site is public). Set MAINTENANCE_MODE=true to show the pause
 * page on non-passthrough routes. Private unlock: MAINTENANCE_BYPASS_SECRET
 * and visit /?access=YOUR_SECRET once (cookie lasts 30 days).
 */
/** Cookie set after a valid ?access= unlock (also mirrored as eb5base_access=1). */
export const MAINTENANCE_BYPASS_COOKIE = 'eb5_maint_bypass';

/** Public-facing access flag (non-secret marker). */
export const EB5BASE_ACCESS_COOKIE = 'eb5base_access';

export function isMaintenanceMode(): boolean {
  const raw = process.env.MAINTENANCE_MODE?.trim().toLowerCase();
  if (raw == null || raw === '') return false;
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

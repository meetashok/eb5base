/**
 * Private-preview allowlist for the Case Tracker.
 *
 * While USCIS status is served from the stub (no live API key), the authed
 * tracker is kept invite-only so real users never see fake statuses. Only
 * emails listed in the TRACKER_PREVIEW_EMAILS env var (comma / space / newline
 * separated) may sign in to the tracker, onboard, or view the app. Everyone
 * else stays on the public waitlist landing.
 *
 * When TRACKER_PREVIEW_EMAILS is unset/empty the gate is closed (no access),
 * which is the safe default for a private preview.
 */

function allowlist(): Set<string> {
  const raw = process.env.TRACKER_PREVIEW_EMAILS ?? '';
  return new Set(
    raw
      .split(/[\s,;]+/)
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function isPreviewAllowed(email: string | null | undefined): boolean {
  if (!email) return false;
  return allowlist().has(email.trim().toLowerCase());
}

export const PREVIEW_DENIED_MESSAGE =
  'Case Tracker is in a private preview. This account is not on the invite list yet. Join the waitlist and we will email you when it opens.';

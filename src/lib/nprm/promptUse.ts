/** localStorage flag: this browser already counted a prompt copy. */
export const NPRM_PROMPT_COPIED_KEY = 'eb5base_nprm_prompt_copied_v1';

export function hasRecordedPromptCopy(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    return window.localStorage.getItem(NPRM_PROMPT_COPIED_KEY) === '1';
  } catch {
    return true;
  }
}

export function markPromptCopyRecorded(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(NPRM_PROMPT_COPIED_KEY, '1');
  } catch {
    // ignore quota / private mode
  }
}

/** Fetch the public aggregate copy count (null if unavailable). */
export async function fetchPromptCopyCount(): Promise<number | null> {
  try {
    const res = await fetch('/api/nprm/prompt-use', {
      method: 'GET',
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const body = (await res.json()) as { copy_count?: unknown; available?: boolean };
    if (body.available === false) return null;
    const n = body.copy_count;
    if (typeof n === 'number' && Number.isFinite(n) && n >= 0) return n;
    if (typeof n === 'string' && Number.isFinite(Number(n))) return Number(n);
    return null;
  } catch {
    return null;
  }
}

/**
 * Record one prompt copy for this browser (localStorage dedupe).
 * Returns the updated aggregate count when known.
 */
export async function recordPromptCopyOnce(): Promise<number | null> {
  if (hasRecordedPromptCopy()) {
    return fetchPromptCopyCount();
  }

  try {
    const res = await fetch('/api/nprm/prompt-use', {
      method: 'POST',
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return null;
    const body = (await res.json()) as { ok?: boolean; copy_count?: unknown };
    markPromptCopyRecorded();
    const n = body.copy_count;
    if (typeof n === 'number' && Number.isFinite(n) && n >= 0) return n;
    if (typeof n === 'string' && Number.isFinite(Number(n))) return Number(n);
    return fetchPromptCopyCount();
  } catch {
    return null;
  }
}

export function formatPromptCopyCount(n: number): string {
  return new Intl.NumberFormat('en-US').format(n);
}

import type {
  NprmCommentsEnvelope,
  NprmFeedIndex,
  NprmLastCheck,
  NprmPageData,
  NprmPromptNode,
  NprmStats,
  NprmTheme,
} from './types';

/**
 * Public share page (HTML shell):
 *   https://agent.meta.ai/s/eb5base-nprm-data-public-xlxt5sxpxm46eqp
 * Static JSON feed (CORS *): Cloudflare Space origin below.
 * Dual paths: /assets/data/ (primary) and /data/ (mirror when published).
 */
export const FEED_SHARE =
  'https://agent.meta.ai/s/eb5base-nprm-data-public-xlxt5sxpxm46eqp';

export const FEED_BASE =
  process.env.NEXT_PUBLIC_NPRM_FEED?.replace(/\/$/, '') ||
  'https://eb5base-nprm-data-public-xlxt5sxpxm46eqp.cf.metaaiusercontent.com';

export const LOCAL_DATA_BASE = '/data/nprm';

const ASSET_PATHS = ['/assets/data', '/data'] as const;

async function tryFetchText(
  url: string,
  revalidate: number
): Promise<{ ok: true; text: string } | { ok: false }> {
  try {
    const res = await fetch(url, {
      next: { revalidate },
      headers: { Accept: 'application/json, text/plain, */*' },
    });
    if (!res.ok) return { ok: false };
    const contentType = res.headers.get('content-type') || '';
    const text = await res.text();
    // Meta share URLs return SPA HTML for unknown paths - reject those.
    if (
      contentType.includes('text/html') ||
      text.trimStart().startsWith('<!DOCTYPE') ||
      text.trimStart().startsWith('<html')
    ) {
      return { ok: false };
    }
    return { ok: true, text };
  } catch {
    return { ok: false };
  }
}

async function tryFetchJson<T>(
  url: string,
  revalidate: number
): Promise<{ ok: true; data: T } | { ok: false }> {
  const result = await tryFetchText(url, revalidate);
  if (!result.ok) return { ok: false };
  try {
    return { ok: true, data: JSON.parse(result.text) as T };
  } catch {
    return { ok: false };
  }
}

async function fetchNamedJson<T>(
  name: string,
  revalidate = 3600
): Promise<{ data: T; base: string; source: 'remote' | 'local' } | null> {
  for (const path of ASSET_PATHS) {
    const url = `${FEED_BASE}${path}/${name}`;
    const remote = await tryFetchJson<T>(url, revalidate);
    if (remote.ok) {
      return { data: remote.data, base: FEED_BASE, source: 'remote' };
    }
  }

  // Absolute local fallback for server components (filesystem via public URL).
  const localUrl = `${LOCAL_DATA_BASE}/${name}`;
  // On the server during build, prefer reading from public/ when relative fetch may fail.
  if (typeof window === 'undefined') {
    try {
      const { readFile } = await import('fs/promises');
      const { join } = await import('path');
      const filePath = join(process.cwd(), 'public', 'data', 'nprm', name);
      const text = await readFile(filePath, 'utf8');
      return {
        data: JSON.parse(text) as T,
        base: LOCAL_DATA_BASE,
        source: 'local',
      };
    } catch {
      // fall through to HTTP local
    }
  }

  const local = await tryFetchJson<T>(localUrl, revalidate);
  if (local.ok) {
    return { data: local.data, base: LOCAL_DATA_BASE, source: 'local' };
  }
  return null;
}

async function fetchNamedText(
  name: string,
  revalidate = 600
): Promise<{ text: string; base: string; source: 'remote' | 'local' } | null> {
  for (const path of ASSET_PATHS) {
    const url = `${FEED_BASE}${path}/${name}`;
    const remote = await tryFetchText(url, revalidate);
    if (remote.ok) {
      return { text: remote.text, base: FEED_BASE, source: 'remote' };
    }
  }

  if (typeof window === 'undefined') {
    try {
      const { readFile } = await import('fs/promises');
      const { join } = await import('path');
      const filePath = join(process.cwd(), 'public', 'data', 'nprm', name);
      const text = await readFile(filePath, 'utf8');
      return { text, base: LOCAL_DATA_BASE, source: 'local' };
    } catch {
      // fall through
    }
  }

  const local = await tryFetchText(`${LOCAL_DATA_BASE}/${name}`, revalidate);
  if (local.ok) {
    return { text: local.text, base: LOCAL_DATA_BASE, source: 'local' };
  }
  return null;
}

export const fetchNprm = {
  all: async () => {
    const r = await fetchNamedJson<NprmCommentsEnvelope>('all_comments.json');
    if (!r) throw new Error('Failed to load all_comments.json');
    return r;
  },
  themes: async () => {
    const r = await fetchNamedJson<NprmTheme[]>('themes.json');
    if (!r) throw new Error('Failed to load themes.json');
    return r;
  },
  prompts: async () => {
    const r = await fetchNamedJson<NprmPromptNode[]>('prompt-tree.json');
    if (!r) throw new Error('Failed to load prompt-tree.json');
    return r;
  },
  stats: async () => {
    const r = await fetchNamedJson<NprmStats>('stats.json');
    if (!r) throw new Error('Failed to load stats.json');
    return r;
  },
  lastCheck: async () => {
    const r = await fetchNamedJson<NprmLastCheck>('last-check.json');
    if (!r) throw new Error('Failed to load last-check.json');
    return r;
  },
  checkLog: async () => {
    const r = await fetchNamedText('check.log', 600);
    if (!r) throw new Error('Failed to load check.log');
    return r;
  },
  index: async () => {
    const r = await fetchNamedJson<NprmFeedIndex>('index.json');
    if (!r) throw new Error('Failed to load index.json');
    return r;
  },
};

/** Redact emails / UUIDs that may appear in upstream check.log. */
export function sanitizeCheckLog(text: string): string {
  return text
    .replace(/[\w.+-]+@[\w.-]+\.\w+/g, '[redacted]')
    .replace(
      /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
      '[redacted]'
    );
}

export async function loadNprmPageData(): Promise<NprmPageData> {
  const [statsR, themesR, promptsR, allR, lastR, logR] = await Promise.all([
    fetchNprm.stats(),
    fetchNprm.themes(),
    fetchNprm.prompts(),
    fetchNprm.all(),
    fetchNprm.lastCheck().catch(() => null),
    fetchNprm.checkLog().catch(() => null),
  ]);

  const comments = allR.data.comments ?? [];
  // Prefer last-check stubs when they carry richer attributes later.
  const lastComments = lastR?.data.comments ?? [];
  const byId = new Map(lastComments.map((c) => [c.id, c]));
  const merged = comments.map((c) => {
    const richer = byId.get(c.id);
    if (!richer) return c;
    return {
      ...c,
      attributes: { ...c.attributes, ...richer.attributes },
    };
  });

  return {
    stats: statsR.data,
    themes: themesR.data,
    promptTree: promptsR.data,
    comments: merged,
    lastCheck: lastR?.data ?? null,
    checkLog: sanitizeCheckLog(logR?.text ?? ''),
    feedSource: statsR.source,
    feedBaseUsed: statsR.base,
  };
}

import type {
  NprmComment,
  NprmCommentsEnvelope,
  NprmFeedIndex,
  NprmFlatComment,
  NprmLastCheck,
  NprmPageData,
  NprmPromptNode,
  NprmProposalSummary,
  NprmStats,
  NprmTheme,
} from './types';
import { toNprmThemes, toPromptTree } from './keyTopics';
import { orderThemesForDisplay, parsePoster } from './utils';

/** Accept nested regs.gov rows or flat first-party theme/summary rows. */
export function normalizeComment(
  raw: NprmComment | NprmFlatComment
): NprmComment {
  const flat = raw as NprmFlatComment;
  const nested = raw as NprmComment;
  const attrs = { ...(flat.attributes || nested.attributes || {}) };

  const rawTitle = flat.title ?? attrs.title;
  const postedDate = flat.postedDate ?? attrs.postedDate;
  const aiSummary =
    flat.ai_summary ?? nested.aiSummary ?? attrs.aiSummary ?? undefined;
  const themeId = flat.theme_id ?? nested.themeId;
  const themeTitle = flat.theme_title ?? nested.themeTitle;
  const sourceLink = flat.source_link ?? nested.sourceLink;
  const originalText =
    flat.comment ?? attrs.originalText ?? undefined;

  const parsed = parsePoster(rawTitle);
  const posterType =
    flat.poster_type || nested.posterType || parsed.posterType;
  const posterLabel =
    flat.poster_label || nested.posterLabel || parsed.poster;
  // Never keep real person/org names on the client comment object.
  attrs.title = `Comment Submitted by ${posterLabel}`;
  if (postedDate) attrs.postedDate = postedDate;
  if (aiSummary) attrs.aiSummary = aiSummary;
  if (originalText) attrs.originalText = originalText;

  return {
    id: raw.id,
    type: raw.type,
    attributes: attrs,
    themeId,
    themeTitle,
    aiSummary,
    sourceLink,
    posterType,
    posterLabel,
    eb5baseLikelihood:
      flat.eb5base_likelihood ?? nested.eb5baseLikelihood,
    eb5baseConfidence:
      flat.eb5base_confidence ?? nested.eb5baseConfidence,
    eb5baseSignals: flat.eb5base_signals ?? nested.eb5baseSignals,
    eb5baseAntiSignals:
      flat.eb5base_anti_signals ?? nested.eb5baseAntiSignals,
    eb5baseAttributionVersion:
      flat.eb5base_attribution_version ?? nested.eb5baseAttributionVersion,
  };
}

/**
 * First-party NPRM comment data lives under public/data/nprm/.
 * Refresh with: npm run nprm:pull-comments (REGULATIONS_GOV_API_KEY required).
 * Meta CDN feed is no longer used.
 */
export const LOCAL_DATA_BASE = '/data/nprm';

/** Resolve /data/... to an absolute URL during SSR (relative fetch is unreliable). */
async function absoluteDataUrl(path: string): Promise<string> {
  if (typeof window !== 'undefined') return path;
  if (/^https?:\/\//i.test(path)) return path;
  try {
    const { headers } = await import('next/headers');
    const h = await headers();
    const host = h.get('x-forwarded-host') || h.get('host');
    if (!host) return path;
    const proto =
      h.get('x-forwarded-proto') ||
      (host.includes('localhost') || host.startsWith('127.') ? 'http' : 'https');
    return `${proto}://${host}${path}`;
  } catch {
    return path;
  }
}

async function tryFetchText(
  url: string
): Promise<{ ok: true; text: string } | { ok: false }> {
  try {
    const resolved = await absoluteDataUrl(url);
    const res = await fetch(resolved, {
      // Always read fresh so a new local pull shows up on refresh.
      cache: 'no-store',
      headers: { Accept: 'application/json, text/plain, */*' },
    });
    if (!res.ok) return { ok: false };
    const contentType = res.headers.get('content-type') || '';
    const text = await res.text();
    // Reject accidental HTML responses from misconfigured paths (e.g. login redirect).
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
  url: string
): Promise<{ ok: true; data: T } | { ok: false }> {
  const result = await tryFetchText(url);
  if (!result.ok) return { ok: false };
  try {
    return { ok: true, data: JSON.parse(result.text) as T };
  } catch {
    return { ok: false };
  }
}

async function fetchNamedJson<T>(
  name: string
): Promise<{ data: T; base: string; source: 'remote' | 'local' } | null> {
  const localUrl = `${LOCAL_DATA_BASE}/${name}`;
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

  const local = await tryFetchJson<T>(localUrl);
  if (local.ok) {
    return { data: local.data, base: LOCAL_DATA_BASE, source: 'local' };
  }
  return null;
}

async function fetchNamedText(
  name: string
): Promise<{ text: string; base: string; source: 'remote' | 'local' } | null> {
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

  const local = await tryFetchText(`${LOCAL_DATA_BASE}/${name}`);
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
  proposal: async () => {
    const r = await fetchNamedJson<NprmProposalSummary>(
      'proposal_summary.json'
    );
    if (!r) throw new Error('Failed to load proposal_summary.json');
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
    const r = await fetchNamedText('check.log');
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
  const [statsR, allR, proposalR, lastR, logR] = await Promise.all([
    fetchNprm.stats(),
    fetchNprm.all(),
    fetchNprm.proposal().catch(() => null),
    fetchNprm.lastCheck().catch(() => null),
    fetchNprm.checkLog().catch(() => null),
  ]);

  const comments = (allR.data.comments ?? []).map(normalizeComment);
  // Prefer last-check stubs when they carry richer attributes later.
  const lastComments = (lastR?.data.comments ?? []).map(normalizeComment);
  const byId = new Map(lastComments.map((c) => [c.id, c]));
  const merged = comments.map((c) => {
    const richer = byId.get(c.id);
    if (!richer) return c;
    return {
      ...c,
      attributes: { ...c.attributes, ...richer.attributes },
      // Keep theme/summary from all_comments when present; fill gaps from last-check.
      themeId: c.themeId || richer.themeId,
      themeTitle: c.themeTitle || richer.themeTitle,
      aiSummary: c.aiSummary || richer.aiSummary,
      sourceLink: c.sourceLink || richer.sourceLink,
    };
  });

  // stats.json can lag all_comments.json after a pull; prefer the larger count.
  // Treat the loaded comment list as the source of truth for counts.
  const stats = {
    ...statsR.data,
    total_comments: merged.length || statsR.data.total_comments,
  };

  // First-party key topics power Write (and Comments theme labels). Meta
  // themes.json / prompt-tree.json are no longer required for the builder.
  const themes = orderThemesForDisplay(toNprmThemes());
  const promptTree = toPromptTree();

  return {
    stats,
    themes,
    promptTree,
    comments: merged,
    proposal: proposalR?.data ?? null,
    lastCheck: lastR?.data ?? null,
    checkLog: sanitizeCheckLog(logR?.text ?? ''),
    feedSource: statsR.source,
    feedBaseUsed: statsR.base,
  };
}

import type { NprmComment, NprmTheme } from './types';

export const DOCKET_ID = 'USCIS-2026-0100';
export const DOCUMENT_ID = 'USCIS-2026-0100-0001';
export const FR_CITATION = '91 FR 40676';
export const RIN = '1615-AC94';

export const COMMENT_PERIOD_END = new Date('2026-08-31T23:59:00-04:00');

export const COMMENT_ON_URL =
  'https://www.regulations.gov/commenton/USCIS-2026-0100-0001';

export const DOCKET_URL =
  'https://www.regulations.gov/docket/USCIS-2026-0100';

export const DOCUMENT_URL =
  'https://www.regulations.gov/document/USCIS-2026-0100-0001';

export function commentUrl(commentId: string): string {
  return `https://www.regulations.gov/comment/${commentId}`;
}

/** Strip em/en dashes and leaked citation artifacts from feed copy. */
export function plainDash(text: string): string {
  return text
    .replace(/\u2014|\u2013/g, '-')
    .replace(/【[^】]*】/g, '')
    .replace(/\u2020/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

export function parsePoster(title?: string): {
  poster: string;
  posterType: 'anonymous' | 'named' | 'org';
} {
  if (!title) return { poster: 'Unknown', posterType: 'anonymous' };
  const m = title.match(/^Comment Submitted by\s+(.+)$/i);
  const name = (m?.[1] || title).trim().replace(/\.$/, '');
  const lower = name.toLowerCase();
  if (lower === 'anonymous' || lower.startsWith('anonymous ')) {
    return { poster: 'Anonymous', posterType: 'anonymous' };
  }
  if (
    /\b(llc|inc|ltd|limited|corp|company|capital|management|partners|lp|llp)\b/i.test(
      name
    )
  ) {
    return { poster: name, posterType: 'org' };
  }
  return { poster: name, posterType: 'named' };
}

export function commentSnippet(comment: NprmComment, max = 140): string {
  const attrs = comment.attributes || {};
  const highlighted = (attrs.highlightedContent || '').trim();
  if (highlighted) {
    return highlighted.length > max
      ? `${highlighted.slice(0, max - 1)}…`
      : highlighted;
  }
  const { poster } = parsePoster(attrs.title);
  return `Public submission by ${poster}. Full text on regulations.gov.`;
}

/** Map comment ID → theme IDs using grounded sample_ids (not invented). */
export function buildCommentThemeIndex(
  themes: NprmTheme[]
): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const theme of themes) {
    for (const id of theme.sample_ids) {
      const existing = map.get(id) || [];
      if (!existing.includes(theme.id)) existing.push(theme.id);
      map.set(id, existing);
    }
  }
  return map;
}

/**
 * Theme-grounded AI summary for sample comments only.
 * Never invents facts beyond themes.json summaries tied to real sample_ids.
 */
export function groundedAiSummary(
  commentId: string,
  themes: NprmTheme[]
): string | null {
  const matches = themes.filter((t) => t.sample_ids.includes(commentId));
  if (matches.length === 0) return null;
  return matches
    .map((t) => `${t.title}: ${t.summary}`)
    .join(' ');
}

export function dailyVolume(comments: NprmComment[]): { date: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const c of comments) {
    const d = c.attributes?.postedDate?.slice(0, 10);
    if (!d) continue;
    counts.set(d, (counts.get(d) || 0) + 1);
  }
  return Array.from(counts.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, count }));
}

export function commentsSince(
  comments: NprmComment[],
  sinceIsoDate: string
): number {
  return comments.filter((c) => {
    const d = c.attributes?.postedDate?.slice(0, 10);
    return d && d > sinceIsoDate;
  }).length;
}

export function formatLastPull(raw?: string): string {
  if (!raw) return 'n/a';
  // e.g. "2026-08-09 03:32 IST" or ISO-ish strings
  const m = raw.match(
    /^(\d{4})-(\d{2})-(\d{2})[ T](\d{1,2}):(\d{2})(?::(\d{2}))?\s*([A-Za-z/_]+)?/
  );
  if (!m) return raw;
  const [, y, mo, d, hh, mm, , tz] = m;
  const hour24 = Number(hh);
  const ampm = hour24 >= 12 ? 'PM' : 'AM';
  const hour12 = hour24 % 12 || 12;
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  const month = months[Number(mo) - 1] || mo;
  const time = `${hour12}:${mm} ${ampm}`;
  const zone = tz ? ` ${tz}` : '';
  return `${month} ${Number(d)}, ${y}, ${time}${zone}`;
}

export function formatShortDate(iso?: string): string {
  if (!iso) return 'n/a';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso.slice(0, 10);
  const date = d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
  const time = d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'UTC',
  });
  return `${date} · ${time} UTC`;
}

export function countdownParts(now = new Date()): {
  expired: boolean;
  days: number;
  hours: number;
  minutes: number;
  label: string;
} {
  const ms = COMMENT_PERIOD_END.getTime() - now.getTime();
  if (ms <= 0) {
    return {
      expired: true,
      days: 0,
      hours: 0,
      minutes: 0,
      label: 'Comment window closed',
    };
  }
  const days = Math.floor(ms / (24 * 60 * 60 * 1000));
  const hours = Math.floor((ms % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  const minutes = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
  return {
    expired: false,
    days,
    hours,
    minutes,
    label: `${days}d ${hours}h ${minutes}m left`,
  };
}

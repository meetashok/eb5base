'use client';

import { useMemo, useState } from 'react';
import type { NprmComment, NprmTheme } from '@/lib/nprm/types';
import {
  commentUrl,
  formatLastPull,
  formatShortDate,
  parsePoster,
  plainDash,
} from '@/lib/nprm/utils';

type PosterFilter = 'all' | 'anonymous' | 'named' | 'org';

interface Props {
  comments: NprmComment[];
  themes: NprmTheme[];
  lastPull?: string;
}

function commentNumber(id: string): number {
  const m = id.match(/(\d+)$/);
  return m ? Number(m[1]) : 0;
}

function shortId(id: string): string {
  const m = id.match(/(\d+)$/);
  return m ? `#${m[1]}` : id;
}

function themeLabel(
  comment: NprmComment,
  themes: NprmTheme[]
): string | null {
  if (comment.themeTitle) return comment.themeTitle;
  if (comment.themeId) {
    const match = themes.find((t) => t.id === comment.themeId);
    if (match) return match.title;
    return comment.themeId;
  }
  return null;
}

export default function CommentsTab({
  comments,
  themes,
  lastPull,
}: Props) {
  const [themeFilter, setThemeFilter] = useState<string>('all');
  const [posterFilter, setPosterFilter] = useState<PosterFilter>('all');
  const [query, setQuery] = useState('');
  const lastPullLabel = formatLastPull(lastPull);

  const themeOptions = useMemo(() => {
    const counts = new Map<string, { id: string; label: string; count: number }>();
    for (const c of comments) {
      const id = c.themeId || 'unknown';
      const label = themeLabel(c, themes) || id;
      const prev = counts.get(id);
      if (prev) prev.count += 1;
      else counts.set(id, { id, label, count: 1 });
    }
    return [
      { id: 'all', label: `All themes (${comments.length})` },
      ...Array.from(counts.values())
        .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
        .map((t) => ({ id: t.id, label: `${t.label} (${t.count})` })),
    ];
  }, [comments, themes]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = comments.filter((c) => {
      const { posterType } = parsePoster(c.attributes?.title);
      if (posterFilter !== 'all' && posterType !== posterFilter) return false;
      if (themeFilter !== 'all' && (c.themeId || 'unknown') !== themeFilter) {
        return false;
      }
      if (q) {
        const ai = (c.aiSummary || c.attributes?.aiSummary || '').toLowerCase();
        const title = (c.attributes?.title || '').toLowerCase();
        const id = c.id.toLowerCase();
        const theme = (themeLabel(c, themes) || '').toLowerCase();
        if (
          !ai.includes(q) &&
          !title.includes(q) &&
          !id.includes(q) &&
          !theme.includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
    return [...list].sort((a, b) => {
      const dateA = a.attributes?.postedDate || '';
      const dateB = b.attributes?.postedDate || '';
      if (dateA !== dateB) return dateB.localeCompare(dateA);
      return commentNumber(b.id) - commentNumber(a.id);
    });
  }, [comments, posterFilter, query, themeFilter, themes]);

  const posterOptions = useMemo(() => {
    const counts = { all: comments.length, anonymous: 0, named: 0, org: 0 };
    for (const c of comments) {
      const { posterType } = parsePoster(c.attributes?.title);
      counts[posterType] += 1;
    }
    return [
      { id: 'all' as const, label: `All posters (${counts.all})` },
      { id: 'anonymous' as const, label: `Anonymous (${counts.anonymous})` },
      { id: 'named' as const, label: `Named person (${counts.named})` },
      { id: 'org' as const, label: `Organization (${counts.org})` },
    ];
  }, [comments]);

  const topThemeNote = useMemo(() => {
    const top = themeOptions.find((t) => t.id !== 'all');
    if (!top) return null;
    return `${top.label} is the most common theme label from the feed (not a bug). Poster names come from regulations.gov titles; AI summaries stay generic.`;
  }, [themeOptions]);

  function filterBtnClass(active: boolean) {
    return `btn btn-xs h-7 min-h-0 px-2.5 border focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-secondary ${
      active
        ? 'btn-primary text-primary-content border-primary'
        : 'btn-ghost bg-base-100 border-base-300 text-neutral hover:border-secondary/50'
    }`;
  }

  return (
    <div className="space-y-6 animate-[fadeIn_0.35s_ease-out]">
      <div className="space-y-2 max-w-2xl">
        <h2 className="text-xl font-bold text-primary">
          Comments ({filtered.length}
          {filtered.length !== comments.length ? ` of ${comments.length}` : ''})
        </h2>
        <p className="text-sm text-neutral leading-relaxed">
          Summaries of comments filed on Docket USCIS-2026-0100. Sorted by
          posted date, newest first. Data as of last pull: {lastPullLabel}.
        </p>
        <p className="text-xs leading-relaxed text-amber-800 bg-amber-50 border border-amber-200/80 rounded-md px-2.5 py-1.5">
          AI summaries are for browsing only and may be incomplete. Always verify
          against the original filing on regulations.gov (Verify link on each
          card). This list may lag newer filings after {lastPullLabel}. Source:
          regulations.gov via api.data.gov.
        </p>
        {topThemeNote ? (
          <p className="text-xs text-neutral/75 leading-relaxed">
            Theme counts: {topThemeNote}
          </p>
        ) : null}
      </div>

      <div className="space-y-3 sticky top-[calc(var(--site-sticky-offset)+3.25rem)] z-30 -mx-1 px-1 py-2 bg-base-100/95 backdrop-blur-sm border-b border-base-300/60">
        <div>
          <label
            htmlFor="nprm-comment-search"
            className="text-[11px] uppercase tracking-wider font-bold text-neutral/70 mb-1.5 block"
          >
            Search
          </label>
          <div className="flex flex-wrap gap-2 items-center">
            <input
              id="nprm-comment-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Keyword, ID, or theme (e.g. bridge, sustainment)"
              className="input input-sm input-bordered w-full max-w-md bg-base-100 focus:outline-secondary"
            />
            {(themeFilter !== 'all' || posterFilter !== 'all' || query) && (
              <button
                type="button"
                className="btn btn-xs btn-ghost"
                onClick={() => {
                  setThemeFilter('all');
                  setPosterFilter('all');
                  setQuery('');
                }}
              >
                Clear filters
              </button>
            )}
          </div>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-wider font-bold text-neutral/70 mb-1.5">
            Theme
          </p>
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by theme">
            {themeOptions.map((opt) => (
              <button
                key={opt.id}
                type="button"
                className={filterBtnClass(themeFilter === opt.id)}
                aria-pressed={themeFilter === opt.id}
                onClick={() => setThemeFilter(opt.id)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-wider font-bold text-neutral/70 mb-1.5">
            Poster type
          </p>
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by poster type">
            {posterOptions.map((opt) => (
              <button
                key={opt.id}
                type="button"
                className={filterBtnClass(posterFilter === opt.id)}
                aria-pressed={posterFilter === opt.id}
                onClick={() => setPosterFilter(opt.id)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <ul className="space-y-3">
        {filtered.map((comment) => {
          const { poster } = parsePoster(comment.attributes?.title);
          const theme = themeLabel(comment, themes);
          const ai = comment.aiSummary || comment.attributes?.aiSummary;
          const source = comment.sourceLink || commentUrl(comment.id);

          return (
            <li key={comment.id}>
              <article className="rounded-xl border-2 border-base-300 bg-base-100 p-4 sm:p-5 shadow-sm space-y-2.5">
                <header className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="inline-flex items-center rounded-md border border-base-300 bg-base-200 px-2 py-0.5 font-mono text-[11px] font-bold text-neutral">
                      {shortId(comment.id)}
                    </span>
                    <a
                      href={source}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold text-primary text-base leading-snug underline underline-offset-2 decoration-secondary/50 hover:text-secondary"
                    >
                      {comment.id}
                    </a>
                    <span className="text-sm font-medium text-neutral">
                      ({poster})
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
                    <p className="text-xs font-medium text-neutral/75">
                      Submitted {formatShortDate(comment.attributes?.postedDate)}
                    </p>
                    {theme ? (
                      <span className="inline-flex max-w-full items-center rounded-md border border-secondary/35 bg-secondary/10 px-2 py-0.5 text-[11px] font-semibold text-secondary leading-snug">
                        {plainDash(theme)}
                      </span>
                    ) : null}
                    <a
                      href={source}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] font-semibold text-secondary underline underline-offset-2"
                    >
                      Verify ↗
                    </a>
                  </div>
                </header>

                <div className="space-y-1.5">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-neutral/70">
                    AI generated summary
                  </p>
                  {ai ? (
                    <p className="text-sm text-neutral leading-relaxed">
                      {plainDash(ai)}
                    </p>
                  ) : (
                    <p className="text-sm text-neutral leading-relaxed">
                      No summary available for this comment yet.
                    </p>
                  )}
                </div>
              </article>
            </li>
          );
        })}
      </ul>

      {filtered.length === 0 && (
        <p className="text-sm text-neutral rounded-xl border-2 border-dashed border-base-300 p-4">
          No comments match that theme. Clear filters to see all filings.
        </p>
      )}

      <div className="rounded-xl border-2 border-secondary/30 bg-secondary/10 px-4 py-4 space-y-1">
        <p className="text-sm font-bold text-primary">Trust & source</p>
        <p className="text-xs text-neutral leading-relaxed">
          Source: regulations.gov via api.data.gov · Live feed · Titles from
          regulations.gov · Last pull {lastPullLabel}. Official filings may be
          newer; always check the docket. Explainer cites FR Doc 2026-13392.
        </p>
      </div>
    </div>
  );
}

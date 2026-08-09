'use client';

import { useMemo, useState } from 'react';
import type { NprmComment, NprmTheme } from '@/lib/nprm/types';
import {
  commentUrl,
  formatLastPull,
  formatShortDate,
  parsePoster,
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
  const lastPullLabel = formatLastPull(lastPull);

  const filtered = useMemo(() => {
    const list = comments.filter((c) => {
      const { posterType } = parsePoster(c.attributes?.title);
      if (posterFilter !== 'all' && posterType !== posterFilter) return false;
      if (themeFilter !== 'all' && c.themeId !== themeFilter) return false;
      return true;
    });
    // Highest comment number first (later filings get higher IDs).
    return [...list].sort(
      (a, b) => commentNumber(b.id) - commentNumber(a.id)
    );
  }, [comments, posterFilter, themeFilter]);

  const posterOptions: { id: PosterFilter; label: string }[] = [
    { id: 'all', label: 'All posters' },
    { id: 'anonymous', label: 'Anonymous' },
    { id: 'named', label: 'Named person' },
    { id: 'org', label: 'Organization' },
  ];

  const themeOptions = [
    { id: 'all', label: 'All themes' },
    ...themes.map((t) => ({ id: t.id, label: t.title })),
  ];

  function filterBtnClass(active: boolean) {
    return `btn btn-xs h-7 min-h-0 px-2.5 border ${
      active
        ? 'btn-primary text-primary-content border-primary'
        : 'btn-ghost bg-base-100 border-base-300 text-neutral hover:border-secondary/50'
    }`;
  }

  return (
    <div className="space-y-6 animate-[fadeIn_0.35s_ease-out]">
      <div className="space-y-2 max-w-2xl">
        <h2 className="text-xl font-bold text-primary">
          Comments ({filtered.length})
        </h2>
        <p className="text-sm text-neutral leading-relaxed">
          This page summarizes comments submitted so far on Docket
          USCIS-2026-0100. For the full comment text, open the linked filing on
          regulations.gov. Comments are sorted by comment number, newest ID
          first. Data as of last pull: {lastPullLabel}.
        </p>
        <p className="text-xs leading-relaxed text-amber-800 bg-amber-50 border border-amber-200/80 rounded-md px-2.5 py-1.5">
          Warning: this list may be incomplete. Latest data pulled as of{' '}
          {lastPullLabel}. Check regulations.gov for any newer filings.
        </p>
      </div>

      <div className="space-y-3">
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
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
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
                        {theme}
                      </span>
                    ) : null}
                  </div>
                </header>

                <div className="space-y-1.5">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-neutral/70">
                    AI generated summary
                  </p>
                  {ai ? (
                    <p className="text-sm text-neutral leading-relaxed">{ai}</p>
                  ) : (
                    <p className="text-sm text-neutral leading-relaxed">
                      No summary available for this comment yet.
                    </p>
                  )}
                  <p className="text-xs leading-relaxed text-amber-800 bg-amber-50 border border-amber-200/80 rounded-md px-2.5 py-1.5">
                    This summary may be incomplete or inaccurate. Please read
                    the{' '}
                    <a
                      href={source}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-amber-900 underline underline-offset-2"
                    >
                      original comment on regulations.gov
                    </a>{' '}
                    to verify.
                  </p>
                </div>
              </article>
            </li>
          );
        })}
      </ul>

      {filtered.length === 0 && (
        <p className="text-sm text-neutral">
          No comments match these filters.
        </p>
      )}
    </div>
  );
}

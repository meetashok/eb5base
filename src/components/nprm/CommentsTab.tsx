'use client';

import { useMemo, useState } from 'react';
import type { NprmComment, NprmTheme } from '@/lib/nprm/types';
import {
  buildCommentThemeIndex,
  commentSnippet,
  commentUrl,
  formatShortDate,
  groundedAiSummary,
  parsePoster,
} from '@/lib/nprm/utils';

type PosterFilter = 'all' | 'anonymous' | 'named' | 'org';

interface Props {
  comments: NprmComment[];
  themes: NprmTheme[];
}

export default function CommentsTab({ comments, themes }: Props) {
  const [themeFilter, setThemeFilter] = useState<string>('all');
  const [posterFilter, setPosterFilter] = useState<PosterFilter>('all');
  const [expanded, setExpanded] = useState<string | null>(null);

  const themeIndex = useMemo(() => buildCommentThemeIndex(themes), [themes]);
  const themeById = useMemo(
    () => new Map(themes.map((t) => [t.id, t])),
    [themes]
  );

  const filtered = useMemo(() => {
    const list = comments.filter((c) => {
      const { posterType } = parsePoster(c.attributes?.title);
      if (posterFilter !== 'all' && posterType !== posterFilter) return false;
      if (themeFilter !== 'all') {
        const ids = themeIndex.get(c.id) || [];
        if (!ids.includes(themeFilter)) return false;
      }
      return true;
    });
    return [...list].sort((a, b) => {
      const da = a.attributes?.postedDate || '';
      const db = b.attributes?.postedDate || '';
      return db.localeCompare(da);
    });
  }, [comments, posterFilter, themeFilter, themeIndex]);

  return (
    <div className="space-y-6 animate-[fadeIn_0.35s_ease-out]">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-primary">
            Comments ({filtered.length})
          </h2>
          <p className="text-sm text-neutral mt-1 max-w-xl leading-relaxed">
            Sorted by date descending. Theme filter only includes comments with grounded sample IDs.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            className="select select-bordered select-sm border-2 font-medium"
            value={themeFilter}
            onChange={(e) => setThemeFilter(e.target.value)}
            aria-label="Filter by theme"
          >
            <option value="all">All themes</option>
            {themes.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </select>
          <select
            className="select select-bordered select-sm border-2 font-medium"
            value={posterFilter}
            onChange={(e) => setPosterFilter(e.target.value as PosterFilter)}
            aria-label="Filter by poster type"
          >
            <option value="all">All posters</option>
            <option value="anonymous">Anonymous</option>
            <option value="named">Named person</option>
            <option value="org">Organization</option>
          </select>
        </div>
      </div>

      <ul className="space-y-3">
        {filtered.map((comment) => {
          const { poster, posterType } = parsePoster(comment.attributes?.title);
          const isOpen = expanded === comment.id;
          const ai =
            comment.attributes?.aiSummary ||
            groundedAiSummary(comment.id, themes);
          const original =
            comment.attributes?.originalText ||
            (comment.attributes?.highlightedContent || '').trim() ||
            '';
          const themeIds = themeIndex.get(comment.id) || [];

          return (
            <li key={comment.id}>
              <article className="rounded-xl border-2 border-base-300 bg-base-100 overflow-hidden shadow-sm">
                <button
                  type="button"
                  className="w-full text-left px-4 py-3 sm:px-5 sm:py-4 hover:bg-base-200/70 transition-colors"
                  onClick={() =>
                    setExpanded((cur) => (cur === comment.id ? null : comment.id))
                  }
                  aria-expanded={isOpen}
                >
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <span className="font-bold text-primary">{poster}</span>
                    <span className="badge badge-sm border border-base-300 bg-base-200 text-neutral font-semibold uppercase tracking-wide">
                      {posterType}
                    </span>
                    <span className="text-xs font-medium text-neutral/75">
                      {formatShortDate(comment.attributes?.postedDate)}
                    </span>
                    {themeIds.map((tid) => (
                      <span
                        key={tid}
                        className="badge badge-sm badge-secondary badge-outline font-semibold"
                      >
                        {themeById.get(tid)?.title || tid}
                      </span>
                    ))}
                  </div>
                  <p className="text-sm text-neutral leading-relaxed">
                    {commentSnippet(comment)}
                  </p>
                </button>

                {isOpen && (
                  <div className="border-t-2 border-base-300 px-4 py-4 sm:px-5 space-y-3 bg-base-200/40">
                    {ai ? (
                      <div className="rounded-lg border-2 border-info/40 bg-base-100 p-3">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-info mb-1.5">
                          [AI summary]
                        </p>
                        <p className="text-sm text-neutral leading-relaxed">
                          {ai}
                        </p>
                        <p className="text-[11px] text-neutral/70 mt-2">
                          Grounded in theme summaries tied to this comment ID — not a substitute for the original filing.
                        </p>
                      </div>
                    ) : (
                      <div className="rounded-lg border-2 border-dashed border-base-300 p-3 text-sm text-neutral">
                        [AI summary] Not available for this stub yet. Open the source on regulations.gov.
                      </div>
                    )}

                    <details className="rounded-lg border-2 border-base-300 bg-base-100">
                      <summary className="cursor-pointer px-3 py-2 text-sm font-bold text-primary">
                        [Original]
                      </summary>
                      <div className="px-3 pb-3 text-sm text-neutral leading-relaxed whitespace-pre-wrap">
                        {original
                          ? original
                          : 'Original full text is not in the lightweight feed yet. Use the Source link below for the regulations.gov record.'}
                      </div>
                    </details>

                    <footer className="text-xs text-neutral pt-1">
                      Source:{' '}
                      <a
                        href={commentUrl(comment.id)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-secondary underline underline-offset-2"
                      >
                        {comment.id}
                      </a>
                    </footer>
                  </div>
                )}
              </article>
            </li>
          );
        })}
      </ul>

      {filtered.length === 0 && (
        <p className="text-sm text-neutral">
          No comments match these filters. Theme filter only shows comments listed as sample_ids.
        </p>
      )}
    </div>
  );
}

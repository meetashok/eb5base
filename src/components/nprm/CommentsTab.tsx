'use client';

import { useMemo, useState } from 'react';
import type { NprmComment, NprmTheme } from '@/lib/nprm/types';
import {
  buildCommentThemeIndex,
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

function shortCommentId(id: string): string {
  const m = id.match(/(\d+)$/);
  return m ? m[1] : id;
}

function commentNumber(id: string): number {
  const m = id.match(/(\d+)$/);
  return m ? Number(m[1]) : 0;
}

export default function CommentsTab({ comments, themes }: Props) {
  const [themeFilter, setThemeFilter] = useState<string>('all');
  const [posterFilter, setPosterFilter] = useState<PosterFilter>('all');

  const themeIndex = useMemo(() => buildCommentThemeIndex(themes), [themes]);

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
    // Highest comment number first (later filings get higher IDs).
    return [...list].sort(
      (a, b) => commentNumber(b.id) - commentNumber(a.id)
    );
  }, [comments, posterFilter, themeFilter, themeIndex]);

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
    return `btn btn-sm border-2 ${
      active
        ? 'btn-primary text-primary-content border-primary'
        : 'btn-ghost bg-base-100 border-base-300 text-neutral hover:border-secondary/50'
    }`;
  }

  return (
    <div className="space-y-6 animate-[fadeIn_0.35s_ease-out]">
      <div>
        <h2 className="text-xl font-bold text-primary">
          Comments ({filtered.length})
        </h2>
        <p className="text-sm text-neutral mt-1 max-w-xl leading-relaxed">
          Sorted by comment number (newest ID first). Full comment text lives on
          regulations.gov. Theme filter only includes comments with grounded
          sample IDs.
        </p>
      </div>

      <div className="space-y-3">
        <div>
          <p className="text-[11px] uppercase tracking-wider font-bold text-neutral/70 mb-1.5">
            Theme
          </p>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by theme">
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
            Poster
          </p>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by poster type">
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
          const ai =
            comment.attributes?.aiSummary ||
            groundedAiSummary(comment.id, themes);
          const source = commentUrl(comment.id);
          const idLabel = shortCommentId(comment.id);

          return (
            <li key={comment.id}>
              <article className="rounded-xl border-2 border-base-300 bg-base-100 p-4 sm:p-5 shadow-sm space-y-3">
                <header className="space-y-1">
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
                  <p className="text-xs font-medium text-neutral/75">
                    Submitted {formatShortDate(comment.attributes?.postedDate)}
                  </p>
                </header>

                <div className="rounded-lg border-2 border-info/35 bg-info/5 p-3">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-info mb-1.5">
                    AI-generated summary
                  </p>
                  {ai ? (
                    <p className="text-sm text-neutral leading-relaxed">{ai}</p>
                  ) : (
                    <p className="text-sm text-neutral leading-relaxed">
                      No summary available for this comment yet.
                    </p>
                  )}
                  <p className="text-xs text-neutral mt-2 leading-relaxed">
                    This summary may be incomplete or inaccurate. Please read the{' '}
                    <a
                      href={source}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-secondary underline underline-offset-2"
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
          No comments match these filters. Theme filter only shows comments listed as sample_ids.
        </p>
      )}
    </div>
  );
}

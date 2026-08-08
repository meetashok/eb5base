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
            Sorted by date descending. Full comment text lives on regulations.gov.
            Theme filter only includes comments with grounded sample IDs.
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
                    <h3 className="font-bold text-primary text-base leading-snug">
                      {poster}
                    </h3>
                    <a
                      href={source}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-semibold text-secondary underline underline-offset-2"
                    >
                      Comment {idLabel} ↗
                    </a>
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

'use client';

import type { NprmTheme } from '@/lib/nprm/types';
import { commentUrl } from '@/lib/nprm/utils';

interface Props {
  themes: NprmTheme[];
  selectedOpinions: Record<string, string>;
  onSelectOpinion: (themeId: string, opinionId: string) => void;
  onWriteWithTheme: (themeId: string, opinionId: string) => void;
}

export default function ThemesTab({
  themes,
  selectedOpinions,
  onSelectOpinion,
  onWriteWithTheme,
}: Props) {
  return (
    <div className="space-y-6 animate-[fadeIn_0.35s_ease-out]">
      <div>
        <h2 className="text-xl font-bold text-primary">Six grounded themes</h2>
        <p className="text-sm text-neutral mt-1 max-w-2xl leading-relaxed">
          Context and sample IDs come from real regulations.gov comments — not invented talking points.
          Pick an opinion, then continue in Write.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {themes.map((theme) => {
          const selected = selectedOpinions[theme.id];
          return (
            <article
              key={theme.id}
              className="rounded-xl border-2 border-base-300 bg-base-100 p-4 sm:p-5 flex flex-col gap-3 shadow-soft"
            >
              <div>
                <h3 className="font-bold text-primary text-lg leading-snug">
                  {theme.title}
                </h3>
                <p className="text-sm text-neutral mt-2 leading-relaxed">
                  {theme.summary}
                </p>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {theme.cfrs.map((cfr) => (
                  <span
                    key={cfr}
                    className="inline-flex items-center rounded-md border border-base-300 bg-base-200 px-2 py-0.5 text-[11px] font-semibold text-neutral"
                  >
                    {cfr}
                  </span>
                ))}
              </div>

              <div className="flex flex-wrap gap-2 text-xs">
                <span className="font-semibold text-neutral/70">Samples:</span>
                {theme.sample_ids.map((id) => (
                  <a
                    key={id}
                    href={commentUrl(id)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-secondary underline underline-offset-2"
                  >
                    {id.replace('USCIS-2026-0100-', '')}
                  </a>
                ))}
              </div>

              <div className="space-y-2 mt-auto pt-1">
                <p className="text-[11px] uppercase tracking-wider font-bold text-neutral/70">
                  Opinions
                </p>
                <div className="flex flex-col gap-2">
                  {theme.opinions.map((op) => {
                    const active = selected === op.id;
                    return (
                      <button
                        key={op.id}
                        type="button"
                        onClick={() => onSelectOpinion(theme.id, op.id)}
                        className={`text-left rounded-lg border-2 px-3 py-2.5 text-sm transition-colors duration-150 ${
                          active
                            ? 'border-secondary bg-secondary/15 text-primary'
                            : 'border-base-300 bg-base-100 hover:border-secondary/60 text-neutral'
                        }`}
                      >
                        <span className="font-semibold">{op.label}</span>
                        <span className="block text-xs text-neutral/80 mt-0.5 leading-relaxed">
                          {op.stance}
                        </span>
                      </button>
                    );
                  })}
                </div>
                {selected && (
                  <button
                    type="button"
                    className="btn btn-sm btn-secondary mt-1"
                    onClick={() => onWriteWithTheme(theme.id, selected)}
                  >
                    Use in Write tab
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

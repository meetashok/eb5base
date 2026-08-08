'use client';

import NprmDisclaimer from '@/components/nprm/NprmDisclaimer';
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
        <p className="text-sm text-neutral/60 mt-1 max-w-2xl leading-relaxed">
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
              className="rounded-xl border border-base-300/80 bg-base-100 p-4 sm:p-5 flex flex-col gap-3"
            >
              <div>
                <h3 className="font-semibold text-primary text-lg leading-snug">
                  {theme.title}
                </h3>
                <p className="text-sm text-neutral/65 mt-2 leading-relaxed">
                  {theme.summary}
                </p>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {theme.cfrs.map((cfr) => (
                  <span
                    key={cfr}
                    className="inline-flex items-center rounded-md border border-base-300 bg-base-200/70 px-2 py-0.5 text-[11px] font-medium text-neutral/70"
                  >
                    {cfr}
                  </span>
                ))}
              </div>

              <div className="flex flex-wrap gap-2 text-xs">
                {theme.sample_ids.map((id) => (
                  <a
                    key={id}
                    href={commentUrl(id)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link link-hover text-secondary font-medium"
                  >
                    {id.replace('USCIS-2026-0100-', '')}
                  </a>
                ))}
              </div>

              <div className="space-y-2 mt-auto pt-1">
                <p className="text-[11px] uppercase tracking-wider font-semibold text-neutral/45">
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
                        className={`text-left rounded-lg border px-3 py-2 text-sm transition-colors duration-150 ${
                          active
                            ? 'border-secondary bg-secondary/10 text-primary'
                            : 'border-base-300 hover:border-secondary/50 text-neutral/80'
                        }`}
                      >
                        <span className="font-medium">{op.label}</span>
                        <span className="block text-xs text-neutral/55 mt-0.5 leading-relaxed">
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

      <NprmDisclaimer />
    </div>
  );
}

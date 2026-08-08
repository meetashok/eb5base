'use client';

import { useMemo, useState } from 'react';
import {
  DISTINCTNESS_WARNING,
  PROJECT_TYPE_OPTIONS,
} from '@/lib/nprm/constants';
import {
  PROMPT_DIVERSITY_NOTE,
  buildPersonalOnly,
  buildPrompt,
  canCopyPrompt,
} from '@/lib/nprm/prompt';
import type {
  FormatGuideline,
  LengthGuideline,
  NprmPromptNode,
  NprmTheme,
  PersonalBlock,
  ProjectTypeOption,
  StyleGuideline,
} from '@/lib/nprm/types';
import { COMMENT_ON_URL } from '@/lib/nprm/utils';

interface Props {
  themes: NprmTheme[];
  promptTree: NprmPromptNode[];
  initialThemeIds?: string[];
  initialOpinions?: Record<string, string>;
}

const MAX_THEMES = 3;

export default function WriteTab({
  themes,
  promptTree,
  initialThemeIds = [],
  initialOpinions = {},
}: Props) {
  const [themeIds, setThemeIds] = useState<string[]>(() =>
    initialThemeIds.slice(0, MAX_THEMES)
  );
  const [opinions, setOpinions] = useState<Record<string, string>>(
    () => initialOpinions
  );
  const [personal, setPersonal] = useState<PersonalBlock>({
    i_526e_file_date: '',
    project_type: '',
    impact: '',
  });
  const [length, setLength] = useState<LengthGuideline>('300_450');
  const [style, setStyle] = useState<StyleGuideline>('plain');
  const [format, setFormat] = useState<FormatGuideline>('paragraphs');
  const [copyMsg, setCopyMsg] = useState<string | null>(null);

  const ready = canCopyPrompt(personal);
  const impactLen = personal.impact.trim().length;

  const prompt = useMemo(
    () =>
      buildPrompt({
        themes,
        promptTree,
        selectedThemeIds: themeIds,
        opinionsByTheme: opinions,
        personal,
        guidelines: { length, style, format },
        rotationSeed: impactLen + themeIds.length,
      }),
    [
      themes,
      promptTree,
      themeIds,
      opinions,
      personal,
      length,
      style,
      format,
      impactLen,
    ]
  );

  function toggleTheme(id: string) {
    setThemeIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= MAX_THEMES) return prev;
      return [...prev, id];
    });
  }

  async function copyText(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopyMsg(`${label} copied`);
      window.setTimeout(() => setCopyMsg(null), 2000);
    } catch {
      setCopyMsg('Copy failed — select the text manually');
      window.setTimeout(() => setCopyMsg(null), 3000);
    }
  }

  return (
    <div className="space-y-4 animate-[fadeIn_0.35s_ease-out]">
      <div>
        <h2 className="text-xl font-bold text-primary">Prompt Lab</h2>
        <p className="text-sm text-neutral mt-1 max-w-2xl leading-relaxed">
          Deterministic prompt builder — no server LLM key. Paste into your own ChatGPT/Claude/Gemini, then paste the final draft into regulations.gov.
        </p>
        <p className="text-xs text-neutral/75 mt-2 font-mono leading-relaxed">
          {/* Diversity math documented in lib/nprm/prompt.ts */}
          {PROMPT_DIVERSITY_NOTE}
        </p>
      </div>

      <div
        className="rounded-xl border-2 border-warning/50 bg-warning/15 px-3 py-3 text-sm text-neutral font-medium leading-relaxed"
        role="status"
      >
        {DISTINCTNESS_WARNING}
      </div>

      <div className="grid lg:grid-cols-10 gap-5">
        <div className="lg:col-span-3 space-y-5">
          <section className="space-y-2">
            <h3 className="text-sm font-semibold text-primary">
              Step A — Themes (max {MAX_THEMES})
            </h3>
            <div className="space-y-2">
              {themes.map((t) => {
                const checked = themeIds.includes(t.id);
                const disabled = !checked && themeIds.length >= MAX_THEMES;
                return (
                  <label
                    key={t.id}
                    className={`flex items-start gap-2 text-sm rounded-lg border-2 px-3 py-2.5 cursor-pointer font-medium ${
                      checked
                        ? 'border-secondary bg-secondary/15 text-primary'
                        : 'border-base-300 bg-base-100 text-neutral'
                    } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <input
                      type="checkbox"
                      className="checkbox checkbox-sm mt-0.5"
                      checked={checked}
                      disabled={disabled}
                      onChange={() => toggleTheme(t.id)}
                    />
                    <span>{t.title}</span>
                  </label>
                );
              })}
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-primary">
              Step B — Opinion per theme
            </h3>
            {themeIds.length === 0 && (
              <p className="text-xs text-neutral">Select a theme first.</p>
            )}
            {themeIds.map((tid) => {
              const theme = themes.find((t) => t.id === tid);
              if (!theme) return null;
              return (
                <fieldset key={tid} className="space-y-1.5">
                  <legend className="text-xs font-semibold text-neutral">
                    {theme.title}
                  </legend>
                  {theme.opinions.map((op) => (
                    <label
                      key={op.id}
                      className="flex items-start gap-2 text-sm cursor-pointer"
                    >
                      <input
                        type="radio"
                        name={`opinion-${tid}`}
                        className="radio radio-sm mt-0.5"
                        checked={opinions[tid] === op.id}
                        onChange={() =>
                          setOpinions((prev) => ({ ...prev, [tid]: op.id }))
                        }
                      />
                      <span>{op.label}</span>
                    </label>
                  ))}
                </fieldset>
              );
            })}
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-semibold text-primary">
              Step C — Personal block (required)
            </h3>
            <label className="form-control">
              <span className="label-text text-xs">I-526E file date</span>
              <input
                type="text"
                className="input input-bordered input-sm"
                placeholder="e.g. Dec 2025"
                value={personal.i_526e_file_date}
                onChange={(e) =>
                  setPersonal((p) => ({
                    ...p,
                    i_526e_file_date: e.target.value,
                  }))
                }
              />
            </label>
            <label className="form-control">
              <span className="label-text text-xs">Project type</span>
              <select
                className="select select-bordered select-sm"
                value={personal.project_type}
                onChange={(e) =>
                  setPersonal((p) => ({
                    ...p,
                    project_type: e.target.value as ProjectTypeOption | '',
                  }))
                }
              >
                <option value="">Select…</option>
                {PROJECT_TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="form-control">
              <span className="label-text text-xs flex justify-between">
                <span>Personal impact (1–2 lines)</span>
                <span
                  className={
                    impactLen >= 40 ? 'text-success' : 'text-warning'
                  }
                >
                  {impactLen}/40
                </span>
              </span>
              <textarea
                className="textarea textarea-bordered text-sm min-h-24"
                placeholder="e.g. Relocating family for school; capital already deployed; job change timed to I-829"
                value={personal.impact}
                onChange={(e) =>
                  setPersonal((p) => ({ ...p, impact: e.target.value }))
                }
              />
            </label>
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-semibold text-primary">
              Step D — Guidelines
            </h3>
            <div className="space-y-2 text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="checkbox checkbox-sm"
                  checked={length === '150'}
                  onChange={() =>
                    setLength((v) => (v === '150' ? '300_450' : '150'))
                  }
                />
                Length: 150 words (off = 300–450)
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="checkbox checkbox-sm"
                  checked={style === 'formal'}
                  onChange={() =>
                    setStyle((v) => (v === 'formal' ? 'plain' : 'formal'))
                  }
                />
                Style: formal regulatory (off = plain English)
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="checkbox checkbox-sm"
                  checked={format === 'bullets'}
                  onChange={() =>
                    setFormat((v) =>
                      v === 'bullets' ? 'paragraphs' : 'bullets'
                    )
                  }
                />
                Format: bullets (off = paragraphs)
              </label>
            </div>
          </section>
        </div>

        <div className="lg:col-span-7 space-y-3">
          <div className="rounded-xl border border-base-300 bg-primary text-primary-content p-4 sm:p-5">
            <div className="flex items-center justify-between gap-2 mb-3">
              <h3 className="text-sm font-semibold text-accent">
                Deterministic prompt preview
              </h3>
              {copyMsg && (
                <span className="text-xs text-accent">{copyMsg}</span>
              )}
            </div>
            <pre className="whitespace-pre-wrap text-xs sm:text-sm font-mono leading-relaxed text-primary-content/90 max-h-[28rem] overflow-auto">
              {prompt}
            </pre>
          </div>

          <div className="flex flex-col sm:flex-row flex-wrap gap-2">
            <button
              type="button"
              className="btn btn-accent text-accent-content"
              disabled={!ready || themeIds.length === 0}
              title={
                ready
                  ? 'Copy full prompt'
                  : 'Fill file date, project type, and 40+ char impact first'
              }
              onClick={() => copyText(prompt, 'Prompt')}
            >
              Copy prompt
            </button>
            <button
              type="button"
              className="btn btn-outline"
              disabled={!ready}
              onClick={() =>
                copyText(buildPersonalOnly(personal), 'Personal block')
              }
            >
              Copy personal-only
            </button>
            <a
              href={COMMENT_ON_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary shadow-glow-green sm:flex-1"
            >
              Open regulations.gov to paste your personal comment
            </a>
          </div>

          {!ready && (
            <p className="text-xs text-warning">
              Copy stays disabled until I-526E date, project type, and impact (40+ characters) are filled. Fragments are not a finished letter.
            </p>
          )}

          <ul className="text-sm text-neutral space-y-1 leading-relaxed">
            <li>- Paste the prompt into your own LLM</li>
            <li>- Edit the draft in your voice</li>
            <li>- Paste the final comment on regulations.gov (we do not POST for you)</li>
            <li>- Consider a 30-minute counsel memo for your file</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

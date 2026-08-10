'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  DISTINCTNESS_WARNING,
  PROJECT_TYPE_OPTIONS,
} from '@/lib/nprm/constants';
import {
  MIN_IMPACT_CHARS,
  buildPersonalOnly,
  buildPrompt,
  canCopyPrompt,
  isPersonalizedEnough,
  templateSimilarity,
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
import { useToast } from '@/components/Toast';

interface Props {
  themes: NprmTheme[];
  promptTree: NprmPromptNode[];
  initialThemeIds?: string[];
  initialOpinions?: Record<string, string>;
}

const MAX_THEMES = 3;
const DRAFT_KEY = 'eb5base_nprm_write_draft_v1';

type GoatCounter = { count?: (opts: { path: string; title?: string; event?: boolean }) => void };

function track(event: string) {
  try {
    const gc = (window as unknown as { goatcounter?: GoatCounter }).goatcounter;
    gc?.count?.({ path: `event/${event}`, title: event, event: true });
  } catch {
    // ignore
  }
}

export default function WriteTab({
  themes,
  promptTree,
  initialThemeIds = [],
  initialOpinions = {},
}: Props) {
  const { toast } = useToast();
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
    investor_type: '',
    country: '',
  });
  const [length, setLength] = useState<LengthGuideline>('300_450');
  const [style, setStyle] = useState<StyleGuideline>('plain');
  const [format, setFormat] = useState<FormatGuideline>('paragraphs');
  const [copyMsg, setCopyMsg] = useState<string | null>(null);
  const [privacyOk, setPrivacyOk] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as {
          themeIds?: string[];
          opinions?: Record<string, string>;
          personal?: PersonalBlock;
          length?: LengthGuideline;
          style?: StyleGuideline;
          format?: FormatGuideline;
        };
        if (parsed.themeIds?.length && initialThemeIds.length === 0) {
          setThemeIds(parsed.themeIds.slice(0, MAX_THEMES));
        }
        if (parsed.opinions && Object.keys(initialOpinions).length === 0) {
          setOpinions(parsed.opinions);
        }
        if (parsed.personal) {
          setPersonal((p) => ({ ...p, ...parsed.personal }));
        }
        if (parsed.length) setLength(parsed.length);
        if (parsed.style) setStyle(parsed.style);
        if (parsed.format) setFormat(parsed.format);
      }
    } catch {
      // ignore corrupt draft
    }
    setHydrated(true);
    track('builder_started');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({ themeIds, opinions, personal, length, style, format })
      );
    } catch {
      // quota
    }
  }, [hydrated, themeIds, opinions, personal, length, style, format]);

  const ready = canCopyPrompt(personal) && privacyOk && themeIds.length > 0;
  const impactLen = personal.impact.trim().length;
  const personalized = isPersonalizedEnough(personal.impact);
  const similarity = templateSimilarity(personal.impact);

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
    if (!ready) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopyMsg(`${label} copied`);
      toast('Copied for regulations.gov', 'success');
      track('builder_copied');
      if (personalized) track('builder_personalized');
      window.setTimeout(() => setCopyMsg(null), 2000);
    } catch {
      setCopyMsg('Copy failed. Select the text manually.');
      window.setTimeout(() => setCopyMsg(null), 3000);
    }
  }

  return (
    <div className="space-y-4 animate-[fadeIn_0.35s_ease-out]">
      <div>
        <h2 className="text-xl font-bold text-primary">Build My Comment</h2>
        <p className="text-sm text-neutral mt-1 max-w-2xl leading-relaxed">
          Personalize a draft for regulations.gov. We do not submit for you and we
          do not store drafts on our servers, only in your browser (localStorage).
        </p>
      </div>

      <div
        className="rounded-xl border-2 border-warning/50 bg-warning/15 px-3 py-3 text-sm text-neutral font-medium leading-relaxed"
        role="status"
      >
        {DISTINCTNESS_WARNING}
      </div>

      {impactLen >= MIN_IMPACT_CHARS && !personalized ? (
        <div
          className="rounded-xl border-2 border-error/50 bg-error/10 px-3 py-3 text-sm text-error font-medium leading-relaxed"
          role="alert"
        >
          Your comment looks too close to a template (
          {Math.round(similarity * 100)}% overlap). Add 1-2 sentences about your
          own case: why you chose EB-5, how long you have waited, what
          redeployment cost you. DHS discounts form letters.
        </div>
      ) : null}

      <div className="grid lg:grid-cols-10 gap-5">
        <div className="lg:col-span-3 space-y-5">
          <section className="space-y-2">
            <h3 className="text-sm font-semibold text-primary">
              Step A: Themes (max {MAX_THEMES})
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
              Step B: Opinion per theme
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
              Step C: Personal block (required)
            </h3>
            <label className="form-control">
              <span className="label-text text-xs">
                When did you file or plan to file?
              </span>
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
              <span className="label-text-alt text-[10px] text-neutral/70">
                Personalizes your comment. Stored only in your browser.
              </span>
            </label>
            <label className="form-control">
              <span className="label-text text-xs">Investor type</span>
              <select
                className="select select-bordered select-sm"
                value={personal.investor_type || ''}
                onChange={(e) =>
                  setPersonal((p) => ({
                    ...p,
                    investor_type: e.target.value as PersonalBlock['investor_type'],
                  }))
                }
              >
                <option value="">Select…</option>
                <option value="pre_ria">Pre-RIA</option>
                <option value="post_ria">Post-RIA 2022+</option>
                <option value="future">Future filer</option>
                <option value="family">Family</option>
              </select>
            </label>
            <label className="form-control">
              <span className="label-text text-xs">Country chargeability</span>
              <select
                className="select select-bordered select-sm"
                value={personal.country || ''}
                onChange={(e) =>
                  setPersonal((p) => ({ ...p, country: e.target.value }))
                }
              >
                <option value="">Select…</option>
                <option value="India">India</option>
                <option value="China">China</option>
                <option value="ROW">Rest of World</option>
              </select>
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
                <span>Personal story (required)</span>
                <span
                  className={
                    impactLen >= MIN_IMPACT_CHARS && personalized
                      ? 'text-success'
                      : 'text-warning'
                  }
                >
                  {impactLen}/{MIN_IMPACT_CHARS}
                </span>
              </span>
              <textarea
                className="textarea textarea-bordered text-sm min-h-28"
                placeholder="Why you chose EB-5, how long you have waited, what redeployment or RC issues cost you…"
                value={personal.impact}
                onChange={(e) =>
                  setPersonal((p) => ({ ...p, impact: e.target.value }))
                }
              />
              <span className="label-text-alt text-[10px] text-neutral/70">
                Your comment needs personal facts. Example: wait time, capital
                already deployed, school/job timing tied to I-829.
              </span>
            </label>
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-semibold text-primary">
              Step D: Guidelines
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
                Length: ~150 words (off = 300 to 450)
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

          <label className="flex items-start gap-2 text-xs text-neutral cursor-pointer rounded-lg border border-base-300 p-3 bg-base-100">
            <input
              type="checkbox"
              className="checkbox checkbox-sm mt-0.5"
              checked={privacyOk}
              onChange={(e) => setPrivacyOk(e.target.checked)}
            />
            <span>
              I understand not to include A-Number, receipt number, or home
              address in a public comment.
            </span>
          </label>
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
              disabled={!ready}
              title={
                ready
                  ? 'Copy full prompt'
                  : 'Complete personal block, privacy checkbox, and themes first'
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
              data-goatcounter-click="nprm-regulations-gov"
              onClick={() => track('regulations_gov_clicked')}
              className="btn btn-secondary shadow-glow-green sm:flex-1"
            >
              Open regulations.gov to paste your personal comment
            </a>
          </div>

          {!ready && (
            <p className="text-xs text-warning">
              Copy stays disabled until file date, project type, personal story (
              {MIN_IMPACT_CHARS}+ characters, personalized), privacy checkbox, and
              at least one theme are filled.
            </p>
          )}

          <p className="text-xs text-neutral/75 leading-relaxed">
            EB5 Base does NOT submit for you. Drafts stay in your browser unless
            you copy them. This is not legal advice.
          </p>

          <ul className="text-sm text-neutral space-y-1 leading-relaxed">
            <li>- Paste the prompt into your own LLM</li>
            <li>- Edit the draft in your voice (&gt;30% personal)</li>
            <li>- Paste the final comment on regulations.gov</li>
            <li>- Consider a 30-minute counsel memo for your file</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

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
  personalizationOverlapPercent,
  templateSimilarity,
} from '@/lib/nprm/prompt';
import type {
  FormatGuideline,
  LengthGuideline,
  NprmPromptNode,
  NprmTheme,
  PersonalBlock,
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

const INVESTOR_TYPE_OPTIONS: {
  value: NonNullable<PersonalBlock['investor_type']>;
  label: string;
}[] = [
  { value: 'pre_ria', label: 'Filed before Mar 2022' },
  { value: 'post_ria', label: 'Filed Mar 2022 to now' },
  { value: 'future', label: 'Planning to file' },
  { value: 'family', label: 'Family of investor' },
];

const MAX_STORY_CHARS = 5000;

const COUNTRY_OPTIONS = [
  { value: 'India', label: 'India' },
  { value: 'China', label: 'China' },
  { value: 'ROW', label: 'Rest of World' },
] as const;

function ChoiceChips<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly { value: T; label: string }[];
  value: T | '';
  onChange: (next: T | '') => void;
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-neutral">{label}</p>
      <div className="flex flex-wrap gap-1.5" role="group" aria-label={label}>
        {options.map((opt) => {
          const selected = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(selected ? '' : opt.value)}
              className={`btn btn-xs h-8 min-h-0 px-2.5 border ${
                selected
                  ? 'btn-primary text-primary-content border-primary'
                  : 'btn-ghost bg-base-100 border-base-300 text-neutral'
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

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

  const ready =
    privacyOk &&
    themeIds.length > 0 &&
    canCopyPrompt(personal);
  const impactLen = personal.impact.trim().length;
  const personalized = isPersonalizedEnough(personal.impact);
  const similarity = templateSimilarity(personal.impact);
  const overlapPct = personalizationOverlapPercent(personal.impact);
  const hasPersonalBits = Boolean(
    personal.i_526e_file_date.trim() ||
      personal.project_type ||
      personal.investor_type ||
      personal.country ||
      personal.impact.trim()
  );

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
    const removing = themeIds.includes(id);
    if (removing) {
      setThemeIds((prev) => prev.filter((x) => x !== id));
      setOpinions((ops) => {
        const next = { ...ops };
        delete next[id];
        return next;
      });
      return;
    }
    if (themeIds.length >= MAX_THEMES) return;
    setThemeIds((prev) => [...prev, id]);
    const theme = themes.find((t) => t.id === id);
    const firstOpinion = theme?.opinions[0]?.id;
    if (firstOpinion) {
      setOpinions((ops) =>
        ops[id] ? ops : { ...ops, [id]: firstOpinion }
      );
    }
  }

  async function copyText(text: string, label: string, openRegs = false) {
    if (!ready) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopyMsg(`${label} copied`);
      toast(
        'Copied. Paste on regulations.gov, then clear your clipboard for privacy.',
        'success'
      );
      track('builder_copied');
      if (personalized) track('builder_personalized');
      if (openRegs) {
        window.open(COMMENT_ON_URL, '_blank', 'noopener,noreferrer');
        track('regulations_gov_clicked');
      }
      window.setTimeout(() => setCopyMsg(null), 4000);
    } catch {
      setCopyMsg('Copy failed. Select the text manually.');
      window.setTimeout(() => setCopyMsg(null), 3000);
    }
  }

  function clearDraft() {
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {
      // ignore
    }
    setThemeIds([]);
    setOpinions({});
    setPersonal({
      i_526e_file_date: '',
      project_type: '',
      impact: '',
      investor_type: '',
      country: '',
    });
    setPrivacyOk(false);
    toast('Draft cleared from this browser', 'success');
  }

  return (
    <div className="space-y-4 animate-[fadeIn_0.35s_ease-out]">
      <div>
        <h2 className="text-xl font-bold text-primary">Build My Comment</h2>
        <p className="text-sm text-neutral mt-1 max-w-2xl leading-relaxed">
          Use this page to personalize a draft for{' '}
          <a
            href={COMMENT_ON_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-secondary underline underline-offset-2 hover:text-primary"
          >
            regulations.gov
          </a>
          . We do not submit the comment for you. You will need to file it
          yourself on that site when you are ready.
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
            <p className="text-xs text-neutral leading-relaxed">
              Select a theme, then choose your view right under it.
            </p>
            <div className="space-y-2">
              {themes.map((t) => {
                const checked = themeIds.includes(t.id);
                const disabled = !checked && themeIds.length >= MAX_THEMES;
                return (
                  <div
                    key={t.id}
                    className={`rounded-lg border-2 px-3 py-2.5 ${
                      checked
                        ? 'border-secondary bg-secondary/15'
                        : 'border-base-300 bg-base-100'
                    } ${disabled ? 'opacity-50' : ''}`}
                  >
                    <label
                      className={`flex items-start gap-2 text-sm font-medium ${
                        checked ? 'text-primary' : 'text-neutral'
                      } ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
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
                    {checked ? (
                      <fieldset className="mt-2.5 ml-6 space-y-1.5 border-t border-secondary/20 pt-2.5">
                        <legend className="text-[11px] font-bold uppercase tracking-wider text-secondary/90 px-0.5">
                          Your view
                        </legend>
                        {t.opinions.map((op) => (
                          <label
                            key={op.id}
                            className="flex items-start gap-2 text-sm cursor-pointer text-neutral font-normal"
                          >
                            <input
                              type="radio"
                              name={`opinion-${t.id}`}
                              className="radio radio-sm mt-0.5"
                              checked={opinions[t.id] === op.id}
                              onChange={() =>
                                setOpinions((prev) => ({
                                  ...prev,
                                  [t.id]: op.id,
                                }))
                              }
                            />
                            <span>{op.label}</span>
                          </label>
                        ))}
                      </fieldset>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </section>

          <section className="space-y-3">
            <div>
              <h3 className="text-sm font-semibold text-primary">
                Step B: Your story (required to copy)
              </h3>
              <p className="text-xs text-neutral mt-1 leading-relaxed">
                At least {MIN_IMPACT_CHARS} characters in your own words. Stored
                only in this browser. Do not include an A-Number.
              </p>
            </div>
            <label className="form-control">
              <span className="label-text text-xs">
                When did you file I-526E? (or plan to)
              </span>
              <input
                type="text"
                className="input input-bordered input-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary"
                placeholder="e.g. 2023-03 or Mar 2023"
                value={personal.i_526e_file_date}
                onChange={(e) =>
                  setPersonal((p) => ({
                    ...p,
                    i_526e_file_date: e.target.value,
                  }))
                }
              />
              <span className="label-text-alt text-[10px] text-neutral/70">
                Helps highlight parts that hit you most. Planning to file? Pick
                a future month or leave blank and choose Planning to file.
              </span>
            </label>
            <ChoiceChips
              label="Investor type"
              options={INVESTOR_TYPE_OPTIONS}
              value={personal.investor_type || ''}
              onChange={(next) =>
                setPersonal((p) => ({
                  ...p,
                  investor_type: next,
                }))
              }
            />
            <ChoiceChips
              label="Country chargeability"
              options={COUNTRY_OPTIONS}
              value={(personal.country as (typeof COUNTRY_OPTIONS)[number]['value'] | '') || ''}
              onChange={(next) =>
                setPersonal((p) => ({ ...p, country: next }))
              }
            />
            <ChoiceChips
              label="Project type"
              options={PROJECT_TYPE_OPTIONS}
              value={personal.project_type}
              onChange={(next) =>
                setPersonal((p) => ({
                  ...p,
                  project_type: next,
                }))
              }
            />
            <label className="form-control">
              <span className="label-text text-xs flex justify-between gap-2">
                <span>Tell your story in your words</span>
                <span
                  className={
                    impactLen === 0
                      ? 'text-neutral/60'
                      : impactLen >= MIN_IMPACT_CHARS && personalized
                        ? 'text-success'
                        : 'text-error'
                  }
                >
                  {impactLen}/{MIN_IMPACT_CHARS} (max {MAX_STORY_CHARS})
                </span>
              </span>
              <textarea
                className={`textarea textarea-bordered text-sm min-h-28 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary ${
                  impactLen > 0 && impactLen < MIN_IMPACT_CHARS
                    ? 'border-error'
                    : ''
                }`}
                placeholder="I invested $800K in a rural project near... I filed March 2023. My family waited..."
                maxLength={MAX_STORY_CHARS}
                value={personal.impact}
                onChange={(e) =>
                  setPersonal((p) => ({ ...p, impact: e.target.value }))
                }
              />
              <span className="label-text-alt text-[10px] text-neutral/70">
                Agencies count personal stories more than form letters. Mention
                project type, filing month, why money timing matters. No
                A-Number.
              </span>
            </label>
            <div className="space-y-1.5 rounded-lg border border-base-300 bg-base-100 px-3 py-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-primary">
                  Personalization meter
                </span>
                <span
                  className={
                    impactLen < MIN_IMPACT_CHARS
                      ? 'text-neutral/60'
                      : overlapPct <= 30
                        ? 'text-success'
                        : overlapPct > 70
                          ? 'text-error'
                          : 'text-warning'
                  }
                >
                  {impactLen === 0
                    ? 'Write first'
                    : `${overlapPct}% overlap with template`}
                </span>
              </div>
              <progress
                className={`progress w-full h-2 ${
                  overlapPct > 70
                    ? 'progress-error'
                    : overlapPct <= 30
                      ? 'progress-success'
                      : 'progress-warning'
                }`}
                value={Math.min(100, overlapPct)}
                max={100}
              />
              <p className="text-[10px] text-neutral/70 leading-relaxed">
                Aim under 30% overlap. Over 70% blocks copy so agencies are less
                likely to flag a bulk form letter.
              </p>
            </div>
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-semibold text-primary">
              Step C: Guidelines
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

          <label className="flex items-start gap-2.5 text-xs sm:text-sm text-neutral cursor-pointer rounded-lg border-2 border-base-300 p-3 sm:p-3.5 bg-base-100 leading-relaxed">
            <input
              type="checkbox"
              className="checkbox checkbox-sm mt-0.5 shrink-0"
              checked={privacyOk}
              onChange={(e) => setPrivacyOk(e.target.checked)}
            />
            <span>
              I understand my comment is public on regulations.gov. I will not
              include an A-Number, receipt number, birth date, or home address.
              By using this prompt, I act in my own capacity. EB5 Base does not
              submit comments for me and is not liable for any comment I file.
              This tool is information only, not legal advice.
            </span>
          </label>

          <div className="flex flex-col sm:flex-row flex-wrap gap-2">
            <button
              type="button"
              className="btn btn-accent text-accent-content focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              disabled={!ready}
              title={
                ready
                  ? 'Copy full prompt'
                  : 'Select a theme, write 100+ personal characters with low template overlap, and accept the privacy checkbox'
              }
              onClick={() => copyText(prompt, 'Prompt', true)}
            >
              Copy and open regulations.gov
            </button>
            <button
              type="button"
              className="btn btn-outline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary"
              disabled={!ready || !hasPersonalBits}
              title={
                hasPersonalBits
                  ? 'Copy personal details only'
                  : 'Add personal details first'
              }
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
              className="btn btn-secondary shadow-glow-green sm:flex-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary"
            >
              Open regulations.gov
            </a>
            <button
              type="button"
              className="btn btn-ghost btn-sm text-neutral/70"
              onClick={clearDraft}
            >
              Clear draft
            </button>
          </div>

          {!ready && (
            <p className="text-xs text-warning">
              Copy stays disabled until you: (1) select at least one theme, (2)
              write at least {MIN_IMPACT_CHARS} personal characters with under
              70% template overlap, and (3) accept the privacy checkbox.
            </p>
          )}

          <section className="rounded-xl border-2 border-base-300 bg-base-100 p-4 sm:p-5 shadow-sm space-y-3">
            <h3 className="text-sm font-semibold text-primary">
              What to do after you copy
            </h3>
            <ol className="list-decimal pl-5 text-sm text-neutral space-y-1.5 leading-relaxed">
              <li>Paste the prompt into your own LLM</li>
              <li>Edit the draft in your voice (aim for more than 30% personal)</li>
              <li>Paste the final comment on regulations.gov</li>
              <li>Consider a 30-minute counsel memo for your file</li>
            </ol>
            <p className="text-xs text-neutral/75 leading-relaxed">
              EB5 Base does not submit for you. Drafts stay in your browser unless
              you copy them. This is not legal advice.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

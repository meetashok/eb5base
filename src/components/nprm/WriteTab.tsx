'use client';

import { useEffect, useMemo, useState } from 'react';
import { PROJECT_TYPE_OPTIONS } from '@/lib/nprm/constants';
import {
  MIN_IMPACT_CHARS,
  buildPrompt,
  isPersonalizedEnough,
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
import GlossaryTerm, {
  GlossaryText,
} from '@/components/nprm/GlossaryTerm';
import NprmSectionHeading from '@/components/nprm/NprmSectionHeading';
import { useToast } from '@/components/Toast';

interface Props {
  themes: NprmTheme[];
  promptTree: NprmPromptNode[];
  initialThemeIds?: string[];
  initialOpinions?: Record<string, string>;
}

const MAX_THEMES = 3;
const DRAFT_KEY = 'eb5base_nprm_write_draft_v1';
/** Browser/URL length guard for LLM ?q= prefill links. */
const LLM_PREFILL_MAX_CHARS = 3500;

const LLM_LINKS = [
  {
    id: 'chatgpt',
    label: 'ChatGPT',
    href: 'https://chatgpt.com/',
    prefill: (prompt: string) =>
      `https://chatgpt.com/?q=${encodeURIComponent(prompt)}`,
  },
  {
    id: 'claude',
    label: 'Claude',
    href: 'https://claude.ai/new',
    prefill: (prompt: string) =>
      `https://claude.ai/new?q=${encodeURIComponent(prompt)}`,
  },
  {
    id: 'gemini',
    label: 'Gemini',
    href: 'https://gemini.google.com/app',
  },
  {
    id: 'metaai',
    label: 'Meta AI',
    href: 'https://www.meta.ai/',
  },
  {
    id: 'deepseek',
    label: 'DeepSeek',
    href: 'https://chat.deepseek.com/',
    prefill: (prompt: string) =>
      `https://chat.deepseek.com/?q=${encodeURIComponent(prompt)}`,
  },
] as const;

const INVESTOR_TYPE_OPTIONS: {
  value: NonNullable<PersonalBlock['investor_type']>;
  label: string;
}[] = [
  { value: 'pre_ria', label: 'Pre-RIA' },
  { value: 'post_ria', label: 'Post-RIA 2022+' },
  { value: 'future', label: 'Future filer' },
  { value: 'family', label: 'Family' },
];

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

  const ready = privacyOk && themeIds.length > 0;
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

  async function openInLlm(llm: (typeof LLM_LINKS)[number]) {
    if (!ready) {
      toast('Select a theme and accept the disclaimer first', 'error');
      return;
    }
    let copied = false;
    try {
      await navigator.clipboard.writeText(prompt);
      copied = true;
      setCopyMsg('Prompt copied');
      track('builder_copied');
      if (personalized) track('builder_personalized');
      window.setTimeout(() => setCopyMsg(null), 2000);
    } catch {
      // Still open the LLM; user can copy manually from the preview.
    }

    const canPrefill =
      'prefill' in llm &&
      typeof llm.prefill === 'function' &&
      prompt.length > 0 &&
      prompt.length <= LLM_PREFILL_MAX_CHARS;
    const url = canPrefill ? llm.prefill(prompt) : llm.href;
    window.open(url, '_blank', 'noopener,noreferrer');
    track(`llm_open_${llm.id}`);

    if (copied && canPrefill) {
      toast(`Opening ${llm.label} with your prompt`, 'success');
    } else if (copied) {
      toast(`Prompt copied — paste into ${llm.label}`, 'success');
    } else {
      toast(`Opened ${llm.label}. Copy the prompt from the preview.`, 'info');
    }
  }

  return (
    <div className="space-y-4 animate-[fadeIn_0.35s_ease-out]">
      <NprmSectionHeading
        as="h2"
        eyebrow="Write"
        title="Build My Comment"
      >
        <p className="text-sm text-neutral leading-relaxed max-w-2xl">
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
      </NprmSectionHeading>

      <div
        className="rounded-xl border-2 border-warning/50 bg-warning/15 px-3 py-3 text-sm text-neutral leading-relaxed space-y-1"
        role="status"
      >
        <p className="font-semibold text-primary">
          Your comment needs to be unique
        </p>
        <p className="font-medium">
          If 500 people paste the same paragraph, <GlossaryTerm term="USCIS" />{' '}
          counts it as one. Agencies use tools like those noted by{' '}
          <GlossaryTerm term="GAO" /> and <GlossaryTerm term="OIRA" /> that can
          distill thousands of comments into a much smaller set of distinct ones.
          Add your personal story so yours stands alone.
        </p>
      </div>

      {impactLen >= MIN_IMPACT_CHARS && !personalized ? (
        <div
          className="rounded-xl border-2 border-error/50 bg-error/10 px-3 py-3 text-sm text-error font-medium leading-relaxed"
          role="alert"
        >
          Your comment looks too close to a template (
          {Math.round(similarity * 100)}% overlap). Add 1-2 sentences about your
          own case: why you chose EB-5, how long you have waited, what
          redeployment cost you. <GlossaryTerm term="DHS" /> discounts form
          letters.
        </div>
      ) : null}

      <div className="space-y-5">
        <section className="space-y-2 rounded-xl border-2 border-base-300 bg-base-100 p-4 sm:p-5 shadow-soft">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <NprmSectionHeading
              as="h3"
              eyebrow="Step A"
              title={`Themes (max ${MAX_THEMES})`}
              titleClassName="text-sm font-semibold text-primary leading-snug"
            >
              <p className="text-xs text-neutral leading-relaxed">
                Select a theme to build your comment. Choose the themes that
                are most important to you. Then choose your view under it.
              </p>
            </NprmSectionHeading>
            <p className="text-xs text-neutral/70">
              {themeIds.length}/{MAX_THEMES} selected
            </p>
          </div>
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-2">
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
                  <button
                    type="button"
                    aria-pressed={checked}
                    disabled={disabled}
                    onClick={() => toggleTheme(t.id)}
                    className={`w-full text-left text-sm font-medium leading-snug rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary ${
                      checked ? 'text-primary' : 'text-neutral'
                    } ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <GlossaryText text={t.title} />
                  </button>
                  {checked ? (
                    <fieldset className="mt-2 space-y-1.5 border-t border-secondary/30 pt-2">
                      <legend className="text-[11px] font-bold uppercase tracking-wider text-secondary px-0.5">
                        Your view
                      </legend>
                      {t.opinions.map((op) => {
                        const selected = opinions[t.id] === op.id;
                        return (
                          <label
                            key={op.id}
                            className={`flex items-start gap-2 text-xs sm:text-sm cursor-pointer rounded-md px-1.5 py-1 -mx-0.5 transition-colors ${
                              selected
                                ? 'bg-base-100/90 text-primary font-semibold ring-1 ring-secondary/35'
                                : 'text-primary/90 font-medium hover:bg-base-100/70'
                            }`}
                          >
                            <input
                              type="radio"
                              name={`opinion-${t.id}`}
                              className="radio radio-xs radio-secondary mt-0.5 shrink-0 checked:bg-secondary"
                              checked={selected}
                              onChange={() =>
                                setOpinions((prev) => ({
                                  ...prev,
                                  [t.id]: op.id,
                                }))
                              }
                            />
                            <span className="leading-snug">
                              <GlossaryText text={op.label} />
                            </span>
                          </label>
                        );
                      })}
                    </fieldset>
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>

        <section className="space-y-3 rounded-xl border-2 border-base-300 bg-base-100 p-4 sm:p-5 shadow-soft">
          <NprmSectionHeading
            as="h3"
            eyebrow="Step B"
            title="Personal block (optional)"
            titleClassName="text-sm font-semibold text-primary leading-snug"
          >
            <p className="text-xs text-neutral leading-relaxed">
              Optional, but a few personal details make your comment count as
              distinct.
            </p>
          </NprmSectionHeading>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <label className="form-control sm:col-span-2 lg:col-span-1">
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
          </div>
          <label className="form-control">
            <span className="label-text text-xs flex justify-between">
              <span>Personal story (optional)</span>
              <span
                className={
                  impactLen === 0
                    ? 'text-neutral/60'
                    : impactLen >= MIN_IMPACT_CHARS && personalized
                      ? 'text-success'
                      : 'text-warning'
                }
              >
                {impactLen}/{MIN_IMPACT_CHARS}
              </span>
            </span>
            <textarea
              className="textarea textarea-bordered text-sm min-h-24"
              placeholder="e.g. 4 years in the queue; child turns 21 before I-829; capital stuck in redeployment"
              value={personal.impact}
              onChange={(e) =>
                setPersonal((p) => ({ ...p, impact: e.target.value }))
              }
            />
            <span className="label-text-alt text-[10px] sm:text-[11px] text-neutral/70 leading-relaxed mt-1">
              <GlossaryText text="Helpful examples: years waiting in the visa queue; capital already invested; a child’s age, school, or aging-out risk; job or work-authorization timing tied to I-829; redeployment or regional-center disruption that hit you; project timelines that clash with a 2-year sustainment clock. Skip A-numbers, receipt numbers, and home addresses." />
            </span>
          </label>
        </section>

        <section className="rounded-xl border-2 border-base-300 bg-base-100 p-4 sm:p-5 shadow-soft space-y-2">
          <NprmSectionHeading
            as="h3"
            eyebrow="Step C"
            title="Guidelines"
            titleClassName="text-sm font-semibold text-primary leading-snug"
          />
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
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

        <div className="space-y-3">
          <div className="rounded-xl border border-base-300 bg-primary text-primary-content p-4 sm:p-5">
            <div className="flex items-center justify-between gap-2 mb-3">
              <NprmSectionHeading
                as="h3"
                eyebrow="Preview"
                title="Deterministic prompt"
                titleClassName="text-sm font-semibold text-accent leading-snug"
              />
              {copyMsg && (
                <span className="text-xs text-accent">{copyMsg}</span>
              )}
            </div>
            <pre className="whitespace-pre-wrap text-xs sm:text-sm font-mono leading-relaxed text-primary-content/90 max-h-[28rem] overflow-auto">
              {prompt}
            </pre>
          </div>

          <label className="flex items-start gap-2.5 text-[11px] sm:text-xs text-amber-950/90 cursor-pointer rounded-xl border-2 border-warning/50 bg-warning/15 p-3 leading-relaxed">
            <input
              type="checkbox"
              className="checkbox checkbox-sm mt-0.5 shrink-0"
              checked={privacyOk}
              onChange={(e) => setPrivacyOk(e.target.checked)}
            />
            <span>
              I understand that I must not include my A-Number, receipt number,
              home address, or other sensitive personal identifiers in a public
              comment. By using this prompt, I am acting in my own capacity. EB5
              Base does not submit comments for me and is not liable or
              responsible for any comment I eventually file on regulations.gov
              or elsewhere. This tool is information only, not legal advice.
            </span>
          </label>

          <div className="flex flex-col sm:flex-row flex-wrap gap-2">
            <button
              type="button"
              className="btn btn-secondary shadow-glow-green sm:w-auto"
              disabled={!ready}
              title={
                ready
                  ? 'Copy full prompt'
                  : 'Select at least one theme and accept the disclaimer first'
              }
              onClick={() => copyText(prompt, 'Prompt')}
            >
              Copy prompt
            </button>
          </div>

          <section className="rounded-xl border-2 border-base-300 bg-base-100 p-4 sm:p-5 shadow-sm space-y-3">
            <NprmSectionHeading
              as="h3"
              eyebrow="Next"
              title="What to do after you copy"
              titleClassName="text-sm font-semibold text-primary leading-snug"
            />
            <ol className="list-decimal pl-5 text-sm text-neutral space-y-1.5 leading-relaxed">
              <li>
                <span>Paste the prompt into your own LLM</span>
                <div className="mt-1.5 flex flex-wrap gap-x-1 gap-y-1 text-xs">
                  {LLM_LINKS.map((llm, i) => (
                    <span key={llm.id} className="inline-flex items-center gap-1">
                      {i > 0 ? (
                        <span className="text-neutral/40" aria-hidden>
                          ·
                        </span>
                      ) : null}
                      <button
                        type="button"
                        className="font-semibold text-secondary underline underline-offset-2 hover:text-primary disabled:opacity-50 disabled:no-underline"
                        disabled={!ready}
                        title={
                          ready
                            ? `Copy prompt and open ${llm.label}`
                            : 'Select at least one theme and accept the disclaimer first'
                        }
                        onClick={() => openInLlm(llm)}
                      >
                        {llm.label}
                      </button>
                    </span>
                  ))}
                </div>
                <p className="mt-1 text-[11px] text-neutral/70 leading-relaxed">
                  Click a name to copy the prompt and open that chat. ChatGPT,
                  Claude, and DeepSeek can prefill when the prompt is not too
                  long; otherwise paste from your clipboard. On phones, the
                  installed app may open when the OS supports it.
                </p>
              </li>
              <li>Edit the draft in your voice (aim for more than 30% personal)</li>
              <li>
                Paste the final comment on{' '}
                <a
                  href={COMMENT_ON_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-secondary underline underline-offset-2 hover:text-primary"
                >
                  regulations.gov
                </a>
              </li>
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

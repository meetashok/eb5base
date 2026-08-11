'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { PROJECT_TYPE_OPTIONS } from '@/lib/nprm/constants';
import {
  KEY_TOPICS,
  stancesByPolarity,
  topicSectionId,
} from '@/lib/nprm/keyTopics';
import {
  MIN_IMPACT_CHARS,
  adaptiveLengthTarget,
  buildPrompt,
  defaultTopicSelections,
  emptyTopicSelection,
  includedSelections,
  isPersonalizedEnough,
  isTopicSelectionReady,
  templateSimilarity,
} from '@/lib/nprm/prompt';
import type {
  KeyTopic,
  KeyTopicPolarity,
  PersonalBlock,
  StyleGuideline,
  TopicCommentSelection,
} from '@/lib/nprm/types';
import { COMMENT_GUIDANCE, COMMENT_ON_URL } from '@/lib/nprm/utils';
import { SITE_URL } from '@/lib/constants';
import { nprmTabHref } from '@/lib/nprm/tabs';
import GlossaryTerm, {
  GlossaryText,
} from '@/components/nprm/GlossaryTerm';
import NprmSectionHeading from '@/components/nprm/NprmSectionHeading';
import { useToast } from '@/components/Toast';

interface Props {
  /** Prefill from Overview/Summary “Build a comment on this”. */
  initialTopicIds?: string[];
  onSummary?: (hash?: string) => void;
}

const MAX_TOPICS = 3;
const DRAFT_KEY = 'eb5base_nprm_write_draft_v4';
/** Browser/URL length guard for LLM ?q= prefill links. */
const LLM_PREFILL_MAX_CHARS = 3500;
const NPRM_SHARE_URL = `${SITE_URL}/nprm`;
const NPRM_SHARE_TITLE = 'EB5 Base NPRM comment guide';
const NPRM_SHARE_TEXT =
  'I used EB5 Base to share my view on the EB-5 NPRM. Make yourself heard:';

const PERSONAL_STORY_EXAMPLES = [
  'years waiting (ex: 5 years since I-526E filing)',
  'capital already invested and at risk (approx amount and year, not account numbers)',
  'teen at risk of aging out before I-829 (no school name or full name)',
  'job or work-authorization timing tied to conditional residency',
  'redeployment or regional-center disruption you experienced',
  'project timeline that does not fit a 2-year sustainment window',
] as const;

function GuidanceLinks({ className = '' }: { className?: string }) {
  return (
    <span className={className}>
      {COMMENT_GUIDANCE.map((g, i) => (
        <span key={g.id}>
          {i > 0 ? <span className="text-neutral/40"> · </span> : null}
          <a
            href={g.url}
            target="_blank"
            rel="noopener noreferrer"
            title={g.title}
            className="font-semibold text-secondary underline underline-offset-2 hover:text-primary"
          >
            {g.label}
          </a>
        </span>
      ))}
    </span>
  );
}

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

type GoatCounter = {
  count?: (opts: { path: string; title?: string; event?: boolean }) => void;
};

function track(event: string) {
  try {
    const gc = (window as unknown as { goatcounter?: GoatCounter }).goatcounter;
    gc?.count?.({ path: `event/${event}`, title: event, event: true });
  } catch {
    // ignore
  }
}

function seedSelections(
  initialTopicIds: string[]
): Record<string, TopicCommentSelection> {
  const base = defaultTopicSelections();
  initialTopicIds.slice(0, MAX_TOPICS).forEach((id) => {
    if (base[id]) {
      base[id] = {
        ...emptyTopicSelection(id),
        include: true,
        polarity: null,
        angles: [],
        extraNote: '',
      };
    }
  });
  return base;
}

function TopicDecisionCard({
  topic,
  index,
  sel,
  includeDisabled,
  highlight,
  onChange,
  onSummary,
}: {
  topic: KeyTopic;
  index: number;
  sel: TopicCommentSelection;
  includeDisabled: boolean;
  highlight?: boolean;
  onChange: (next: TopicCommentSelection) => void;
  onSummary?: (hash?: string) => void;
}) {
  const agreeStance = stancesByPolarity(topic, 'agree')[0];
  const disagreeStance = stancesByPolarity(topic, 'disagree')[0];
  const detailsRef = useRef<HTMLDivElement>(null);
  const activeAngles =
    sel.polarity === 'agree'
      ? agreeStance?.angles || []
      : sel.polarity === 'disagree'
        ? disagreeStance?.angles || []
        : [];

  useEffect(() => {
    const el = detailsRef.current;
    if (!el) return;
    // Keep collapsed details out of the tab order (React 18 has no inert prop).
    if (sel.include) el.removeAttribute('inert');
    else el.setAttribute('inert', '');
  }, [sel.include]);

  function setInclude(include: boolean) {
    if (include) {
      onChange({
        ...sel,
        include: true,
      });
      return;
    }
    onChange(emptyTopicSelection(topic.id));
  }

  function setPolarity(polarity: KeyTopicPolarity) {
    if (sel.polarity === polarity) return;
    onChange({
      ...sel,
      include: true,
      polarity,
      angles: [],
    });
  }

  function toggleAngle(angle: string) {
    const has = sel.angles.includes(angle);
    onChange({
      ...sel,
      angles: has
        ? sel.angles.filter((a) => a !== angle)
        : [...sel.angles, angle],
    });
  }

  const ready = isTopicSelectionReady(sel);

  return (
    <article
      id={`write-topic-${topic.id}`}
      className={`scroll-mt-36 rounded-xl border-2 px-3 py-3 sm:px-4 sm:py-4 space-y-3 ${
        sel.include
          ? ready
            ? 'border-secondary bg-secondary/10'
            : 'border-secondary/60 bg-secondary/5'
          : 'border-base-300 bg-base-100'
      } ${includeDisabled && !sel.include ? 'opacity-50' : ''} ${
        highlight ? 'nprm-topic-handoff-flash' : ''
      }`}
    >
      <div className="space-y-1">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <p className="text-[11px] font-bold uppercase tracking-wider text-secondary">
            Topic {index + 1}
          </p>
          {onSummary ? (
            <button
              type="button"
              onClick={() => onSummary(topicSectionId(topic.id))}
              className="text-[10px] font-semibold text-secondary underline underline-offset-2 hover:text-primary"
            >
              Read more
            </button>
          ) : (
            <a
              href={`${nprmTabHref('summary')}#${topicSectionId(topic.id)}`}
              className="text-[10px] font-semibold text-secondary underline underline-offset-2 hover:text-primary"
            >
              Read more
            </a>
          )}
        </div>
        <h4 className="text-sm font-semibold text-primary leading-snug">
          <GlossaryText text={topic.title} />
        </h4>
      </div>

      <div
        className="inline-flex rounded-lg border-2 border-base-300 bg-base-200/60 p-0.5"
        role="group"
        aria-label={`Comment on topic ${index + 1}?`}
      >
        {(
          [
            { id: false as const, label: 'Skip' },
            { id: true as const, label: 'Comment on this' },
          ] as const
        ).map((opt) => {
          const selected = sel.include === opt.id;
          const blocked = opt.id && includeDisabled && !sel.include;
          const selectedClass = opt.id
            ? 'bg-secondary text-secondary-content shadow-sm'
            : 'bg-base-300 text-primary shadow-sm';
          return (
            <button
              key={String(opt.id)}
              type="button"
              aria-pressed={selected}
              disabled={blocked}
              onClick={() => setInclude(opt.id)}
              className={`min-h-9 px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${
                selected
                  ? selectedClass
                  : 'text-neutral hover:bg-base-100'
              } ${blocked ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      <div
        ref={detailsRef}
        className={`nprm-write-topic-expand ${sel.include ? 'is-open' : ''}`}
        aria-hidden={!sel.include}
      >
        <div className="nprm-write-topic-expand-inner">
          <div className="space-y-3 border-t border-secondary/25 pt-3">
            <div className="space-y-1.5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-neutral/60">
                Do you generally agree with the draft on this point?
              </p>
              <div
                className="flex flex-col sm:flex-row gap-1.5"
                role="group"
                aria-label="Polarity"
              >
                {(
                  [
                    {
                      id: 'agree' as const,
                      label: 'Generally agree',
                      hint: agreeStance?.label,
                    },
                    {
                      id: 'disagree' as const,
                      label: 'Generally disagree',
                      hint: disagreeStance?.label,
                    },
                  ] as const
                ).map((opt) => {
                  const selected = sel.polarity === opt.id;
                  const isAgree = opt.id === 'agree';
                  const selectedClass = isAgree
                    ? 'border-secondary bg-secondary/10 shadow-sm'
                    : 'border-warning bg-warning/10 shadow-sm';
                  const idleClass = isAgree
                    ? 'border-base-300 bg-base-100/70 hover:border-secondary/50'
                    : 'border-base-300 bg-base-100/70 hover:border-warning/50';
                  const labelClass = selected
                    ? isAgree
                      ? 'text-secondary'
                      : 'text-warning'
                    : 'text-primary';
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => setPolarity(opt.id)}
                      tabIndex={sel.include ? undefined : -1}
                      className={`flex-1 text-left rounded-lg border-2 px-3 py-2 transition-colors ${
                        selected ? selectedClass : idleClass
                      }`}
                    >
                      <span
                        className={`block text-sm font-semibold ${labelClass}`}
                      >
                        {opt.label}
                      </span>
                      {opt.hint ? (
                        <span className="block text-[11px] text-neutral leading-snug mt-0.5">
                          <GlossaryText text={opt.hint} />
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>

            {sel.polarity ? (
              <fieldset className="space-y-1.5">
                <legend className="text-[11px] font-bold uppercase tracking-wider text-secondary">
                  Which points should the comment mention?
                </legend>
                <p className="text-[11px] text-neutral/80 leading-relaxed">
                  Select one or more. These become must-include asks in your LLM
                  prompt.
                </p>
                <div className="space-y-1">
                  {activeAngles.map((angle) => {
                    const checked = sel.angles.includes(angle);
                    return (
                      <label
                        key={angle}
                        className={`flex items-start gap-2 text-xs sm:text-sm cursor-pointer rounded-md px-2 py-1.5 transition-colors ${
                          checked
                            ? 'bg-base-100 text-primary font-semibold ring-1 ring-secondary/35'
                            : 'text-primary/90 font-medium hover:bg-base-100/80'
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="checkbox checkbox-xs checkbox-secondary mt-0.5 shrink-0 !rounded-sm"
                          checked={checked}
                          disabled={!sel.include}
                          onChange={() => toggleAngle(angle)}
                          tabIndex={sel.include ? undefined : -1}
                        />
                        <span className="leading-snug">
                          <GlossaryText text={angle} />
                        </span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            ) : null}

            {sel.polarity ? (
              <label className="form-control">
                <span className="label-text text-xs">
                  Anything else to include for this topic? (optional)
                </span>
                <textarea
                  className="textarea textarea-bordered text-sm min-h-20"
                  placeholder="e.g. Also confirm return of capital after 2 years and jobs, even before CGC."
                  value={sel.extraNote}
                  disabled={!sel.include}
                  tabIndex={sel.include ? undefined : -1}
                  onChange={(e) =>
                    onChange({ ...sel, extraNote: e.target.value })
                  }
                />
              </label>
            ) : null}

            {sel.include && !ready ? (
              <p className="text-[11px] text-warning leading-relaxed">
                {!sel.polarity
                  ? 'Choose agree or disagree to continue.'
                  : 'Select at least one point, or add a note above.'}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}

export default function WriteTab({
  initialTopicIds = [],
  onSummary,
}: Props) {
  const { toast } = useToast();
  const [selections, setSelections] = useState<
    Record<string, TopicCommentSelection>
  >(() => seedSelections(initialTopicIds));
  const [personal, setPersonal] = useState<PersonalBlock>({
    i_526e_file_date: '',
    project_type: '',
    impact: '',
    investor_type: '',
    country: '',
  });
  const [style, setStyle] = useState<StyleGuideline>('plain');
  const [copyMsg, setCopyMsg] = useState<string | null>(null);
  const [copyPulseKey, setCopyPulseKey] = useState(0);
  const [flashTopicId, setFlashTopicId] = useState<string | null>(null);
  const [privacyOk, setPrivacyOk] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as {
          selections?: Record<string, TopicCommentSelection>;
          personal?: PersonalBlock;
          style?: StyleGuideline;
        };
        if (
          parsed.selections &&
          initialTopicIds.length === 0 &&
          Object.keys(parsed.selections).length
        ) {
          setSelections({
            ...defaultTopicSelections(),
            ...parsed.selections,
          });
        }
        if (parsed.personal) {
          setPersonal((p) => ({ ...p, ...parsed.personal }));
        }
        if (parsed.style) setStyle(parsed.style);
      }
    } catch {
      // ignore corrupt draft
    }
    setHydrated(true);
    track('builder_started');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const focusId = initialTopicIds[0];
    let cancelled = false;
    let layoutId = 0;
    let retryId = 0;
    let afterScrollId = 0;
    let pulseId = 0;
    let clearId = 0;

    const reduceMotion = () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const startFlash = (id: string) => {
      if (cancelled || reduceMotion()) return;
      // Clear then set so a remounted handoff always restarts the animation.
      setFlashTopicId(null);
      pulseId = window.setTimeout(() => {
        if (cancelled) return;
        setFlashTopicId(id);
        clearId = window.setTimeout(() => {
          if (!cancelled) setFlashTopicId(null);
        }, 1200);
      }, 20);
    };

    const run = (attempt: number) => {
      if (cancelled) return;
      if (!focusId) {
        window.scrollTo({
          top: 0,
          behavior: reduceMotion() ? 'auto' : 'smooth',
        });
        return;
      }
      const el = document.getElementById(`write-topic-${focusId}`);
      if (!el) {
        // Tab panel may not be laid out yet; retry briefly.
        if (attempt < 8) {
          retryId = window.setTimeout(() => run(attempt + 1), 50);
        }
        return;
      }
      el.scrollIntoView({
        behavior: reduceMotion() ? 'auto' : 'smooth',
        block: 'start',
      });
      // Smooth scroll finishes after the old 50ms flash window, so wait
      // until the card is likely in view before pulsing.
      const flashDelay = reduceMotion() ? 0 : 450;
      afterScrollId = window.setTimeout(() => startFlash(focusId), flashDelay);
    };

    // Wait a frame after tab swap so the Write panel is laid out.
    layoutId = window.setTimeout(() => run(0), 50);
    return () => {
      cancelled = true;
      window.clearTimeout(layoutId);
      window.clearTimeout(retryId);
      window.clearTimeout(afterScrollId);
      window.clearTimeout(pulseId);
      window.clearTimeout(clearId);
    };
  }, [initialTopicIds]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({ selections, personal, style })
      );
    } catch {
      // quota
    }
  }, [hydrated, selections, personal, style]);

  const included = includedSelections(selections);
  const readyTopics = included.filter(isTopicSelectionReady);
  const includeCount = included.length;
  const atMax = includeCount >= MAX_TOPICS;
  const ready = privacyOk && readyTopics.length > 0;
  const impactLen = personal.impact.trim().length;
  const personalized = isPersonalizedEnough(personal.impact);
  const similarity = templateSimilarity(personal.impact);
  const lengthTarget = adaptiveLengthTarget(readyTopics.length);

  const prompt = useMemo(
    () =>
      buildPrompt({
        selections,
        personal,
        guidelines: { style },
      }),
    [selections, personal, style]
  );

  function updateSelection(next: TopicCommentSelection) {
    setSelections((prev) => {
      if (
        next.include &&
        !prev[next.topicId]?.include &&
        includedSelections(prev).length >= MAX_TOPICS
      ) {
        return prev;
      }
      return { ...prev, [next.topicId]: next };
    });
  }

  async function copyText(text: string) {
    if (!ready) {
      toast(
        'Finish at least one topic and accept the disclaimer first',
        'error'
      );
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      setCopyMsg('Prompt copied');
      setCopyPulseKey((k) => k + 1);
      track('builder_copied');
      if (personalized) track('builder_personalized');
      window.setTimeout(() => setCopyMsg(null), 2500);
    } catch {
      setCopyMsg('Copy failed');
      toast('Copy failed. Select the prompt text manually.', 'error');
      window.setTimeout(() => setCopyMsg(null), 3000);
    }
  }

  async function openInLlm(llm: (typeof LLM_LINKS)[number]) {
    if (!ready) {
      toast(
        'Finish at least one topic and accept the disclaimer first',
        'error'
      );
      return;
    }
    let copied = false;
    try {
      await navigator.clipboard.writeText(prompt);
      copied = true;
      setCopyMsg('Prompt copied');
      setCopyPulseKey((k) => k + 1);
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

  async function shareGuide() {
    const payload = {
      title: NPRM_SHARE_TITLE,
      text: NPRM_SHARE_TEXT,
      url: NPRM_SHARE_URL,
    };
    const clipboardText = `${NPRM_SHARE_TEXT} ${NPRM_SHARE_URL}`;

    try {
      if (
        typeof navigator.share === 'function' &&
        (!navigator.canShare || navigator.canShare(payload))
      ) {
        await navigator.share(payload);
        track('builder_shared');
        return;
      }
    } catch (err) {
      // User dismissed the sheet; do not fall through to clipboard noise.
      if (err instanceof DOMException && err.name === 'AbortError') return;
    }

    try {
      await navigator.clipboard.writeText(clipboardText);
      track('builder_shared');
      toast('Share text copied. Paste it anywhere to invite others.', 'success');
    } catch {
      toast(`Copy this link: ${NPRM_SHARE_URL}`, 'info');
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4 animate-[fadeIn_0.35s_ease-out]">
      <NprmSectionHeading as="h2" eyebrow="Write" title="Build My Comment">
        <p className="text-sm text-neutral leading-relaxed">
          Walk each topic: skip or comment, agree or disagree, pick the points
          to mention, then add your personal story. We build an LLM prompt you
          can paste into ChatGPT, Claude, or similar. We do not submit to{' '}
          <a
            href={COMMENT_ON_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-secondary underline underline-offset-2 hover:text-primary"
          >
            regulations.gov
          </a>{' '}
          for you.
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
          Federal guidance says a constructive, detailed comment with your own
          experience is more useful than identical form letters. Add your personal
          story so yours stands alone. See why: <GuidanceLinks />.
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
        <section className="space-y-3 rounded-xl border-2 border-base-300 bg-base-100 p-4 sm:p-5 shadow-soft">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <NprmSectionHeading
              as="h3"
              eyebrow="Step A"
              title={`Decide topic by topic (max ${MAX_TOPICS})`}
              titleClassName="text-sm font-semibold text-primary leading-snug"
            >
              <p className="text-xs text-neutral leading-relaxed">
                Same six topics as Overview and Summary. Stronger comments focus
                on up to {MAX_TOPICS} issues. For more topics, copy another
                prompt in a second pass.
              </p>
            </NprmSectionHeading>
            <p className="text-xs text-neutral/70">
              {includeCount}/{MAX_TOPICS} topics · {readyTopics.length} ready
            </p>
          </div>

          {atMax ? (
            <p className="text-xs text-neutral leading-relaxed rounded-lg border border-base-300 bg-base-200/50 px-3 py-2">
              You have selected {MAX_TOPICS} topics. Skip one to add another, or
              finish this prompt and run the builder again for more issues.
            </p>
          ) : null}

          <div className="space-y-3">
            {KEY_TOPICS.map((topic, index) => (
              <TopicDecisionCard
                key={topic.id}
                topic={topic}
                index={index}
                sel={selections[topic.id] || emptyTopicSelection(topic.id)}
                includeDisabled={atMax}
                highlight={flashTopicId === topic.id}
                onChange={updateSelection}
                onSummary={onSummary}
              />
            ))}
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
              distinct. Federal agencies ask for constructive, detailed comments
              and say relevant personal experience helps reviewers. See why:{' '}
              <GuidanceLinks />.
            </p>
            <p className="text-xs text-neutral leading-relaxed">
              <span className="font-semibold text-primary">Privacy:</span> Your
              answers stay on this device (browser local storage). Nothing from
              this form is uploaded to our servers.
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
              value={
                (personal.country as
                  | (typeof COUNTRY_OPTIONS)[number]['value']
                  | '') || ''
              }
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
              placeholder="e.g. 5 years since I-526E filing; teen at risk of aging out before I-829; capital at risk since 2023"
              value={personal.impact}
              onChange={(e) =>
                setPersonal((p) => ({ ...p, impact: e.target.value }))
              }
            />
            <div className="mt-1.5 space-y-1.5 text-[10px] sm:text-[11px] text-neutral/80 leading-relaxed">
              <p>
                Adding your story helps. Agencies say one detailed personal
                comment outweighs many identical form letters. See why:{' '}
                <GuidanceLinks />.
              </p>
              <p>
                Helpful examples (keep them anonymized):{' '}
                {PERSONAL_STORY_EXAMPLES.map((ex, i) => (
                  <span key={ex}>
                    {i > 0 ? '; ' : null}
                    <GlossaryText text={ex} />
                  </span>
                ))}
                .
              </p>
              <ul className="list-disc pl-4 space-y-0.5 text-neutral/75">
                <li>
                  Tie the story to a rule cite (ex:{' '}
                  <GlossaryText text="8 CFR 204.408" /> sustainment).
                </li>
                <li>
                  Keep years and approx amounts; drop identifiers (no A-number,
                  receipt number, DOB, school name, employer name, or child full
                  name).
                </li>
                <li>
                  End with what you want <GlossaryTerm term="USCIS" /> to keep or
                  change.
                </li>
              </ul>
              <p className="text-neutral/70">
                Comments are posted publicly on regulations.gov as submitted,
                including any personal information you provide. Limit personal
                info. Do not include SSN, DOB, A-number, receipt number,
                passport, bank account, school name, employer name, or a
                child&apos;s full name.
              </p>
            </div>
          </label>
        </section>

        <section className="rounded-xl border-2 border-base-300 bg-base-100 p-4 sm:p-5 shadow-soft space-y-3">
          <NprmSectionHeading
            as="h3"
            eyebrow="Step C"
            title="Guidelines"
            titleClassName="text-sm font-semibold text-primary leading-snug"
          >
            <p className="text-xs text-neutral leading-relaxed">
              Target length adapts to how many topics you finish: 1 issue ~
              250-350 words, 2 issues ~ 400-500, 3 issues ~ 550-750. The draft
              uses short paragraphs; bullets only for concrete asks to DHS.
            </p>
          </NprmSectionHeading>
          <div className="space-y-3">
            <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              <span className="text-sm font-semibold text-primary shrink-0">
                Length
              </span>
              <p className="text-sm text-neutral leading-snug sm:text-right">
                {readyTopics.length === 0
                  ? 'Finish at least one topic to set the target'
                  : `${lengthTarget.label} (${lengthTarget.detail})`}
              </p>
            </div>
            <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              <span className="text-sm font-semibold text-primary shrink-0">
                Style
              </span>
              <div
                className="inline-flex w-full sm:w-auto rounded-lg border-2 border-base-300 bg-base-200/60 p-0.5"
                role="group"
                aria-label="Style"
              >
                {(
                  [
                    { id: 'plain' as const, label: 'Plain English' },
                    { id: 'formal' as const, label: 'Formal regulatory' },
                  ] as const
                ).map((opt) => {
                  const selected = style === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => setStyle(opt.id)}
                      className={`flex-1 sm:flex-none min-h-9 px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${
                        selected
                          ? 'bg-primary text-primary-content shadow-sm'
                          : 'text-neutral hover:bg-base-100'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <div className="space-y-3">
          <div className="rounded-xl border border-base-300 bg-primary text-primary-content p-4 sm:p-5">
            <div className="flex items-center justify-between gap-2 mb-3">
              <NprmSectionHeading
                as="h3"
                eyebrow="Preview"
                title="LLM prompt"
                titleClassName="text-sm font-semibold text-accent leading-snug"
              />
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

          <div className="flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              key={copyPulseKey}
              className={`btn w-full sm:w-auto ${
                copyMsg === 'Prompt copied'
                  ? 'btn-ghost bg-base-300 text-primary border-base-300 shadow-none nprm-copy-pulse'
                  : copyMsg === 'Copy failed'
                    ? 'btn-error text-error-content'
                    : 'btn-secondary shadow-glow-green'
              }`}
              disabled={!ready}
              aria-live="polite"
              title={
                ready
                  ? 'Copy full prompt for your LLM'
                  : 'Finish at least one topic and accept the disclaimer first'
              }
              onClick={() => copyText(prompt)}
            >
              {copyMsg === 'Prompt copied'
                ? 'Prompt copied'
                : copyMsg === 'Copy failed'
                  ? 'Copy failed'
                  : 'Copy prompt for LLM'}
            </button>
            <button
              type="button"
              onClick={shareGuide}
              data-goatcounter-click="nprm-share-guide"
              className="btn btn-outline border-neutral/30 w-full sm:w-auto"
              title="Share EB5 Base NPRM with other investors"
            >
              Share
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
                Paste the prompt into your own LLM
                {LLM_LINKS.map((llm) => (
                  <span key={llm.id} className="text-xs">
                    <span className="text-neutral/40" aria-hidden>
                      {' '}
                      ·{' '}
                    </span>
                    <button
                      type="button"
                      className="font-semibold text-secondary underline underline-offset-2 hover:text-primary disabled:opacity-50 disabled:no-underline"
                      disabled={!ready}
                      title={
                        ready
                          ? `Copy prompt and open ${llm.label}`
                          : 'Finish at least one topic and accept the disclaimer first'
                      }
                      onClick={() => openInLlm(llm)}
                    >
                      {llm.label}
                    </button>
                  </span>
                ))}
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
              <li>
                Optional: ask your immigration attorney to review the draft
                before you file
              </li>
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

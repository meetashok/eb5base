'use client';

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';

export const GLOSSARY: Record<string, string> = {
  NPRM: 'Notice of Proposed Rulemaking: a draft federal rule the public can comment on before it becomes final.',
  RIA: 'EB-5 Reform and Integrity Act of 2022: the law that reauthorized EB-5 through Sept 30, 2027.',
  TEA: 'Targeted Employment Area: a rural or high-unemployment area that qualifies for the lower $800K amount.',
  NCE: 'New Commercial Enterprise: the company you invest in.',
  JCE: 'Job Creating Entity: the project company that creates the jobs.',
  CFR: 'Code of Federal Regulations: the US federal rulebook.',
  USCIS: 'US Citizenship and Immigration Services: the agency that decides EB-5 cases.',
  DHS: 'Department of Homeland Security: the parent department that published this draft rule.',
  GAO: 'Government Accountability Office: the congressional watchdog that audits how federal agencies handle programs and public comments.',
  OIRA: 'Office of Information and Regulatory Affairs: the White House office that reviews federal rules and tools that cluster duplicate public comments.',
  INA: 'Immigration and Nationality Act: the main US immigration statute.',
  RFE: 'Request for Evidence: a USCIS notice asking for more documents before a decision.',
  'I-526E': 'Your regional-center EB-5 petition form.',
  'I-526': 'The older EB-5 immigrant petition form (often used for direct or pre-RIA filings).',
  'I-527': 'New form for investors whose regional center was terminated and who need to re-associate.',
  'I-829': 'Petition to remove conditions on permanent residence after the conditional green card period.',
  CGC: 'Conditional Green Card: the temporary 2-year permanent residence you get after an approved EB-5 petition and visa (or adjustment), before I-829 removes conditions.',
  RC: 'Regional Center: the approved EB-5 program sponsor for your project.',
  APA: 'Administrative Procedure Act: the law that requires agencies to take and respond to public comments on rules.',
};

type GlossaryKey = keyof typeof GLOSSARY;

function resolveTip(term: string): string | undefined {
  return (
    GLOSSARY[term] ||
    GLOSSARY[term.toUpperCase()] ||
    GLOSSARY[term.toLowerCase()]
  );
}

const GLOSSARY_TERM_PATTERN = (() => {
  const terms = Object.keys(GLOSSARY)
    .sort((a, b) => b.length - a.length)
    .map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  // Skip docket-style IDs like USCIS-2026-0100 (term followed by -digit).
  return new RegExp(`\\b(${terms.join('|')})(?!-\\d)`, 'g');
})();

/** Wrap known NPRM acronyms in hover glossary tips. */
export function GlossaryText({
  text,
  children,
}: {
  text?: string;
  children?: string;
}) {
  const raw = text ?? children ?? '';
  const nodes = useMemo(() => {
    if (!raw) return null;
    const parts: ReactNode[] = [];
    let lastIndex = 0;
    const re = new RegExp(
      GLOSSARY_TERM_PATTERN.source,
      GLOSSARY_TERM_PATTERN.flags
    );
    let match: RegExpExecArray | null;
    while ((match = re.exec(raw)) !== null) {
      if (match.index > lastIndex) {
        parts.push(raw.slice(lastIndex, match.index));
      }
      const term = match[1];
      parts.push(
        <GlossaryTerm key={`${term}-${match.index}`} term={term}>
          {term}
        </GlossaryTerm>
      );
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < raw.length) {
      parts.push(raw.slice(lastIndex));
    }
    return parts;
  }, [raw]);

  return <>{nodes}</>;
}

export default function GlossaryTerm({
  term,
  children,
}: {
  term: GlossaryKey | string;
  children?: ReactNode;
}) {
  const tip = resolveTip(term);
  const label = children ?? term;
  const tipId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const tipRef = useRef<HTMLSpanElement>(null);
  const closeTimer = useRef<number | null>(null);
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(
    null
  );
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const clearCloseTimer = useCallback(() => {
    if (closeTimer.current != null) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }, []);

  const updatePosition = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const tipWidth = Math.min(16 * 16, window.innerWidth * 0.8);
    const left = Math.min(
      Math.max(8, rect.left),
      window.innerWidth - tipWidth - 8
    );
    const gap = 8;
    const estimatedHeight = tipRef.current?.offsetHeight ?? 80;
    const below = rect.bottom + gap;
    const top =
      below + estimatedHeight > window.innerHeight - gap
        ? Math.max(gap, rect.top - estimatedHeight - gap)
        : below;
    setCoords({ top, left });
  }, []);

  const show = useCallback(() => {
    clearCloseTimer();
    updatePosition();
    setOpen(true);
  }, [clearCloseTimer, updatePosition]);

  const hideSoon = useCallback(() => {
    clearCloseTimer();
    closeTimer.current = window.setTimeout(() => setOpen(false), 140);
  }, [clearCloseTimer]);

  const hideNow = useCallback(() => {
    clearCloseTimer();
    setOpen(false);
  }, [clearCloseTimer]);

  useEffect(() => {
    if (!open) return;
    updatePosition();
    function onScrollOrResize() {
      updatePosition();
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') hideNow();
    }
    function onPointerDown(event: MouseEvent | TouchEvent) {
      const target = event.target as Node | null;
      if (!target) return;
      if (triggerRef.current?.contains(target)) return;
      if (tipRef.current?.contains(target)) return;
      hideNow();
    }
    window.addEventListener('scroll', onScrollOrResize, true);
    window.addEventListener('resize', onScrollOrResize);
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown);
    return () => {
      window.removeEventListener('scroll', onScrollOrResize, true);
      window.removeEventListener('resize', onScrollOrResize);
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
    };
  }, [open, updatePosition, hideNow]);

  useEffect(() => {
    if (!open) return;
    const id = window.requestAnimationFrame(updatePosition);
    return () => window.cancelAnimationFrame(id);
  }, [open, tip, updatePosition]);

  useEffect(() => () => clearCloseTimer(), [clearCloseTimer]);

  if (!tip) {
    return <span>{label}</span>;
  }

  return (
    <span className="relative inline-block">
      <button
        ref={triggerRef}
        type="button"
        className="cursor-help underline decoration-dotted decoration-neutral/50 underline-offset-2 text-inherit font-inherit hover:text-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary"
        aria-expanded={open}
        aria-describedby={open ? tipId : undefined}
        onPointerEnter={(event) => {
          if (event.pointerType === 'mouse' || event.pointerType === 'pen') {
            show();
          }
        }}
        onPointerLeave={(event) => {
          if (event.pointerType === 'mouse' || event.pointerType === 'pen') {
            hideSoon();
          }
        }}
        onClick={(event) => {
          // Hover already opens on fine pointers. Click/tap toggles on touch.
          // Avoid focus+click races that previously closed the tip immediately.
          event.preventDefault();
          clearCloseTimer();
          const finePointer =
            typeof window !== 'undefined' &&
            window.matchMedia('(hover: hover) and (pointer: fine)').matches;
          if (finePointer) {
            show();
            return;
          }
          updatePosition();
          setOpen((wasOpen) => !wasOpen);
        }}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            hideNow();
            return;
          }
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            clearCloseTimer();
            updatePosition();
            setOpen((wasOpen) => !wasOpen);
          }
        }}
      >
        {label}
      </button>
      {mounted && open && coords
        ? createPortal(
            <span
              ref={tipRef}
              id={tipId}
              role="tooltip"
              onPointerEnter={(event) => {
                if (
                  event.pointerType === 'mouse' ||
                  event.pointerType === 'pen'
                ) {
                  show();
                }
              }}
              onPointerLeave={(event) => {
                if (
                  event.pointerType === 'mouse' ||
                  event.pointerType === 'pen'
                ) {
                  hideSoon();
                }
              }}
              className="fixed z-[200] w-64 max-w-[min(16rem,80vw)] rounded-lg border-2 border-secondary/30 bg-base-100 px-2.5 py-2 text-left text-xs font-normal normal-case tracking-normal text-neutral shadow-lift leading-relaxed"
              style={{ top: coords.top, left: coords.left }}
            >
              <span className="block text-[10px] font-bold uppercase tracking-wider text-secondary mb-1">
                {term}
              </span>
              {tip}
            </span>,
            document.body
          )
        : null}
    </span>
  );
}

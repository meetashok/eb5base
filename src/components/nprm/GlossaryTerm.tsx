'use client';

import { useId, useState, type ReactNode } from 'react';

export const GLOSSARY: Record<string, string> = {
  NPRM: 'Notice of Proposed Rulemaking: a draft federal rule the public can comment on before it becomes final.',
  RIA: 'EB-5 Reform and Integrity Act of 2022: the law that reauthorized EB-5 through Sept 30, 2027.',
  TEA: 'Targeted Employment Area: a rural or high-unemployment area that qualifies for the lower $800K amount.',
  NCE: 'New Commercial Enterprise: the company you invest in.',
  JCE: 'Job Creating Entity: the project company that creates the jobs.',
  CFR: 'Code of Federal Regulations: the US federal rulebook.',
  USCIS: 'US Citizenship and Immigration Services: the agency that decides EB-5 cases.',
  DHS: 'Department of Homeland Security: the parent department that published this draft rule.',
  'I-526E': 'Your regional-center EB-5 petition form.',
  'I-527': 'New form for investors whose regional center was terminated and who need to re-associate.',
  RC: 'Regional Center: the approved EB-5 program sponsor for your project.',
};

type GlossaryKey = keyof typeof GLOSSARY;

export default function GlossaryTerm({
  term,
  children,
}: {
  term: GlossaryKey | string;
  children?: ReactNode;
}) {
  const tip = GLOSSARY[term] || GLOSSARY[term.toUpperCase()];
  const label = children ?? term;
  const tipId = useId();
  const [open, setOpen] = useState(false);

  if (!tip) {
    return <span>{label}</span>;
  }

  return (
    <span className="relative inline-block">
      <button
        type="button"
        className="underline decoration-dotted decoration-neutral/50 underline-offset-2 hover:text-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary"
        aria-describedby={open ? tipId : undefined}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={() => setOpen((v) => !v)}
      >
        {label}
      </button>
      {open ? (
        <span
          id={tipId}
          role="tooltip"
          className="absolute z-40 left-0 top-full mt-1 w-64 max-w-[min(16rem,80vw)] rounded-lg border border-base-300 bg-base-100 px-2.5 py-2 text-left text-xs font-normal normal-case tracking-normal text-neutral shadow-soft leading-relaxed"
        >
          {tip}
        </span>
      ) : null}
    </span>
  );
}

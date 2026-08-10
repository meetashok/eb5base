'use client';

import { useEffect } from 'react';
import { ExternalExplainerSection } from '@/components/nprm/ExternalExplainers';
import NprmSectionHeading from '@/components/nprm/NprmSectionHeading';
import { FR_HTML, FR_PDF, NPRM_LAST_UPDATED } from '@/lib/nprm/utils';

const SECTIONS: {
  id: string;
  title: string;
  current: string;
  proposed: string;
  why: string;
  risk: string;
  page: string;
}[] = [
  {
    id: 'amounts',
    title: 'Investment amounts & inflation',
    current:
      'Post-RIA practice uses $800,000 TEA/infrastructure and $1,050,000 standard amounts set by statute.',
    proposed:
      'Codifies those amounts and adds a new $1.4M high-employment area tier. Automatic inflation adjustment Jan 1, 2027 and every 5 years thereafter.',
    why: 'Future filers (and anyone waiting past Jan 2027) face higher dollars; India/China backlog filers already in should confirm their tier is locked.',
    risk: 'If finalized without grandfathering clarity, petitions filed before inflation day but adjudicated after could be disputed.',
    page: 'FR Doc 2026-13392 (amounts / inflation)',
  },
  {
    id: 'tea',
    title: 'TEA determinations',
    current:
      'USCIS has been centralizing TEA decisions; state designation letters are no longer the primary path for new cases.',
    proposed:
      'Puts USCIS TEA methodology into regulation with formal criteria for high-unemployment and rural designations.',
    why: 'Where your project sits decides $800K vs $1.05M vs the new $1.4M tier.',
    risk: 'Opaque unemployment data sources make TEA outcomes hard to predict or challenge.',
    page: 'FR Doc 2026-13392 (TEA methodology)',
  },
  {
    id: 'sustainment',
    title: 'Two-year sustainment & redeployment',
    current:
      'Many investors faced indefinite redeployment while waiting for visas through conditional residency.',
    proposed:
      'Capital must remain at risk for a minimum of 2 years from the date made available to the job-creating entity (JCE). DHS expects redeployment to become rare for post-RIA cases.',
    why: 'Especially material for India/China backlogged investors whose capital sat far longer than the job-creation clock.',
    risk: 'Ambiguity on when the clock starts (NCE vs JCE) could still force unwanted redeployments.',
    page: 'FR Doc 2026-13392 (sustainment)',
  },
  {
    id: 'good-faith',
    title: 'Good-faith investor + I-527 + 180-day rule',
    current:
      'RIA good-faith protections exist in statute; practice for terminated RCs has been uneven.',
    proposed:
      'Formalizes a 180-day window to re-associate with a compliant sponsor, priority date retention, and Form I-527. Investors who completed 2 years + job creation need not re-invest.',
    why: 'If your RC fails, this is the safety net that keeps your priority date and capital path intact.',
    risk: '180 days may be too short when counsel, new RC diligence, and I-527 processing stack up.',
    page: 'FR Doc 2026-13392 (good faith / I-527)',
  },
  {
    id: 'priority-date',
    title: 'Priority date retention',
    current: 'Priority date retention rules exist but edge cases after RC failure remain contested.',
    proposed:
      'Clarifies when an investor may retain a priority date from an earlier approved petition when refiling.',
    why: 'Backlogged investors live and die by priority date; losing it can reset years of waiting.',
    risk: 'Unclear treatment of personal withdrawal vs RC termination scenarios.',
    page: 'FR Doc 2026-13392 (priority date)',
  },
  {
    id: 'sanctions',
    title: 'Sanctions, audits, fund administration',
    current: 'Integrity measures exist under RIA; penalty detail has been thin in regulation.',
    proposed:
      'Expanded audits, site visits, tiered penalties up to 10% of capital invested, example $10K late annual statement fines, suspension/termination/debarment.',
    why: 'Stronger RC oversight can protect investors, but cost pressures may shrink the pool of small RCs.',
    risk: '87% of RCs are small entities; fixed compliance costs land hardest on single-project sponsors.',
    page: 'FR Doc 2026-13392 (sanctions)',
  },
  {
    id: 'promoters',
    title: 'Promoter registration',
    current: 'Overseas promoters have often been lightly regulated in practice.',
    proposed:
      'Mandatory registration of direct and third-party promoters so investors can verify who is selling them a deal.',
    why: 'Transparency reduces pressure sales and undisclosed fee stacks.',
    risk: 'Gaps in foreign enforcement could leave the worst actors untouched.',
    page: 'FR Doc 2026-13392 (promoters)',
  },
  {
    id: 'bridge-capital',
    title: 'Bridge financing & qualifying capital',
    current: 'Bridge financing is common in project capital stacks.',
    proposed:
      'Restricts use of repaid bridge financing in certain circumstances and refines what counts as qualifying capital.',
    why: 'Rural and early-stage projects often rely on bridge; structure changes can delay closings.',
    risk: 'Over-broad restrictions may chill financing for projects investors want to fund.',
    page: 'FR Doc 2026-13392 (bridge / capital)',
  },
  {
    id: 'source-funds',
    title: 'Source of funds, crypto',
    current: 'Crypto as source of funds has been handled case-by-case with heavy RFEs.',
    proposed:
      'Confirms crypto can be a lawful source of funds, invites comment on standards, without a full crypto evidence manual yet.',
    why: 'Investors who used or plan to use digital assets need predictable documentation rules.',
    risk: 'Leaving standards ad hoc invites inconsistent RFEs and denials.',
    page: 'FR Doc 2026-13392 (source of funds)',
  },
];

export default function SummaryTab() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.location.hash !== '#external-explainers') return;
    const el = document.getElementById('external-explainers');
    if (!el) return;
    const id = window.requestAnimationFrame(() => {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    return () => window.cancelAnimationFrame(id);
  }, []);

  return (
    <div className="animate-[fadeIn_0.35s_ease-out] space-y-8">
      <div className="mb-0 max-w-2xl">
        <NprmSectionHeading
          as="h2"
          eyebrow="Summary"
          title="10-minute NPRM summary"
        >
          <p className="text-sm text-neutral leading-relaxed">
            Current rule vs proposed change, why it matters, and risk if finalized.
            Last updated: {NPRM_LAST_UPDATED}. Always verify on the{' '}
            <a
              href={FR_HTML}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-secondary underline underline-offset-2"
            >
              Federal Register
            </a>{' '}
            (
            <a
              href={FR_PDF}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-secondary underline underline-offset-2"
            >
              PDF
            </a>
            ).
          </p>
        </NprmSectionHeading>
      </div>

      <div className="lg:grid lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-8 items-start">
        <nav
          aria-label="Summary sections"
          className="hidden lg:block sticky top-[calc(var(--site-sticky-offset)+3.5rem)] space-y-1 text-sm"
        >
          {SECTIONS.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="block rounded-md px-2 py-1.5 text-neutral hover:bg-base-200 hover:text-primary font-medium"
            >
              {s.title}
            </a>
          ))}
        </nav>

        <div className="space-y-6 max-w-3xl">
          <div className="lg:hidden flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
            {SECTIONS.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="shrink-0 rounded-full border border-base-300 bg-base-100 px-3 py-1 text-xs font-semibold text-neutral"
              >
                {s.title}
              </a>
            ))}
          </div>

          {SECTIONS.map((s, idx) => (
            <article
              key={s.id}
              id={s.id}
              className="scroll-mt-36 rounded-xl border-2 border-base-300 bg-base-100 p-4 sm:p-5 shadow-sm space-y-3"
            >
              <NprmSectionHeading
                as="h3"
                eyebrow={`Topic ${idx + 1}`}
                title={s.title}
              />
              <dl className="space-y-2 text-sm text-neutral leading-relaxed">
                <div>
                  <dt className="font-bold text-primary">Current rule</dt>
                  <dd>{s.current}</dd>
                </div>
                <div>
                  <dt className="font-bold text-primary">Proposed</dt>
                  <dd>{s.proposed}</dd>
                </div>
                <div>
                  <dt className="font-bold text-primary">Why it matters to you</dt>
                  <dd>{s.why}</dd>
                </div>
                <div>
                  <dt className="font-bold text-primary">Risk if finalized</dt>
                  <dd>{s.risk}</dd>
                </div>
              </dl>
              <p className="text-xs font-semibold text-neutral/70">
                Page reference:{' '}
                <a
                  href={FR_HTML}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-secondary underline underline-offset-2"
                >
                  {s.page}
                </a>
              </p>
            </article>
          ))}
        </div>
      </div>

      <ExternalExplainerSection />
    </div>
  );
}

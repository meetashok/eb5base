'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import GlossaryTerm, {
  GlossaryText,
} from '@/components/nprm/GlossaryTerm';
import NprmSectionHeading from '@/components/nprm/NprmSectionHeading';

export type InvestorFilter = 'all' | 'pre_ria' | 'post_ria' | 'future';

const ROWS: {
  topic: string;
  happening: string;
  means: string;
  legal: string;
  preRia: string;
  postRia: string;
  future: string;
  comment: string;
  tone: 'win' | 'watch' | 'risk' | 'neutral';
}[] = [
  {
    topic: 'When you can get your money back',
    happening:
      'Draft says about 2 years from when your money reaches the job-creating project, not until your green card.',
    means:
      'You may get capital back sooner, without forced redeployment into a project you did not choose.',
    legal: '8 CFR 216.6 · 2-year sustainment',
    preRia:
      'Your money often had to stay at risk for the whole wait. Redeployment was common.',
    postRia:
      'Win: about 2 years after money reaches the job project, and once jobs are created, you can get capital back even if your visa is still pending.',
    future: 'Same 2-year rule. Forced redeployment should be rare.',
    comment: 'Support the 2-year rule? Say when the clock should start.',
    tone: 'win',
  },
  {
    topic: 'What if your regional center closes',
    happening:
      'Draft gives you about 180 days to find a new sponsor and keep your place in line.',
    means:
      'You are not punished if the center fails through no fault of your own. If you already finished 2 years and jobs, you may not need to reinvest.',
    legal: 'Form I-527 · good-faith investor protection',
    preRia: 'Termination of a center could sink your case with it.',
    postRia:
      'Win: about 180 days to re-associate, and you keep your place in line. If 2 years and jobs are done, you may not need to reinvest.',
    future: 'Same protection.',
    comment: 'Is 180 days enough? Ask for faster re-association.',
    tone: 'win',
  },
  {
    topic: 'How much you pay',
    happening:
      '$800K for rural and high unemployment and $1.05M standard stay for now. New $1.4M tier for very low unemployment areas. Amounts rise with inflation on Jan 1, 2027.',
    means:
      'If you file after Jan 1, 2027, you may pay more. The $1.4M tier will rarely affect most investors.',
    legal: '8 CFR 204.6 · investment thresholds',
    preRia:
      'You paid under older $500K / $1M rules. Amounts do not go backward. New good-faith forms help if your center failed.',
    postRia:
      'You already paid $800K (rural / high unemployment) or $1.05M standard. The draft locks those amounts in.',
    future:
      'Same $800K / $1.05M today. New $1.4M tier for high-employment areas. Inflation adjustment starts Jan 1, 2027.',
    comment: 'Fair inflation path? Is the $1.4M tier needed?',
    tone: 'watch',
  },
  {
    topic: 'Who decides if your project qualifies for $800K',
    happening:
      'Before 2022, states often decided. Now USCIS decides. The draft writes that into the formal rule.',
    means:
      'More consistent nationwide, but USCIS needs to be clear about how it decides.',
    legal: 'TEA determination · INA 203(b)(5)(E)',
    preRia: 'State designation letters were common.',
    postRia: 'USCIS decides centrally whether a project qualifies for the lower amount.',
    future: 'Same USCIS method, written into regulation with clearer criteria.',
    comment: 'Ask DHS to publish a clear unemployment method.',
    tone: 'watch',
  },
  {
    topic: 'Fines and audits for regional centers',
    happening:
      'Centers face audits, site visits, and fines (example: up to 10% of capital, late-filing penalties).',
    means:
      'Centers may have higher costs. Many are small, so fixed costs hurt them most and some may exit.',
    legal: 'Sanctions regime · audits',
    preRia: 'Centers had little formal oversight.',
    postRia:
      'Audits, site visits, reporting, fines, suspension, or termination are on the table.',
    future:
      'Higher compliance cost. Small single-project centers feel it most.',
    comment: 'Ask whether fines are proportional. Request real cost data.',
    tone: 'risk',
  },
  {
    topic: 'Using crypto for source of funds',
    happening:
      'Draft says crypto can be a lawful source and asks what evidence should be required.',
    means:
      'If you used crypto, you can still file, but document the chain clearly.',
    legal: 'Source of funds · digital assets',
    preRia: 'Rules were unclear.',
    postRia:
      'Crypto is accepted as a lawful source. No crypto-only rulebook yet. DHS asks for comment.',
    future: 'Same: crypto is allowed if you document the source.',
    comment: 'Should USCIS publish a clear crypto evidence standard?',
    tone: 'watch',
  },
  {
    topic: 'Bridge loans and project financing',
    happening:
      'Draft proposes to stop counting repaid bridge loans for job creation in some cases.',
    means:
      'May change how projects are structured, especially rural projects that rely on bridge money.',
    legal: 'Bridge financing restriction',
    preRia: 'Bridge financing was common in project stacks.',
    postRia:
      'DHS proposes limiting repaid bridge financing for proving job creation.',
    future: 'Stricter structuring for new projects.',
    comment: 'Will this hurt rural projects that use bridge financing?',
    tone: 'risk',
  },
  {
    topic: 'People who sell EB-5 abroad',
    happening: 'Draft says promoters must register.',
    means: 'You can check whether a promoter is registered. More transparency.',
    legal: 'Promoter registration',
    preRia: 'Often unregulated abroad.',
    postRia: 'Direct and third-party promoters must register.',
    future: 'You can verify registration before you pay fees.',
    comment: 'Support clearer promoter transparency.',
    tone: 'win',
  },
];

function ToneDot({ tone }: { tone: 'win' | 'watch' | 'risk' | 'neutral' }) {
  const cls =
    tone === 'win'
      ? 'bg-emerald-600'
      : tone === 'watch'
        ? 'bg-amber-500'
        : tone === 'risk'
          ? 'bg-red-500'
          : 'bg-neutral/40';
  const label =
    tone === 'win'
      ? 'Investor win'
      : tone === 'watch'
        ? 'Watch'
        : tone === 'risk'
          ? 'Cost/risk'
          : 'Neutral';
  return (
    <span className="inline-flex items-center gap-1.5 shrink-0" title={label}>
      <span className={`h-2 w-2 rounded-full ${cls}`} aria-hidden />
      <span className="sr-only">{label}</span>
    </span>
  );
}

function parseInvestor(raw: string | null): InvestorFilter {
  if (raw === 'pre_ria' || raw === 'post_ria' || raw === 'future') return raw;
  return 'all';
}

const FILTERS: { id: InvestorFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'pre_ria', label: 'Filed before Mar 2022' },
  { id: 'post_ria', label: 'Filed after Mar 2022' },
  { id: 'future', label: 'Planning to file' },
];

export default function ImpactMatrix({
  initialInvestor,
}: {
  initialInvestor?: InvestorFilter;
}) {
  const searchParams = useSearchParams();
  const [filter, setFilter] = useState<InvestorFilter>(
    initialInvestor || 'all'
  );

  useEffect(() => {
    setFilter(parseInvestor(searchParams.get('investor')));
  }, [searchParams]);

  function selectFilter(next: InvestorFilter) {
    setFilter(next);
    const params = new URLSearchParams(window.location.search);
    if (next === 'all') params.delete('investor');
    else params.set('investor', next);
    const qs = params.toString();
    // history only — NPRM tab switches already use pushState; a Next router
    // replace here would remount the shell and flash the top nav.
    window.history.replaceState(
      null,
      '',
      `${window.location.pathname}${qs ? `?${qs}` : ''}#impact-matrix`
    );
  }

  const showPre = filter === 'all' || filter === 'pre_ria';
  const showPost = filter === 'all' || filter === 'post_ria';
  const showFuture = filter === 'all' || filter === 'future';
  const eraView = filter !== 'all';

  return (
    <section className="space-y-3 nprm-prose" id="impact-matrix">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <NprmSectionHeading
          eyebrow="Impact"
          title="How does this affect me?"
        >
          <p className="text-sm text-neutral leading-relaxed max-w-3xl">
            Plain English first. Green = investor win, amber = watch, red =
            cost/risk. Hover or tap terms like{' '}
            <GlossaryTerm term="TEA" /> or <GlossaryTerm term="JCE" /> for
            definitions.
          </p>
        </NprmSectionHeading>
        <div
          className="flex flex-wrap gap-1.5"
          role="group"
          aria-label="Filter by filing era"
        >
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              aria-pressed={filter === f.id}
              onClick={() => selectFilter(f.id)}
              className={`btn btn-xs h-7 min-h-0 px-2.5 border ${
                filter === f.id
                  ? 'btn-primary text-primary-content border-primary'
                  : 'btn-ghost bg-base-100 border-base-300'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {!eraView ? (
        <div className="overflow-x-auto rounded-xl border-2 border-base-300 bg-base-100 shadow-soft">
          <table className="min-w-[36rem] w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-base-200/80 text-primary">
                <th className="px-3 py-2.5 font-bold border-b border-base-300 min-w-[10rem]">
                  Topic
                </th>
                <th className="px-3 py-2.5 font-bold border-b border-base-300 min-w-[12rem]">
                  What is happening
                </th>
                <th className="px-3 py-2.5 font-bold border-b border-base-300 min-w-[12rem]">
                  What it means for you
                </th>
                <th className="px-3 py-2.5 font-bold border-b border-base-300 min-w-[9rem]">
                  Legal reference
                </th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row) => {
                const bg =
                  row.tone === 'win'
                    ? 'bg-[var(--investor-win)]'
                    : row.tone === 'watch'
                      ? 'bg-[var(--watch)]'
                      : row.tone === 'risk'
                        ? 'bg-[var(--risk)]'
                        : 'bg-base-100';
                return (
                  <tr key={row.topic} className={`${bg} align-top`}>
                    <th
                      scope="row"
                      className={`px-3 py-2.5 font-semibold text-primary border-b border-base-300/80 ${bg}`}
                    >
                      <span className="inline-flex items-center gap-2">
                        <ToneDot tone={row.tone} />
                        <span>{row.topic}</span>
                      </span>
                    </th>
                    <td className="px-3 py-2.5 text-neutral leading-relaxed border-b border-base-300/80">
                      <GlossaryText text={row.happening} />
                    </td>
                    <td className="px-3 py-2.5 text-neutral leading-relaxed border-b border-base-300/80">
                      <GlossaryText text={row.means} />
                    </td>
                    <td className="px-3 py-2.5 border-b border-base-300/80">
                      <span className="nprm-legal-ref">
                        <GlossaryText text={row.legal} />
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border-2 border-base-300 bg-base-100 shadow-soft relative">
          <p className="sm:hidden text-[10px] font-semibold uppercase tracking-wider text-neutral/60 px-3 pt-2">
            Swipe sideways to compare columns
          </p>
          <table className="min-w-[40rem] w-full text-left text-xs sm:text-sm border-collapse">
            <thead>
              <tr className="bg-base-200/80 text-primary">
                <th className="sticky left-0 z-10 bg-base-200 px-3 py-2.5 font-bold border-b border-base-300 min-w-[9rem]">
                  Topic
                </th>
                {showPre ? (
                  <th className="px-3 py-2.5 font-bold border-b border-base-300 min-w-[12rem]">
                    Filed BEFORE Mar 2022
                  </th>
                ) : null}
                {showPost ? (
                  <th className="px-3 py-2.5 font-bold border-b border-base-300 min-w-[12rem] ring-2 ring-inset ring-secondary/40">
                    Filed AFTER Mar 2022
                  </th>
                ) : null}
                {showFuture ? (
                  <th className="px-3 py-2.5 font-bold border-b border-base-300 min-w-[12rem]">
                    Plan to file
                  </th>
                ) : null}
                <th className="px-3 py-2.5 font-bold border-b border-base-300 min-w-[10rem]">
                  What to comment on
                </th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row) => {
                const bg =
                  row.tone === 'win'
                    ? 'bg-[var(--investor-win)]'
                    : row.tone === 'watch'
                      ? 'bg-[var(--watch)]'
                      : row.tone === 'risk'
                        ? 'bg-[var(--risk)]'
                        : 'bg-base-100';
                return (
                  <tr key={row.topic} className={`${bg} align-top`}>
                    <th
                      scope="row"
                      className={`sticky left-0 z-10 px-3 py-2.5 font-semibold text-primary border-b border-base-300/80 ${bg}`}
                    >
                      <span className="inline-flex items-center gap-2">
                        <ToneDot tone={row.tone} />
                        <span className="space-y-1">
                          <span className="block">{row.topic}</span>
                          <span className="nprm-legal-ref block font-normal">
                            <GlossaryText text={row.legal} />
                          </span>
                        </span>
                      </span>
                    </th>
                    {showPre ? (
                      <td className="px-3 py-2.5 text-neutral leading-relaxed border-b border-base-300/80">
                        <GlossaryText text={row.preRia} />
                      </td>
                    ) : null}
                    {showPost ? (
                      <td className="px-3 py-2.5 text-neutral leading-relaxed border-b border-base-300/80">
                        <GlossaryText text={row.postRia} />
                      </td>
                    ) : null}
                    {showFuture ? (
                      <td className="px-3 py-2.5 text-neutral leading-relaxed border-b border-base-300/80">
                        <GlossaryText text={row.future} />
                      </td>
                    ) : null}
                    <td className="px-3 py-2.5 text-neutral leading-relaxed border-b border-base-300/80 font-medium">
                      <GlossaryText text={row.comment} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

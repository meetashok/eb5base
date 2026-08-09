const ROWS: {
  topic: string;
  preRia: string;
  postRia: string;
  future: string;
  comment: string;
  tone: 'win' | 'watch' | 'risk' | 'neutral';
}[] = [
  {
    topic: 'Investment Amount',
    preRia:
      'You paid $500K/$1M old rules. No change. But good-faith protections via I-527 now formalized if your RC failed.',
    postRia:
      'You already paid $800K TEA / $1.05M standard. Rule codifies those amounts.',
    future:
      'Same $800K/$1.05M today. NEW $1.4M tier for high-employment areas. Inflation hike Jan 1, 2027.',
    comment: 'Do you support inflation adjustment? Is $1.4M tier fair?',
    tone: 'watch',
  },
  {
    topic: 'TEA Determination',
    preRia: 'State letters used before.',
    postRia: 'USCIS now decides TEAs centrally.',
    future: 'Same USCIS method, now in regulation with formal criteria.',
    comment: 'Should DHS publish clearer unemployment methodology?',
    tone: 'watch',
  },
  {
    topic: 'Sustainment / Redeployment',
    preRia: 'You were subject to redeployment for entire conditional period.',
    postRia:
      'WIN: Only 2 years from investment made available to JCE. After that + job creation met, you can get capital back even if visa backlogged. DHS says this lessens burden from visa backlogs.',
    future: 'Same 2-year rule. Redeployment expected to be rare.',
    comment:
      'Support 2-year rule? Should clock start at investment or JCE deployment?',
    tone: 'win',
  },
  {
    topic: 'If Your Regional Center Fails',
    preRia: 'Old regime: termination could take you down with it.',
    postRia:
      'RIA good-faith protection now in reg: 180-day to re-associate, priority date survives. If 2-year + jobs done, no re-invest needed.',
    future: 'Same protection.',
    comment: 'Is 180 days enough? Should there be expedited re-association?',
    tone: 'win',
  },
  {
    topic: 'Priority Date Retention',
    preRia: 'Limited.',
    postRia:
      'You can retain priority date from earlier approved petition when refiling if you meet requirements.',
    future: 'Same.',
    comment:
      'Clarify when retention is allowed after RC termination vs. personal withdrawal.',
    tone: 'neutral',
  },
  {
    topic: 'Sanctions / Audits',
    preRia: 'RCs had little formal oversight.',
    postRia:
      'RCs face audits, site visits, reporting, up to 10% fine of invested capital, suspension/termination.',
    future:
      'Higher compliance cost: DHS estimates ~$47K/yr per RC but real cost higher, hits small single-project RCs hardest.',
    comment: 'Comment on proportionality of fines. Ask DHS for real cost data.',
    tone: 'risk',
  },
  {
    topic: 'Source of Funds - Crypto',
    preRia: 'Unclear.',
    postRia:
      'Rule confirms crypto accepted as lawful source, no crypto-specific regs yet, DHS asks for comment.',
    future: 'Same - can use crypto but document source.',
    comment: 'Should USCIS create crypto evidence standard?',
    tone: 'watch',
  },
  {
    topic: 'Bridge Financing',
    preRia: 'Common.',
    postRia:
      'DHS proposes eliminating repaid bridge financing in certain circumstances and refining qualifying capital.',
    future: 'Stricter structuring.',
    comment: 'Will this hurt rural projects that use bridge?',
    tone: 'risk',
  },
  {
    topic: 'Promoters',
    preRia: 'Unregulated abroad.',
    postRia: 'Mandatory registration of direct and third-party promoters.',
    future: 'You can verify promoter is registered.',
    comment: 'Support transparency.',
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

export default function ImpactMatrix() {
  return (
    <section className="space-y-3" id="impact-matrix">
      <div>
        <h3 className="text-lg font-bold text-primary">
          How Does This Affect Me? Impact Matrix
        </h3>
        <p className="text-sm text-neutral mt-1 leading-relaxed max-w-3xl">
          Compare Pre-RIA, Post-RIA, and future filers. Green = investor win,
          amber = watch, red = cost/risk. JCE = job-creating entity; NCE = new
          commercial enterprise.
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl border-2 border-base-300 bg-base-100 shadow-soft">
        <table className="min-w-[64rem] w-full text-left text-xs sm:text-sm border-collapse">
          <thead>
            <tr className="bg-base-200/80 text-primary">
              <th className="sticky left-0 z-10 bg-base-200 px-3 py-2.5 font-bold border-b border-base-300 min-w-[9rem]">
                Topic
              </th>
              <th className="px-3 py-2.5 font-bold border-b border-base-300 min-w-[12rem]">
                Filed BEFORE Mar 2022 (Pre-RIA)
              </th>
              <th className="px-3 py-2.5 font-bold border-b border-base-300 min-w-[12rem]">
                Filed AFTER Mar 2022 (Post-RIA)
              </th>
              <th className="px-3 py-2.5 font-bold border-b border-base-300 min-w-[12rem]">
                Plan to file in future
              </th>
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
                    <span className="inline-flex items-start gap-2">
                      <ToneDot tone={row.tone} />
                      <span>{row.topic}</span>
                    </span>
                  </th>
                  <td className="px-3 py-2.5 text-neutral leading-relaxed border-b border-base-300/80">
                    {row.preRia}
                  </td>
                  <td className="px-3 py-2.5 text-neutral leading-relaxed border-b border-base-300/80">
                    {row.postRia}
                  </td>
                  <td className="px-3 py-2.5 text-neutral leading-relaxed border-b border-base-300/80">
                    {row.future}
                  </td>
                  <td className="px-3 py-2.5 text-neutral leading-relaxed border-b border-base-300/80 font-medium">
                    {row.comment}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

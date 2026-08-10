/** Independent plain-English explainers of FR Doc 2026-13392 (NPRM). Verified Aug 10 2026. */

export type NprmExternalSource = {
  id: string;
  title: string;
  publisher: string;
  date: string;
  url: string;
  covers: string[];
  /** Short investor-facing blurb for Overview cards. */
  blurb: string;
};

export const NPRM_EXTERNAL_SOURCES: NprmExternalSource[] = [
  {
    id: 'bal',
    title: 'DHS proposes extensive regulatory updates to implement EB-5 visa program reform',
    publisher: 'BAL',
    date: '2026-07-02',
    url: 'https://www.bal.com/immigration-news/united-states-dhs-proposes-extensive-regulatory-updates-to-implement-eb-5-visa-program-reform/',
    covers: ['thresholds', 'TEA', 'audit'],
    blurb:
      'Lists the main proposed changes, confirms current $800K / $1.05M thresholds with a Jan 1 2027 inflation adjustment, and notes audits plus removal of the troubled-business path.',
  },
  {
    id: 'badmus',
    title: 'DHS Unveils Long-Awaited EB-5 Proposed Regulations: What Investors Need to Know',
    publisher: 'Badmus & Associates',
    date: '2026-07-02',
    url: 'https://badmuslaw.com/blog/dhs-unveils-long-awaited-eb-5-proposed-regulations-what-investors-need-to-know/',
    covers: ['sustainment', 'redeployment', 'good faith', 'HEA tier', 'crypto'],
    blurb:
      'Investor-first read on who is affected, the proposed $1.4M high-employment tier, 2-year sustainment for India/China queues, 180-day good-faith reassociation, and crypto as a lawful source of funds.',
  },
  {
    id: 'imi',
    title: 'DHS Unveils Long-Awaited EB-5 Regulations: $1.4M Tier, Two-Year Capital Rule, Sanctions Regime',
    publisher: 'IMI Daily',
    date: '2026-07-02',
    url: 'https://www.imidaily.com/north-america/dhs-unveils-long-awaited-eb-5-regulations-1-4m-tier-two-year-capital-rule-sanctions-regime/',
    covers: ['HEA tier', 'sustainment', 'sanctions', 'small entities'],
    blurb:
      'Detailed industry take: the $1.4M tier as a DHS design, TEA choice rates from approval data, litigated 2-year sustainment history, and sanctions / small-entity impact.',
  },
  {
    id: 'visaverge',
    title: 'EB-5 Visa Rules 2026: New Investment Tiers & DHS Compliance',
    publisher: 'VisaVerge',
    date: '2026-07-02',
    url: 'https://www.visaverge.com/news/dhs-proposes-tougher-eb-5-investor-visa-rules-under-2022-reform-law/',
    covers: ['thresholds', 'inflation', 'promoters'],
    blurb:
      'Clear on $800K / $1.05M / $1.4M thresholds, the Jan 1 2027 CPI-U adjustment framework (TEA 75% and HEA 133% of standard), promoter recordkeeping, and due diligence questions.',
  },
  {
    id: 'business-standard',
    title: 'US proposes stricter EB-5 investor visa rules: What applicants should know',
    publisher: 'Business Standard',
    date: '2026-07-03',
    url: 'https://www.business-standard.com/immigration/us-proposes-stricter-eb-5-investor-visa-rules-what-applicants-should-know-126070300781_1.html',
    covers: ['India', 'scrutiny', 'transparency'],
    blurb:
      'India-focused overview of tighter scrutiny and a more transparent process for applicants watching the NPRM.',
  },
];

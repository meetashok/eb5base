import type {
  KeyTopic,
  KeyTopicPolarity,
  NprmOpinion,
  NprmPromptNode,
  NprmTheme,
} from '@/lib/nprm/types';

/** Stable hash id for Summary deep links (`#topic-{id}`). */
export function topicSectionId(topicId: string): string {
  return `topic-${topicId}`;
}

export const KEY_TOPICS: KeyTopic[] = [
  {
    id: 'sustainment',
    title:
      'You may get your investment back after about 2 years, not after many years',
    shortTitle: 'Capital back after about 2 years',
    body: 'Old practice often kept your money stuck until the green card path moved, which for India and China backlogs could mean years of redeployment risk. The draft says capital only needs to stay invested for about 2 years after it is made available to the JCE, once the required jobs are created. That is the sustainment clock investors have been waiting to see written into regulation. If finalized this way, many post-RIA investors can plan for return of capital even before getting CGC.',
    frHeadingId: 'h-66',
    frSectionLabel: 'IV.D.6 Duration of Investment',
    // FR IV.D.6 Duration of Investment + 204.407(b) remain-invested-at-filing
    // language; 216.6 covers I-829 removal of conditions.
    cfrs: ['INA 203(b)(5)(A)(ii)', '8 CFR 204.407(b)', '8 CFR 216.6'],
    summary: {
      overview:
        'RIA changed the statute so investment is expected to remain invested for at least 2 years. The NPRM would write that into regulation and measure the clock from when capital is at risk and made available to the JCE, not from when a visa becomes current. For backlog countries, that is the difference between a defined sustainment period and years of forced redeployment. The open drafting fights are when the clock starts, what happens with escrow, and whether 2 years is long enough for program integrity and rural construction timelines.',
      current:
        'After RIA, USCIS practice points to a 2-year expectation, but investors still face ambiguity and redeployment pressure when visas are delayed.',
      proposed:
        'Codify a minimum 2-year sustainment period starting when capital is made available to the JCE (with related escrow rules), so redeployment should become rare for post-RIA cases once jobs are created.',
    },
    stances: [
      {
        id: 'support_two_year_clarify',
        polarity: 'agree',
        label: 'Support the 2-year rule; ask for clear start and exit rules',
        angles: [
          'Say the 2-year clock should start when capital is made available to the JCE, not when your visa becomes current.',
          'Ask DHS to confirm you can receive return of capital after 2 years and job creation, even before CGC.',
          'Oppose forced redeployment into a new project you did not choose after the sustainment period ends.',
          'Ask for clear rules on escrowed capital: when the 2-year expectation starts.',
        ],
        pros: [
          'Gives backlog investors a defined end to capital lockup instead of indefinite redeployment.',
          'Matches the RIA’s 2-year statutory language more closely than old “through conditional residence” practice.',
          'Clarity on JCE start date and escrow reduces RFE risk and project-finance uncertainty.',
        ],
        cons: [
          'A short clock can look weak on integrity if capital exits before projects fully stabilize.',
          'Rural and long-build projects may argue 2 years is too short for real job creation.',
          'If start-date wording stays fuzzy, adjudicators may still force redeployments investors thought they avoided.',
        ],
      },
      {
        id: 'prefer_longer_or_jobs',
        polarity: 'disagree',
        label: 'Prefer longer or job-creation-tied sustainment',
        angles: [
          'Ask DHS to tie sustainment to job creation and I-829 readiness, not only a 2-year calendar.',
          'Argue that large TEA or rural builds often need more than 2 years and that a short clock can force unhealthy exits.',
          'If a longer period is kept, ask for clear, limited extension triggers instead of open-ended redeployment.',
        ],
        pros: [
          'Longer or job-tied sustainment can better match construction and job-creation reality.',
          'Can reduce pressure to recycle capital in ways that look like paper compliance.',
          'Aligns the comment with a stronger “capital stays until jobs are real” integrity story.',
        ],
        cons: [
          'Extends investor capital risk, especially for India and China backlog families.',
          'Conflicts with many investors’ reliance on RIA’s 2-year framing when they filed.',
          'Without tight limits, “longer” can slide back toward indefinite lockup.',
        ],
      },
    ],
  },
  {
    id: 'bridge_financing',
    title:
      'Repaid bridge financing may no longer count toward proving your 10 jobs',
    shortTitle: 'Bridge financing and your 10 jobs',
    body: 'Today, under the USCIS Policy Manual (not a final regulation), investors can often still claim jobs created with short-term bridge financing that EB-5 capital later repays. The NPRM would change that: jobs from financing repaid with EB-5 money would not count as jobs created by that EB-5 capital. That is draft language only. It is not law yet, and RIA itself did not ban bridge financing. DHS also says the rule would generally apply prospectively to petitions filed on or after the final rule\'s effective date, not automatically to every post-RIA filing from March 2022 onward.',
    frHeadingId: 'h-67',
    frSectionLabel: 'IV.D.7 Job Creation Requirements and Bridge Financing',
    cfrs: ['8 CFR 204.407(e)(1)', 'INA 203(b)(5)(A)(ii)'],
    inlineLinks: [
      {
        phrase: 'USCIS Policy Manual',
        href: 'https://www.uscis.gov/policy-manual/volume-6-part-g-chapter-2',
        title:
          'USCIS Policy Manual, Volume 6, Part G, Chapter 2 (Bridge Financing, G.2(D)(1))',
      },
    ],
    summary: {
      overview:
        'Bridge financing is common in real estate and infrastructure: a project starts with temporary capital, then EB-5 money replaces it. Under today’s Policy Manual, jobs created while the bridge was working can often still count. The NPRM proposes that jobs attributable to financing repaid with EB-5 capital may not be claimed as jobs created by that EB-5 capital. DHS also asks for comments on restricting bridge rather than eliminating it. The biggest live question for pending investors is transition: prospective filing cutoff vs I-829 treatment for projects already structured under Policy Manual rules.',
      current:
        'Policy Manual guidance generally allows credit for jobs when temporary bridge financing is later replaced with EB-5 capital.',
      proposed:
        'Proposed 8 CFR 204.407(e)(1) would stop counting repaid-bridge jobs as EB-5 job creation, while DHS solicits alternatives such as maturity or concentration limits.',
    },
    stances: [
      {
        id: 'support_tighter_nexus',
        polarity: 'agree',
        label: 'Support a tighter capital-to-jobs nexus for new filings',
        angles: [
          'Support ending or tightly limiting repaid-bridge job credit for petitions filed after the final rule’s effective date.',
          'Ask DHS to publish clear maturity or share-of-cost limits if it chooses restriction instead of elimination.',
          'Ask for bright-line examples so rural projects know what still qualifies.',
        ],
        pros: [
          'Tightens the link between an investor’s capital and the jobs claimed, which is how DHS reads the RIA “by creating” language.',
          'Reduces room for paper job-credit structures that repay old loans without new economic activity.',
          'Clear prospective rules can improve consistency across adjudications.',
        ],
        cons: [
          'Can slow or block rural and early-stage projects that need interim capital before EB-5 closes.',
          'May raise costs or delay groundbreaking if sponsors wait for full EB-5 stacks.',
          'If transition wording is weak, pending investors fear I-829 denials on deals built under Policy Manual practice.',
        ],
      },
      {
        id: 'keep_or_grandfather_bridge',
        polarity: 'disagree',
        label: 'Keep Policy Manual treatment or grandfather pending projects',
        angles: [
          'Ask DHS to say expressly that any bridge change applies only to petitions filed on or after the final rule’s effective date.',
          'Ask that pending I-526E / I-829 cases keep the current Policy Manual treatment for already-structured bridge projects.',
          'Prefer restricting bridge (for example maturity limits or share of project cost) over eliminating it entirely.',
          'Ask DHS to grandfather projects with an I-956F filed before the final rule takes effect.',
        ],
        pros: [
          'Protects reliance interests for projects and investors who followed longstanding Policy Manual practice.',
          'Preserves a financing tool many rural and construction-led deals use to start on time.',
          'Restriction-with-limits can still address abuse without a blunt ban.',
        ],
        cons: [
          'Weaker nexus can look like counting jobs the EB-5 dollars did not actually create.',
          'Broad grandfathering can lock in structures DHS now calls hard to adjudicate consistently.',
          'US-interest commenters may argue integrity should not yield to market convenience.',
        ],
      },
    ],
  },
  {
    id: 'good_faith',
    title:
      'If your regional center fails, you keep your place in line for about 180 days',
    shortTitle: 'If your regional center fails',
    body: 'When a regional center is terminated, good-faith investors have historically faced chaos over whether their petition and priority date survive. The draft formalizes a roughly 180-day window to re-associate with a compliant sponsor, keep your place in the visa line, and use Form I-527 where needed. If you already finished 2 years of sustainment and job creation, you may not need to reinvest just because the center later fails.',
    frHeadingId: 'h-72',
    frSectionLabel: 'IV.D.9.c Terminations and Debarments (good-faith protections)',
    // FR IV.D.9 / proposed 8 CFR 204.410(c)-(e): 180-day re-association;
    // Form I-527 is the related amendment form (separate fee NPRM).
    cfrs: ['INA 203(b)(5)(M)', '8 CFR 204.410', 'Form I-527'],
    summary: {
      overview:
        'RIA created statutory good-faith protections when a regional center is terminated or an NCE/JCE is debarred. The NPRM would operationalize a roughly 180-day window to amend and re-associate, keep priority date, and use Form I-527. Investors who already completed sustainment and job creation may not need to put new capital at risk. Comment pressure focuses on whether 180 days is workable once notice timing, diligence on a new sponsor, and paperwork stack up.',
      current:
        'Good-faith protections exist in statute, but practice after RC failure has been uneven and stressful for investors.',
      proposed:
        'Formalize the 180-day re-association window, priority-date retention, I-527 process, and relief from reinvestment when 2 years and jobs are already done.',
    },
    stances: [
      {
        id: 'support_180_day_framework',
        polarity: 'agree',
        label: 'Support the 180-day good-faith framework',
        angles: [
          'Support writing the 180-day re-association window and priority-date retention into clear regulation.',
          'Confirm no new investment is required if you already completed 2 years of sustainment and job creation.',
          'Ask USCIS to publish plain-English I-527 steps so good-faith investors can act quickly.',
        ],
        pros: [
          'Gives investors a real safety net when a sponsor fails through no fault of theirs.',
          'Priority-date retention is critical for backlog families.',
          'Clear rules reduce panic refilings and inconsistent adjudicator improvisation.',
        ],
        cons: [
          'A fixed 180 days may still be tight for complex diligence and counsel workflows.',
          'Weak notice timing can eat the window before investors even learn of termination.',
          'Integrity advocates want fast cleanup of failed centers, not open-ended investor delays.',
        ],
      },
      {
        id: 'extend_or_toll_window',
        polarity: 'disagree',
        label: 'Ask for more time or tolling when the window is not workable',
        angles: [
          'Ask whether 180 days is long enough once new-sponsor diligence, counsel, and I-527 paperwork stack up.',
          'Ask for tolling or extra time when USCIS delay or notice timing eats into the window.',
          'Confirm you keep your priority date when you re-associate in good faith.',
        ],
        pros: [
          'Protects investors from losing status because of agency or sponsor delay outside their control.',
          'More realistic timelines can mean better new-sponsor diligence instead of rushed mistakes.',
          'Still preserves the good-faith concept while fixing a practical failure mode.',
        ],
        cons: [
          'Longer windows can slow program cleanup after termination or debarment.',
          'Open-ended tolling is harder to administer and easier to game.',
          'USCIS may argue 180 days already balances investor protection and program integrity.',
        ],
      },
    ],
  },
  {
    id: 'investment_amounts',
    title:
      '$800K stays for now; a new $1.4M tier and Jan 1, 2027 inflation hike are proposed',
    shortTitle: '$800K, $1.4M tier, and 2027 hike',
    body: 'Rural and high-unemployment TEA projects stay at $800K today and the standard minimum investment amount stays at $1.05M, matching post-RIA practice. The draft also adds a new high-employment area tier around $1.4M for projects in areas with unusually low unemployment. Automatic inflation adjustments are proposed for Jan 1, 2027 and every 5 years after. Future filers should treat those dates as hard planning points; people already in should confirm their tier is locked and watch how grandfathering is written in the final rule.',
    frHeadingId: 'h-59',
    frSectionLabel: 'IV.D.4 Investment Amounts',
    // FR IV.D.4: investment amounts are proposed 8 CFR 204.407(b)(1)-(3).
    cfrs: ['INA 203(b)(5)(C)', '8 CFR 204.407(b)'],
    summary: {
      overview:
        'The NPRM would lock in today’s post-RIA amounts ($800K TEA/infrastructure, $1.05M standard minimum), add a new high-employment area (HEA) tier around $1.4M, and set automatic inflation adjustments starting Jan 1, 2027. For people already filed, the live issues are whether amount and tier lock at filing and how HEA is defined. For future filers, the inflation calendar is a hard planning date.',
      current:
        'Post-RIA practice uses $800K for TEA/infrastructure and $1.05M standard; HEA has not been a separate higher tier in day-to-day filing practice.',
      proposed:
        'Codify those amounts, add ~$1.4M HEA, and inflate on a published schedule beginning Jan 1, 2027.',
    },
    stances: [
      {
        id: 'support_amounts_inflation',
        polarity: 'agree',
        label: 'Support codifying amounts and the inflation schedule',
        angles: [
          'Support locking today’s $800K / $1.05M amounts into regulation with a published inflation calendar.',
          'Ask USCIS to publish adjusted amounts early and clearly on its website before each inflation date.',
          'Confirm TEA and infrastructure remain at 75% of the standard minimum after each inflation adjustment.',
        ],
        pros: [
          'Predictable statutory-style amounts reduce surprise and litigation risk.',
          'Inflation keeps investment thresholds from eroding in real dollars over time.',
          'Publishing adjustments early helps investors and sponsors plan filings.',
        ],
        cons: [
          'Higher future amounts can price out some investors and shrink deal flow.',
          'If filing-date lock is unclear, petitions near Jan 1, 2027 face amount fights.',
          'HEA pricing may push capital away from some urban markets Congress still allows.',
        ],
      },
      {
        id: 'soften_hea_lock_filing',
        polarity: 'disagree',
        label: 'Oppose or soften HEA; lock amount at filing',
        angles: [
          'Ask DHS to lock the investment amount and tier at the petition filing date, including through the Jan 1, 2027 inflation date.',
          'Comment on whether a new $1.4M high-employment area tier is needed, and how HEA is defined.',
          'Ask for clear grandfathering so pending petitions are not re-priced after filing.',
        ],
        pros: [
          'Filing-date lock protects investors who committed capital under then-current amounts.',
          'Softening or dropping HEA avoids a third pricing cliff that few projects may use well.',
          'Clear grandfathering reduces last-minute filing rushes and denial risk.',
        ],
        cons: [
          'Weaker inflation or HEA rules can underprice high-employment markets relative to statute.',
          'Broad locks can delay the real-dollar adjustment Congress authorized.',
          'Program-integrity voices may want less special casing around amount fights.',
        ],
      },
    ],
  },
  {
    id: 'tea',
    title:
      'USCIS, not states, decides if a project qualifies for the lower amount',
    shortTitle: 'Who decides TEA / $800K eligibility',
    body: 'Whether a project gets the $800K TEA amount is decided centrally by USCIS under proposed methodology for high-unemployment and rural designations, not primarily by state designation letters. That can make outcomes more consistent nationwide, but it also means investors and developers need the data sources and census boundaries to be transparent and challengeable. A wrong TEA call is the difference between $800K and a higher tier, so methodology comments matter before the rule locks in.',
    frHeadingId: 'h-73',
    frSectionLabel: 'IV.E Targeted Employment Areas',
    // FR IV.E: TEA evidence/methodology lives in proposed 8 CFR 204.408(g)
    // (204.409 is petition decision, not TEA designation).
    cfrs: ['INA 203(b)(5)(B)', '8 CFR 204.408(g)'],
    summary: {
      overview:
        'TEA status decides whether an investor pays the lower $800K amount. The NPRM would put USCIS-centered rural and high-unemployment methodology into regulation rather than relying mainly on state letters. Consistency is the upside. Opacity is the risk: if data sources, census tract rules, and challenge rights are unclear, investors cannot diligence the $800K path. Commenters also ask whether TEA locks at I-526E filing for later I-829 review.',
      current:
        'USCIS has already been centralizing TEA decisions; state designation letters are no longer the primary path for many new cases.',
      proposed:
        'Codify USCIS TEA methodology for high-unemployment and rural designations with formal criteria.',
    },
    stances: [
      {
        id: 'support_uscis_method_transparent',
        polarity: 'agree',
        label: 'Support USCIS-central TEA rules if data is transparent',
        angles: [
          'Support a single national TEA methodology if DHS publishes the data sources, formulas, and census boundaries.',
          'Ask for predictable rural and high-unemployment tests investors can verify before investing.',
          'Ask for a clear way to challenge a wrong TEA determination before capital is stuck.',
        ],
        pros: [
          'National consistency can reduce forum-shopping and uneven state letter practice.',
          'Published methods help investors and counsel diligence $800K eligibility.',
          'Clear challenge paths improve fairness when USCIS gets a boundary call wrong.',
        ],
        cons: [
          'Centralization can ignore local labor-market knowledge states used to provide.',
          'If data stays opaque, “consistency” is just unreviewable agency discretion.',
          'Rigid tract rules can miss real distress pockets or over-include low-need areas.',
        ],
      },
      {
        id: 'lock_tea_or_state_deference',
        polarity: 'disagree',
        label: 'Lock TEA at filing or restore meaningful state deference',
        angles: [
          'Ask that TEA status lock at I-526E filing for later I-829 review.',
          'Ask DHS to give meaningful deference to state high-unemployment determinations where appropriate.',
          'Comment on rural vs high-unemployment methodology so the $800K path stays predictable.',
        ],
        pros: [
          'Filing-date lock stops census updates from rewriting the deal after capital is committed.',
          'State input can reflect local unemployment realities USCIS models miss.',
          'Predictability at filing is what investors need to choose between $800K and higher tiers.',
        ],
        cons: [
          'Hard locks can preserve TEA labels after local conditions improve.',
          'Heavy state deference can recreate inconsistent nationwide outcomes.',
          'Integrity reviewers may want TEA to reflect conditions closer to adjudication.',
        ],
      },
    ],
  },
  {
    id: 'sanctions',
    title: 'More audits and fines for regional centers',
    shortTitle: 'Audits and fines for regional centers',
    body: 'The draft expands audits, site visits, reporting duties, and tiered penalties, including examples like late annual statement fines and sanctions up to a percentage of capital. Stronger oversight can protect investors from weak sponsors, but fixed compliance costs land hardest on small and single-project centers. That may shrink the pool of sponsors, raise fees passed through to investors, or push more capital into larger multi-project operators.',
    frHeadingId: 'h-100',
    frSectionLabel: 'IV.H.8 Enforcement (penalties, terminations) and Audits',
    // FR IV.H.8 / TOC: enforcement is proposed 8 CFR 204.431 (not 204.303).
    cfrs: ['INA 203(b)(5)(G)', 'INA 203(b)(5)(J)', '8 CFR 204.431'],
    summary: {
      overview:
        'RIA gave DHS stronger integrity tools. The NPRM fleshes out audits, site visits, reporting, and tiered penalties (including examples such as late annual-statement fines and sanctions tied to a percentage of capital). Investors benefit when bad actors are removed. The tradeoff is cost: many regional centers are small entities, and fixed compliance burdens can shrink rural and single-project options or get passed through as fees.',
      current:
        'Integrity measures exist under RIA, but penalty and audit detail in regulation has been thinner.',
      proposed:
        'Expand audits, site visits, reporting duties, and tiered sanctions, including termination and debarment pathways.',
    },
    stances: [
      {
        id: 'support_integrity_tools',
        polarity: 'agree',
        label: 'Support stronger audits and sanctions against weak sponsors',
        angles: [
          'Support meaningful audits, site visits, and tiered penalties for fraud and chronic noncompliance.',
          'Ask DHS to prioritize enforcement against deceit and national-security risks, not paperwork gotchas alone.',
          'Ask how investors get timely notice when their regional center is sanctioned.',
        ],
        pros: [
          'Stronger oversight can protect investors from weak or abusive sponsors.',
          'Clear sanctions make integrity rules real instead of aspirational.',
          'Focusing on fraud and security aligns with core US interests in the RIA.',
        ],
        cons: [
          'Aggressive fines can land on small centers and reduce project choice.',
          'Compliance costs often pass through to investors as higher fees.',
          'Over-broad paperwork penalties can punish good-faith operators without improving outcomes.',
        ],
      },
      {
        id: 'proportional_small_rc',
        polarity: 'disagree',
        label: 'Ask for proportional rules that keep small and rural sponsors viable',
        angles: [
          'Ask that fines and compliance costs be proportional so small and single-project regional centers are not forced out.',
          'Ask DHS to publish realistic compliance-cost data, especially for rural and smaller sponsors.',
          'Support strong audits against fraud while protecting good-faith investors if a center is sanctioned.',
          'Ask how integrity rules will avoid shrinking the pool of rural and TEA projects investors rely on.',
        ],
        pros: [
          'Keeps rural and single-project options alive for investors who need TEA / rural paths.',
          'Proportionality targets real misconduct instead of fixed costs that hit the smallest operators hardest.',
          'Investor-protection language can separate sponsor punishment from collateral damage to petitions.',
        ],
        cons: [
          'Too much carve-out language can weaken deterrence.',
          '“Proportional” without numbers is hard for USCIS to administer consistently.',
          'Integrity commenters may see small-entity relief as a loophole.',
        ],
      },
    ],
  },
];

export function getKeyTopic(id: string): KeyTopic | undefined {
  return KEY_TOPICS.find((t) => t.id === id);
}

export function anglesByPolarity(
  topic: KeyTopic,
  polarity: KeyTopicPolarity
): string[] {
  return topic.stances
    .filter((s) => s.polarity === polarity)
    .flatMap((s) => s.angles);
}

export function stancesByPolarity(
  topic: KeyTopic,
  polarity: KeyTopicPolarity
) {
  return topic.stances.filter((s) => s.polarity === polarity);
}

/** Adapt first-party topics to the Write / Comments theme shape. */
export function toNprmThemes(topics: KeyTopic[] = KEY_TOPICS): NprmTheme[] {
  return topics.map((topic) => ({
    id: topic.id,
    title: topic.title,
    cfrs: topic.cfrs,
    summary: topic.summary.overview,
    sample_ids: [],
    opinions: topic.stances.map(
      (stance): NprmOpinion => ({
        id: stance.id,
        label: stance.label,
        stance: stance.label,
        fragments: stance.angles,
        polarity: stance.polarity,
      })
    ),
  }));
}

/** Deterministic prompt nodes from stance angles (no Meta prompt-tree). */
export function toPromptTree(topics: KeyTopic[] = KEY_TOPICS): NprmPromptNode[] {
  const nodes: NprmPromptNode[] = [];
  for (const topic of topics) {
    for (const stance of topic.stances) {
      const fragments =
        stance.angles.length > 0 ? stance.angles : [stance.label];
      fragments.forEach((fragment, phrasingIdx) => {
        nodes.push({
          theme_id: topic.id,
          opinion_id: stance.id,
          phrasing_idx: phrasingIdx,
          label: `${topic.title} - ${stance.label}`,
          cfrs: topic.cfrs,
          sample_ids: [],
          prompt_fragment: fragment,
          personal_placeholders: [
            'filing_date',
            'project_type',
            'personal_impact',
          ],
          guideline_options: [
            'style',
          ],
        });
      });
    }
  }
  return nodes;
}

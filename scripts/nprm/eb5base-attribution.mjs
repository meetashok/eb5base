/**
 * Heuristic: was this regulations.gov comment likely drafted via EB5 Base?
 * Fingerprint against the current Write-tab prompt style. Not ground truth —
 * no regs.gov "filed via" tag exists.
 *
 * @param {string} body Plain-text comment body (HTML already stripped)
 * @returns {{
 *   eb5base_likelihood: 'likely' | 'possible' | 'unlikely',
 *   eb5base_confidence: 'high' | 'medium' | 'low',
 *   eb5base_signals: string[],
 *   eb5base_anti_signals: string[],
 * }}
 */
export function assessEb5BaseAttribution(body) {
  const b = String(body || '');
  const len = b.length;
  const signals = [];
  const anti = [];

  if (/\bproposed\s+8\s*CFR\b/i.test(b)) signals.push('proposed_8_cfr');
  if (/\bI urge\b/i.test(b)) signals.push('verb_urge');
  if (/\bPlease clarify\b/i.test(b)) signals.push('verb_please_clarify');
  if (/\bDHS should\b/i.test(b)) signals.push('verb_dhs_should');
  if (/\bMy request is\b/i.test(b)) signals.push('verb_my_request');
  if (/made available to the JCE/i.test(b)) signals.push('jce_clock');
  if (
    /escrow.{0,60}(NCE|new commercial enterprise)/i.test(b) ||
    /release.{0,40}escrow/i.test(b)
  ) {
    signals.push('escrow_nce');
  }
  if (/\bI-?527\b/.test(b)) signals.push('i527');
  if (/\b180[ -]?day\b/.test(b)) signals.push('180_day');
  if (/Policy Manual/i.test(b)) signals.push('policy_manual');
  if (/forced (to )?redeploy|oppose forced redeployment/i.test(b)) {
    signals.push('no_redeploy');
  }
  if (/return of capital.{0,50}(before|even before)/i.test(b)) {
    signals.push('return_before_cgc');
  }
  if (/prospectiv/i.test(b) && /bridge/i.test(b)) {
    signals.push('bridge_prospective');
  }
  if (
    !/^As an EB-?5/i.test(b) &&
    /^(I |My |In |To USCIS|We )/i.test(b) &&
    len >= 1500
  ) {
    signals.push('personal_open_long');
  }
  const verbs = new Set(
    (b.match(/\b(I urge|Please clarify|DHS should|My request is)\b/gi) || []).map(
      (x) => x.toLowerCase()
    )
  );
  if (verbs.size >= 2) signals.push('varied_verbs');

  if (/\bDuration of Investment\b/.test(b)) anti.push('fr_header_duration');
  if (/\bGood-Faith Protection After Regional Center Failure\b/i.test(b)) {
    anti.push('fr_header_goodfaith');
  }
  if (/\bAudits, Enforcement, and Regional Center Penalties\b/i.test(b)) {
    anti.push('fr_header_sanctions');
  }
  const stockAsk = (b.match(/\bI ask DHS\/?USCIS to\b/gi) || []).length;
  if (stockAsk >= 2) anti.push(`stock_ask_x${stockAsk}`);
  if (/I respectfully ask DHS\/?USCIS to consider these comments/i.test(b)) {
    anti.push('stock_closer');
  }
  if (
    /I assume you mean|Here('s| is) a tighter version|Here is your comment/i.test(
      b
    )
  ) {
    anti.push('llm_chat_meta');
  }
  if (/Yellowstone|Big Sky|YCII|EB5 United/i.test(b)) {
    anti.push('project_campaign');
  }
  if (/Docket No\.|RIN 1615|CIS No\.|PUBLIC COMMENT/i.test(b.slice(0, 250))) {
    anti.push('formal_docket_header');
  }
  if (len < 80 || /see attached|please see (the )?attach/i.test(b)) {
    anti.push('attachment_stub');
  }
  if (
    /^I am a post-RIA investor in a rural EB-5 project\. I appreciate the opportunity/i.test(
      b
    )
  ) {
    anti.push('generic_opener_dup');
  }
  if (
    /\b8\s*CFR\s*204\./i.test(b) &&
    !/\bproposed\s+8\s*CFR\b/i.test(b)
  ) {
    anti.push('bare_cfr_no_proposed');
  }

  const pos = signals.length;
  const neg = anti.length;
  const hasFrHeader = anti.some((a) => a.startsWith('fr_header'));
  const hardAnti =
    anti.includes('attachment_stub') ||
    anti.includes('project_campaign') ||
    anti.includes('formal_docket_header');

  /** @type {'likely' | 'possible' | 'unlikely'} */
  let eb5base_likelihood;
  /** @type {'high' | 'medium' | 'low'} */
  let eb5base_confidence;

  if (hardAnti) {
    eb5base_likelihood = 'unlikely';
    eb5base_confidence = 'high';
  } else if (
    anti.includes('llm_chat_meta') ||
    anti.includes('generic_opener_dup') ||
    hasFrHeader
  ) {
    eb5base_likelihood = 'unlikely';
    eb5base_confidence =
      anti.includes('llm_chat_meta') || anti.includes('generic_opener_dup')
        ? 'high'
        : 'medium';
  } else if (
    /\bproposed\s+8\s*CFR\b/i.test(b) &&
    len >= 1500 &&
    neg <= 1 &&
    pos >= 3
  ) {
    eb5base_likelihood = 'likely';
    eb5base_confidence = pos >= 5 ? 'high' : 'medium';
  } else if (/\bproposed\s+8\s*CFR\b/i.test(b) && len >= 800 && neg <= 1) {
    eb5base_likelihood = 'possible';
    eb5base_confidence = 'medium';
  } else if (pos >= 4 && neg === 0 && len >= 1000) {
    eb5base_likelihood = 'possible';
    eb5base_confidence = 'low';
  } else {
    eb5base_likelihood = 'unlikely';
    eb5base_confidence = pos === 0 ? 'high' : 'medium';
  }

  return {
    eb5base_likelihood,
    eb5base_confidence,
    eb5base_signals: signals,
    eb5base_anti_signals: anti,
  };
}

/**
 * @param {Array<{ eb5base_likelihood?: string }>} comments
 */
export function attributionCounts(comments) {
  const counts = { likely: 0, possible: 0, unlikely: 0 };
  for (const c of comments) {
    const k = c.eb5base_likelihood;
    if (k === 'likely' || k === 'possible' || k === 'unlikely') counts[k] += 1;
  }
  return counts;
}

import { KEY_TOPICS, getKeyTopic, stancesByPolarity } from './keyTopics';
import type {
  KeyTopicPolarity,
  PersonalBlock,
  PromptGuidelines,
  ProjectTypeOption,
  TopicCommentSelection,
} from './types';
import { TIMELINE_NOTE_PROMPT } from './constants';
import { DOCUMENT_ID, FR_HTML, FR_PDF } from './utils';

const PROJECT_TYPE_LABELS: Record<ProjectTypeOption, string> = {
  rural: 'rural',
  tea_hua: 'TEA high-unemployment',
  infrastructure: 'infrastructure',
  mixed: 'mixed',
};

/** Closing styles injected one-per-prompt so drafts diverge without cross-user LLM awareness. */
const CLOSING_STYLES = [
  'End with one sentence that restates my personal stake (from My Personal Story), then stop.',
  'End by naming the single clearest change or clarification I want DHS to make, then stop.',
  'End with a short thank-you plus one specific clarification ask tied to my situation, then stop.',
  'End by tying one fact from my situation to the outcome I need in the final rule, then stop.',
] as const;

export function emptyTopicSelection(topicId: string): TopicCommentSelection {
  return {
    topicId,
    include: false,
    polarity: null,
    angles: [],
    extraNote: '',
  };
}

export function defaultTopicSelections(
  topicIds: string[] = KEY_TOPICS.map((t) => t.id)
): Record<string, TopicCommentSelection> {
  return Object.fromEntries(
    topicIds.map((id) => [id, emptyTopicSelection(id)])
  );
}

/** Topics the user chose to comment on (include = true), capped externally. */
export function includedSelections(
  selections: Record<string, TopicCommentSelection>
): TopicCommentSelection[] {
  return KEY_TOPICS.map((t) => selections[t.id])
    .filter((s): s is TopicCommentSelection => Boolean(s?.include));
}

/** A topic is ready when included, polarity chosen, and at least one angle or note. */
export function isTopicSelectionReady(sel: TopicCommentSelection): boolean {
  if (!sel.include || !sel.polarity) return false;
  return sel.angles.length > 0 || sel.extraNote.trim().length > 0;
}

export function investorTypeLabel(
  value: PersonalBlock['investor_type']
): string {
  if (value === 'pre_ria') return 'Pre-RIA';
  if (value === 'post_ria') return 'Post-RIA';
  if (value === 'future') return 'Future filer';
  if (value === 'family') return 'Family';
  return '(investor type)';
}

function polarityLabel(polarity: KeyTopicPolarity): string {
  return polarity === 'agree'
    ? 'Generally support this part of the draft (with the asks below)'
    : 'Generally want this part of the draft changed (with the asks below)';
}

function styleLabel(style: PromptGuidelines['style']): string {
  return style === 'plain'
    ? 'plain English; professional, respectful, and personal, but firm on reliance interests'
    : 'formal regulatory; professional, respectful, and personal, but firm on reliance interests';
}

/** Real statute/reg cites only (exclude topic keywords like "audits / sanctions"). */
function isLegalCite(raw: string): boolean {
  const s = raw.trim();
  if (!s) return false;
  if (/^(INA|Form)\b/i.test(s)) return true;
  if (/\b\d+\s*CFR\b/i.test(s)) return true;
  return false;
}

/** Format a pool cite so NPRM regs read as proposed, not already-final eCFR. */
function formatCiteForPrompt(raw: string): string {
  const s = raw.trim();
  if (/\b\d+\s*CFR\b/i.test(s) && !/^proposed\b/i.test(s)) {
    return `proposed ${s}`;
  }
  return s;
}

/**
 * Stable per-build pick of a closing style (not Math.random) so the same
 * selections + story get a consistent prompt, while different users diverge.
 */
export function pickClosingStyle(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return CLOSING_STYLES[h % CLOSING_STYLES.length];
}

/**
 * Adaptive length from how many issues the comment covers.
 * 1 issue stays short; 3 issues need room for personal story + asks.
 */
export function adaptiveLengthTarget(issueCount: number): {
  label: string;
  detail: string;
} {
  if (issueCount <= 1) {
    return {
      label: 'about 250-350 words',
      detail: '1 issue',
    };
  }
  if (issueCount === 2) {
    return {
      label: 'about 400-500 words',
      detail: '2 issues',
    };
  }
  return {
    label: 'about 550-750 words',
    detail: '3 issues',
  };
}

/**
 * Structured LLM brief: rich instructions + selected points, not a canned letter.
 * Personal story stays the distinctive core; topic angles are must-include asks.
 */
export function buildPrompt(input: {
  selections: Record<string, TopicCommentSelection>;
  personal: PersonalBlock;
  guidelines: PromptGuidelines;
}): string {
  const { selections, personal, guidelines } = input;
  const included = includedSelections(selections).filter(isTopicSelectionReady);
  const length = adaptiveLengthTarget(included.length);

  const allCfrs = included.flatMap((sel) => getKeyTopic(sel.topicId)?.cfrs || []);
  const legalCites = Array.from(new Set(allCfrs.filter(isLegalCite))).map(
    formatCiteForPrompt
  );
  const topicKeywords = Array.from(
    new Set(allCfrs.filter((c) => !isLegalCite(c)))
  );

  const closingSeed = [
    included.map((s) => `${s.topicId}:${s.polarity}:${s.angles.join('|')}`).join(';'),
    personal.impact.trim().slice(0, 120),
    personal.i_526e_file_date,
    personal.country,
    personal.investor_type,
  ].join('||');
  const closingStyle = pickClosingStyle(closingSeed);

  const issueBlocks = included.map((sel, idx) => {
    const topic = getKeyTopic(sel.topicId);
    if (!topic || !sel.polarity) {
      return `Issue ${idx + 1}: (missing topic data)`;
    }
    const stance = stancesByPolarity(topic, sel.polarity)[0];
    const cites = topic.cfrs.filter(isLegalCite).map(formatCiteForPrompt);
    const lines = [
      `Issue ${idx + 1}: ${topic.title}`,
      `Federal Register section (for my reference only; do not use as a section header in the comment): ${topic.frSectionLabel}`,
      `Cites for this issue: ${cites.join('; ') || '(none listed)'}`,
      `My polarity: ${polarityLabel(sel.polarity)}`,
      stance ? `Stance frame: ${stance.label}` : null,
      'Background for you (this is your source of truth; do not copy verbatim; do not rely on URLs):',
      `- Overview: ${topic.summary.overview}`,
      topic.summary.current
        ? `- Today: ${topic.summary.current}`
        : null,
      topic.summary.proposed
        ? `- Proposed: ${topic.summary.proposed}`
        : null,
      'Must-include points (ideas only — paraphrase in my voice; do not copy 4+ consecutive words from these lines or the Background):',
      ...(sel.angles.length
        ? sel.angles.map((a, i) => `  ${i + 1}. ${a}`)
        : ['  (none selected; rely on my additional points below)']),
      'Prefer one concrete ask for this issue tied to one fact from my situation, rather than packing every angle into a laundry list.',
      sel.extraNote.trim()
        ? `My additional points for this issue:\n${sel.extraNote.trim()}`
        : 'My additional points for this issue: (none)',
    ];
    return lines.filter((x) => x != null).join('\n');
  });

  const projectLabel = personal.project_type
    ? PROJECT_TYPE_LABELS[personal.project_type]
    : '(project type)';

  const personalLines = [
    `I-526E file / plan date: ${personal.i_526e_file_date || '(not provided)'}`,
    `Investor type: ${investorTypeLabel(personal.investor_type)}`,
    `Country chargeability: ${personal.country || '(not provided)'}`,
    `Project type: ${projectLabel}`,
    `Personal story (required color for uniqueness; do not invent beyond this):`,
    personal.impact.trim() ||
      `(not provided — write a distinct comment without inventing autobiography; leave clear placeholders if a fact is missing)`,
    personal.include_timeline_note !== false
      ? `Also mention (idea only — paraphrase; do not copy 4+ consecutive words):\n${TIMELINE_NOTE_PROMPT}`
      : null,
  ].filter((line): line is string => line != null);

  return [
    'You are helping me draft a public comment on a U.S. DHS/USCIS Notice of Proposed Rulemaking (NPRM) for the EB-5 program.',
    'I will paste your draft onto regulations.gov myself. Write in first person as me.',
    '',
    'Hard rules:',
    '- Use only facts I provide below. Do not invent filing dates, amounts, family details, project names, regional-center names, or legal conclusions I did not state.',
    '- You may fix grammar and spelling in My Personal Story and My Additional Points, but do not add new facts, dates, emotions, or events.',
    '- Do not include A-number, receipt number, SSN, passport number, home address, bank details, school name, employer name, job title at a named employer, or a child\'s full name.',
    '- Do not name specific people, law firms, projects, or regional centers. Say "this investor," "my regional center," or "the project" instead.',
    '- Do not copy sample comments or produce a form letter. Paraphrase the must-include points in my voice; never copy 4 or more consecutive words from Background or Must-include lines.',
    '- Do not start with a stock opener like "As an EB-5 investor..." or "I am a post-RIA investor..." If My Personal Story is provided, open from those facts (timeline, fear, family impact), not a category label. Vary the opening, sentence length, and transitions so this does not read as a form letter.',
    '- Treat the Background summaries below as your source of truth. The Federal Register links are for my reference; do not browse them and do not invent text from them.',
    '- Cite only the CFR / INA references listed under each issue (or in the pool below). For 8 CFR cites from this NPRM, write them as "proposed 8 CFR …" (they are not final yet). Statutory INA cites do not need "proposed".',
    '- When making concrete asks, vary the request verbs within this draft (for example: "I urge", "Please clarify", "DHS should", "My request is"). Do not start every section with the same opener. Do not default to "I ask DHS/USCIS to..." and do not reuse one request phrase across sections.',
    '- Prefer concrete asks (what to keep, clarify, or change) over vague opposition.',
    '',
    `Docket / document: ${DOCUMENT_ID} (USCIS-2026-0100)`,
    `Federal Register HTML (my reference only): ${FR_HTML}`,
    `Federal Register PDF (my reference only): ${FR_PDF}`,
    `CFR / INA pool for this comment: ${legalCites.join('; ') || '(from selected issues)'}`,
    topicKeywords.length
      ? `Topic keywords (do not cite as law): ${topicKeywords.join('; ')}`
      : null,
    '',
    'My situation:',
    ...personalLines,
    '',
    `Issues to cover (${included.length} of max 3):`,
    issueBlocks.length ? issueBlocks.join('\n\n') : '(no issues fully selected)',
    '',
    'Output requirements:',
    `- Target length: ${length.label} (${length.detail}). Prefer covering every must-include point over hitting an exact count.`,
    `- Voice: ${styleLabel(guidelines.style)}.`,
    '- Write mainly in short paragraphs. Use bullets only when listing concrete asks to DHS/USCIS; do not make the whole comment a bullet list.',
    '- Open with 1-3 sentences grounded in my situation (if provided).',
    '- One clear section per issue above, in the same order.',
    '- Do not use Federal Register outline titles as section headers (for example do not write "Duration of Investment" or "IV.D.6"). Use plain investor-voice headings, or no headings.',
    '- In each section: short accurate context, then my asks/points, then what I want DHS to do.',
    `- Closing for this draft only: ${closingStyle}`,
    '- Do not end with the stock closer "I respectfully ask DHS/USCIS to consider these comments in the final rule" (or close variants of that sentence).',
    '- Output only the comment body itself. Do not mention word limits, character limits, prompt instructions, or that you are an AI. Do not include chat meta such as "Here is a tighter version", "I assume you mean", a subject line, email headers, "Here is your comment:", markdown headers (#), or code fences. regulations.gov is plain text.',
    '',
    'Before finishing, verify: (1) you used only my facts, (2) you covered every must-include point in paraphrase, (3) you did not invent project, firm, or regional-center names, (4) you cited only references from my lists (with "proposed" on 8 CFR NPRM cites), and (5) request verbs and the closing follow the rules above. If anything is missing, add it before you stop.',
  ]
    .filter((line) => line != null)
    .join('\n');
}

export function buildPersonalOnly(personal: PersonalBlock): string {
  const projectLabel = personal.project_type
    ? PROJECT_TYPE_LABELS[personal.project_type]
    : '';
  const investor =
    personal.investor_type === 'pre_ria'
      ? 'Pre-RIA'
      : personal.investor_type === 'post_ria'
        ? 'Post-RIA'
        : personal.investor_type === 'future'
          ? 'Future filer'
          : personal.investor_type === 'family'
            ? 'Family'
            : '';
  return [
    `I-526E filed: ${personal.i_526e_file_date}`,
    investor ? `Investor type: ${investor}` : '',
    personal.country ? `Country chargeability: ${personal.country}` : '',
    `Project type: ${projectLabel}`,
    `Impact: ${personal.impact}`,
  ]
    .filter(Boolean)
    .join('\n');
}

/** Minimum personal story length for copy (review: 100 chars). */
export const MIN_IMPACT_CHARS = 600;

/**
 * Word-overlap similarity of user impact vs a generic template.
 * Returns 0..1 where 1 = identical bag of words.
 */
export function templateSimilarity(impact: string): number {
  const template =
    'my i-526e filed still waiting capital repaid but forced to redeploy to project i did not choose please finalize the two year sustainment rule as proposed';
  const tokenize = (s: string) =>
    new Set(
      s
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter((w) => w.length > 2)
    );
  const a = tokenize(impact);
  const b = tokenize(template);
  if (a.size === 0) return 1;
  let overlap = 0;
  Array.from(a).forEach((w) => {
    if (b.has(w)) overlap += 1;
  });
  return overlap / Math.max(a.size, 1);
}

/** True when user has edited enough that form-letter risk is low. */
export function isPersonalizedEnough(impact: string): boolean {
  if (impact.trim().length < MIN_IMPACT_CHARS) return false;
  return templateSimilarity(impact) <= 0.7;
}

/** Personal fields are optional. Callers gate copy on themes + privacy. */
export function canCopyPrompt(_personal?: PersonalBlock): boolean {
  void _personal;
  return true;
}

import { KEY_TOPICS, getKeyTopic, stancesByPolarity } from './keyTopics';
import type {
  KeyTopicPolarity,
  PersonalBlock,
  PromptGuidelines,
  ProjectTypeOption,
  TopicCommentSelection,
} from './types';
import { DOCUMENT_ID, FR_HTML, FR_PDF } from './utils';

const PROJECT_TYPE_LABELS: Record<ProjectTypeOption, string> = {
  rural: 'rural',
  tea_hua: 'TEA high-unemployment',
  infrastructure: 'infrastructure',
  mixed: 'mixed',
};

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
  const legalCites = Array.from(new Set(allCfrs.filter(isLegalCite)));
  const topicKeywords = Array.from(
    new Set(allCfrs.filter((c) => !isLegalCite(c)))
  );

  const issueBlocks = included.map((sel, idx) => {
    const topic = getKeyTopic(sel.topicId);
    if (!topic || !sel.polarity) {
      return `Issue ${idx + 1}: (missing topic data)`;
    }
    const stance = stancesByPolarity(topic, sel.polarity)[0];
    const cites = topic.cfrs.filter(isLegalCite);
    const lines = [
      `Issue ${idx + 1}: ${topic.title}`,
      `Federal Register section (for my reference; do not browse): ${topic.frSectionLabel}`,
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
      'Must-include points (paraphrase in my voice; cover each):',
      ...(sel.angles.length
        ? sel.angles.map((a, i) => `  ${i + 1}. ${a}`)
        : ['  (none selected; rely on my additional points below)']),
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
  ];

  return [
    'You are helping me draft a public comment on a U.S. DHS/USCIS Notice of Proposed Rulemaking (NPRM) for the EB-5 program.',
    'I will paste your draft onto regulations.gov myself. Write in first person as me.',
    '',
    'Hard rules:',
    '- Use only facts I provide below. Do not invent filing dates, amounts, family details, project names, regional-center names, or legal conclusions I did not state.',
    '- You may fix grammar and spelling in My Personal Story and My Additional Points, but do not add new facts, dates, emotions, or events.',
    '- Do not include A-number, receipt number, SSN, passport number, home address, bank details, school name, employer name, job title at a named employer, or a child\'s full name.',
    '- Do not name specific people, law firms, projects, or regional centers. Say "this investor," "my regional center," or "the project" instead.',
    '- Do not copy sample comments or produce a form letter. Paraphrase the must-include points in my voice.',
    '- Do not start with a stock opener like "As an EB-5 investor..." Vary the opening, sentence length, and transitions so this does not read as a form letter.',
    '- Treat the Background summaries below as your source of truth. The Federal Register links are for my reference; do not browse them and do not invent text from them.',
    '- Cite only the CFR / INA references listed under each issue (or in the pool below). Prefer starting concrete asks with "I ask DHS/USCIS to..." and include one cite in that same paragraph when it fits naturally.',
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
    '- In each section: short accurate context, then my asks/points, then what I want DHS to do.',
    '- Close with a brief respectful request that DHS consider these comments in the final rule.',
    '- Output only the comment itself. Do not mention word limits, prompt instructions, or that you are an AI. Do not include a subject line, email headers, "Here is your comment:", markdown headers (#), or code fences. regulations.gov is plain text.',
    '',
    'Before finishing, verify: (1) you used only my facts, (2) you covered every must-include point, (3) you did not invent project, firm, or regional-center names, and (4) you cited only references from my lists. If anything is missing, add it before you stop.',
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

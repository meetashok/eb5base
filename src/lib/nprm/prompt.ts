import type {
  NprmPromptNode,
  NprmTheme,
  PersonalBlock,
  PromptGuidelines,
  ProjectTypeOption,
} from './types';
import { commentUrl } from './utils';

/**
 * Prompt diversity math (~60k+ deterministic before personal story):
 *
 * - 6 themes × ~2.5 opinions avg ≈ 15 theme×opinion pairs
 * - × 3 phrasing variants (prompt-tree phrasing_idx 0..2) ≈ 30-45 base nodes
 *   (feed currently ships 30 nodes)
 * - × 8 guideline combos (2 length × 2 style × 2 format) ≈ 240 single-theme
 * - Multi-theme (max 3): C(6,1)+C(6,2)+C(6,3) theme sets, with opinion picks
 *   ≈ 120 single + ~750 pairs + ~2,500 triples ≈ ~3.3k structural combos
 * - × ~6 context-sample rotations (which sample_id / fragment context leads)
 *   ≈ ~20k-60k deterministic prompt skeletons before the personal block
 * - Personal block (file date + project type + free-text impact) → near-infinite
 *
 * We ship fragments + a prompt, never a canned form letter. Final wording
 * happens on the user's own LLM so USCIS/OIRA cannot bucket identical paste.
 */
export const PROMPT_DIVERSITY_NOTE =
  '6 themes × ~2.5 opinions × 3 phrasings × 8 guideline combos × ~6 sample rotations ≈ 60k+ deterministic skeletons; personal block makes each comment distinct.';

const PROJECT_TYPE_LABELS: Record<ProjectTypeOption, string> = {
  rural: 'rural',
  tea_hua: 'TEA high-unemployment',
  infrastructure: 'infrastructure',
  mixed: 'mixed',
};

export function pickPromptNode(
  tree: NprmPromptNode[],
  themeId: string,
  opinionId: string,
  rotationSeed = 0
): NprmPromptNode | undefined {
  const matches = tree.filter(
    (n) => n.theme_id === themeId && n.opinion_id === opinionId
  );
  if (matches.length === 0) return undefined;
  return matches[Math.abs(rotationSeed) % matches.length];
}

export function buildPrompt(input: {
  themes: NprmTheme[];
  promptTree: NprmPromptNode[];
  selectedThemeIds: string[];
  opinionsByTheme: Record<string, string>;
  personal: PersonalBlock;
  guidelines: PromptGuidelines;
  /** Stable seed for phrasing/sample rotation - e.g. impact length. */
  rotationSeed?: number;
}): string {
  const {
    themes,
    promptTree,
    selectedThemeIds,
    opinionsByTheme,
    personal,
    guidelines,
    rotationSeed = 0,
  } = input;

  const selected = themes.filter((t) => selectedThemeIds.includes(t.id));
  const cfrs = Array.from(new Set(selected.flatMap((t) => t.cfrs)));
  const sampleIds = Array.from(
    new Set(selected.flatMap((t) => t.sample_ids))
  );

  const stanceLines: string[] = [];
  const contextBlocks: string[] = [];

  selected.forEach((theme, idx) => {
    const opinionId = opinionsByTheme[theme.id];
    const opinion = theme.opinions.find((o) => o.id === opinionId);
    const node = opinionId
      ? pickPromptNode(promptTree, theme.id, opinionId, rotationSeed + idx)
      : undefined;

    if (opinion) {
      stanceLines.push(
        `- ${theme.id}: ${opinion.label}: ${opinion.stance}`
      );
    }

    const sample =
      sampleIds[(rotationSeed + idx) % Math.max(sampleIds.length, 1)] ||
      theme.sample_ids[0];
    const fragment =
      node?.prompt_fragment ||
      opinion?.fragments?.[rotationSeed % Math.max(opinion?.fragments?.length || 1, 1)] ||
      theme.summary;

    contextBlocks.push(
      [
        `Theme: ${theme.title}`,
        sample
          ? `Source: ${sample} ${commentUrl(sample)}`
          : 'Source: (see theme sample IDs)',
        `Summary: ${theme.summary}`,
        fragment ? `Context fragment: ${fragment}` : null,
      ]
        .filter(Boolean)
        .join('\n')
    );
  });

  const lengthLabel =
    guidelines.length === '150' ? 'about 150 words' : '300-450 words';
  const styleLabel =
    guidelines.style === 'plain' ? 'plain English' : 'formal regulatory';
  const formatLabel =
    guidelines.format === 'bullets' ? 'bullets' : 'paragraphs';

  const projectLabel = personal.project_type
    ? PROJECT_TYPE_LABELS[personal.project_type]
    : '(project type)';

  return [
    '[Docket USCIS-2026-0100]',
    `CFR: ${cfrs.join('; ') || '(select a theme)'}`,
    '',
    'Context:',
    contextBlocks.join('\n\n') || '(select one or more themes)',
    '',
    'Stance:',
    stanceLines.length ? stanceLines.join('\n') : '(pick an opinion per theme)',
    '',
    `Filed: ${personal.i_526e_file_date || '(I-526E file month/year)'}`,
    `Type: ${projectLabel}`,
    `Impact: ${personal.impact || '(personal impact - at least 40 characters)'}`,
    '',
    `Guidelines: ${styleLabel}, ${lengthLabel}, ${formatLabel}`,
    '',
    'Instructions: Draft a distinct comment in my own voice using the personal block above. Cite CFR. Keep it specific to my filing and project type. Do not invent facts I did not provide. Do not copy any sample comment verbatim.',
  ].join('\n');
}

export function buildPersonalOnly(personal: PersonalBlock): string {
  const projectLabel = personal.project_type
    ? PROJECT_TYPE_LABELS[personal.project_type]
    : '';
  return [
    `I-526E filed: ${personal.i_526e_file_date}`,
    `Project type: ${projectLabel}`,
    `Impact: ${personal.impact}`,
  ].join('\n');
}

export function canCopyPrompt(personal: PersonalBlock): boolean {
  return (
    personal.i_526e_file_date.trim().length > 0 &&
    personal.project_type !== '' &&
    personal.impact.trim().length >= 40
  );
}

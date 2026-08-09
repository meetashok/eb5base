export interface NprmStats {
  docket_id: string;
  total_comments: number;
  last_pull: string;
  comment_period_ends: string;
  source: string;
  check_log?: string;
}

export interface NprmOpinion {
  id: string;
  label: string;
  stance: string;
  fragments: string[];
}

export interface NprmTheme {
  id: string;
  title: string;
  cfrs: string[];
  summary: string;
  sample_ids: string[];
  opinions: NprmOpinion[];
}

export interface NprmPromptNode {
  theme_id: string;
  opinion_id: string;
  phrasing_idx: number;
  label: string;
  cfrs: string[];
  sample_ids: string[];
  prompt_fragment: string;
  personal_placeholders: string[];
  guideline_options: string[];
}

export interface NprmCommentAttributes {
  agencyId?: string;
  objectId?: string;
  documentType?: string;
  withdrawn?: boolean;
  highlightedContent?: string;
  postedDate?: string;
  lastModifiedDate?: string;
  title?: string;
  /** Optional full original text when enrichment exists */
  originalText?: string;
  /** Optional AI summary when enrichment exists (legacy nested shape) */
  aiSummary?: string;
}

/**
 * Normalized comment. Hatch may publish either regs.gov nested `attributes`
 * or a flat id+link+theme+ai_summary row; fetch normalizes both.
 */
export interface NprmComment {
  id: string;
  type?: string;
  attributes: NprmCommentAttributes;
  /** Theme assignment from feed (separate from AI summary). */
  themeId?: string;
  themeTitle?: string;
  /** Per-comment AI summary from feed (separate from theme). */
  aiSummary?: string;
  sourceLink?: string;
}

/** Raw flat row published by Hatch (id_link_theme_summary_only). */
export interface NprmFlatComment {
  id: string;
  type?: string;
  title?: string;
  postedDate?: string;
  source_link?: string;
  theme_id?: string;
  theme_title?: string;
  ai_summary?: string;
  comment?: string;
  attributes?: NprmCommentAttributes;
}

export interface NprmCommentsEnvelope {
  retrieved?: string;
  total: number;
  docket_id?: string;
  source?: string;
  mode?: string;
  comments: Array<NprmComment | NprmFlatComment>;
}

export interface NprmLastCheck {
  retrieved?: string;
  total?: number;
  docket_id?: string;
  source?: string;
  metadata?: {
    docket_id: string;
    document_id: string;
    document_title: string;
    document_type?: string;
    agency?: string;
    posted_date?: string;
    comment_period_ends?: string;
    total_comments?: number;
    federal_register_citation?: string;
    rin?: string;
    dhs_docket_no?: string;
    data_retrieved?: string;
  };
  comments: Array<NprmComment | NprmFlatComment>;
}

export interface NprmFeedIndex {
  base_url_note?: string;
  docket?: string;
  feed?: string;
  files?: Array<{ name: string; path: string; description?: string }>;
  last_updated?: string;
  total_comments?: number;
  usage_hint?: string;
}

/** Plain-language NPRM explainer from Hatch proposal_summary.json */
export interface NprmProposalShortSummary {
  title: string;
  text: string;
  citations: string[];
}

export interface NprmProposalThemeSummary {
  theme_id: string;
  title: string;
  plain_text: string;
  uscis_phrasing: string;
  citation: string;
  source_link: string;
}

export interface NprmProposalSummary {
  docket_id: string;
  source_document: string;
  source_url: string;
  retrieved: string;
  comment_deadline: string;
  plain_language_note: string;
  short_summary: NprmProposalShortSummary;
  long_summary_by_theme: NprmProposalThemeSummary[];
}

export type ProjectTypeOption = 'rural' | 'tea_hua' | 'infrastructure' | 'mixed';

export type LengthGuideline = '150' | '300_450';
export type StyleGuideline = 'plain' | 'formal';
export type FormatGuideline = 'paragraphs' | 'bullets';

export interface PersonalBlock {
  i_526e_file_date: string;
  project_type: ProjectTypeOption | '';
  impact: string;
}

export interface PromptGuidelines {
  length: LengthGuideline;
  style: StyleGuideline;
  format: FormatGuideline;
}

export interface NprmPageData {
  stats: NprmStats;
  themes: NprmTheme[];
  promptTree: NprmPromptNode[];
  comments: NprmComment[];
  proposal: NprmProposalSummary | null;
  lastCheck: NprmLastCheck | null;
  checkLog: string;
  feedSource: 'remote' | 'local';
  feedBaseUsed: string;
}

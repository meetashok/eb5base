/** Heuristic EB5 Base Write-tab fingerprint (not a regs.gov source tag). */
export type Eb5BaseLikelihood = 'likely' | 'possible' | 'unlikely';
export type Eb5BaseConfidence = 'high' | 'medium' | 'low';

export interface Eb5BaseAttributionCounts {
  likely: number;
  possible: number;
  unlikely: number;
}

export interface NprmStats {
  docket_id: string;
  total_comments: number;
  last_pull: string;
  comment_period_ends: string;
  source: string;
  check_log?: string;
  eb5base_attribution_version?: number;
  eb5base_attribution?: Eb5BaseAttributionCounts;
  eb5base_attribution_note?: string;
}

export type KeyTopicPolarity = 'agree' | 'disagree';

export interface NprmOpinion {
  id: string;
  label: string;
  stance: string;
  fragments: string[];
  /** Agree / disagree with the draft (first-party key topics). */
  polarity?: KeyTopicPolarity;
}

export interface NprmTheme {
  id: string;
  title: string;
  cfrs: string[];
  summary: string;
  sample_ids: string[];
  opinions: NprmOpinion[];
}

/** Shared Overview → Summary → Write topic (first-party). */
export interface KeyTopicStance {
  id: string;
  polarity: KeyTopicPolarity;
  /** Short Write radio label. */
  label: string;
  /** Overview bullets; also used as prompt fragments. */
  angles: string[];
  /** Summary: reasons this ask can make sense. */
  pros: string[];
  /** Summary: costs, integrity, or US-interest counterpoints. */
  cons: string[];
}

export interface KeyTopicInlineLink {
  phrase: string;
  href: string;
  title?: string;
}

export interface KeyTopic {
  id: string;
  title: string;
  /** Compact label for Summary jump nav / mobile chips. */
  shortTitle: string;
  body: string;
  frHeadingId: string;
  frSectionLabel: string;
  cfrs: string[];
  inlineLinks?: KeyTopicInlineLink[];
  summary: {
    overview: string;
    current?: string;
    proposed?: string;
  };
  stances: KeyTopicStance[];
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

/** Heuristic EB5 Base Write-tab fingerprint (not a regs.gov source tag). */
export type Eb5BaseLikelihood = 'likely' | 'possible' | 'unlikely';
export type Eb5BaseConfidence = 'high' | 'medium' | 'low';

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
  /** UI-safe poster class; never a real person/org name. */
  posterType?: 'anonymous' | 'named' | 'org';
  /** UI-safe label: Anonymous / Named person / Organization. */
  posterLabel?: string;
  /** Heuristic: likely drafted via EB5 Base Write tab. */
  eb5baseLikelihood?: Eb5BaseLikelihood;
  eb5baseConfidence?: Eb5BaseConfidence;
  eb5baseSignals?: string[];
  eb5baseAntiSignals?: string[];
  eb5baseAttributionVersion?: number;
}

/** Raw flat comment row in public/data/nprm/all_comments.json. */
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
  poster_type?: 'anonymous' | 'named' | 'org';
  poster_label?: string;
  eb5base_likelihood?: Eb5BaseLikelihood;
  eb5base_confidence?: Eb5BaseConfidence;
  eb5base_signals?: string[];
  eb5base_anti_signals?: string[];
  eb5base_attribution_version?: number;
  attributes?: NprmCommentAttributes;
}

export interface NprmCommentsEnvelope {
  retrieved?: string;
  total: number;
  docket_id?: string;
  source?: string;
  mode?: string;
  eb5base_attribution_version?: number;
  eb5base_attribution?: Eb5BaseAttributionCounts;
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

/** Feed may publish short_summary as a string or as { text, citations, title }. */
export type NprmProposalShortSummaryRaw =
  | string
  | NprmProposalShortSummary
  | { text?: string; citations?: string[]; title?: string };

export interface NprmProposalThemeSummary {
  theme_id: string;
  title: string;
  plain_text: string;
  uscis_phrasing?: string;
  citation: string;
  source_link: string;
}

export interface NprmProposalWhyReason {
  id: string;
  title: string;
  text: string;
  citations?: string[];
  plain?: boolean;
}

export interface NprmProposalWhyComment {
  title: string;
  deadline?: string;
  intro: string;
  citations_intro?: string[];
  reasons: NprmProposalWhyReason[];
  how_it_works?: string;
  what_to_include?: string[];
  note?: string;
}

export interface NprmProposalSummary {
  docket_id: string;
  source_document: string;
  source_url: string;
  retrieved: string;
  comment_deadline: string;
  plain_language_note: string;
  short_summary: NprmProposalShortSummaryRaw;
  long_summary_by_theme: NprmProposalThemeSummary[];
  why_comment?: NprmProposalWhyComment;
  why_participate?: NprmProposalWhyComment;
}

export type ProjectTypeOption = 'rural' | 'tea_hua' | 'infrastructure' | 'mixed';

export type StyleGuideline = 'plain' | 'formal';

export interface PersonalBlock {
  i_526e_file_date: string;
  project_type: ProjectTypeOption | '';
  impact: string;
  investor_type?: '' | 'pre_ria' | 'post_ria' | 'future' | 'family';
  country?: string;
}

export interface PromptGuidelines {
  style: StyleGuideline;
}

/**
 * Write-tab decision for one key topic:
 * include → polarity → selected angles → optional extra note.
 */
export interface TopicCommentSelection {
  topicId: string;
  include: boolean;
  polarity: KeyTopicPolarity | null;
  /** Angle strings selected under the chosen polarity. */
  angles: string[];
  /** Free-text points the commenter also wants covered for this topic. */
  extraNote: string;
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

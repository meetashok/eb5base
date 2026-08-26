export const NPRM_DISCLAIMER_PARAS = [
  'This page is not legal advice. Nothing here is immigration, securities, or investment advice. Please do not treat anything on this page as advice for your case.',
  'eb5base.com is not affiliated with USCIS, any regional center, or any government agency. eb5base.com/nprm is an information site only. It does not submit comments for you.',
  'You are responsible for any comment you file on regulations.gov. Review your draft carefully, and consider speaking with your immigration counsel before you submit.',
  'This tool is offered in a personal capacity for educational use. It is not funded or directed by a foreign principal, regional center, or government agency.',
] as const;

/** @deprecated prefer NPRM_DISCLAIMER_PARAS */
export const NPRM_DISCLAIMER = NPRM_DISCLAIMER_PARAS.join(' ');

export const APA_CITATION =
  'shall give interested persons an opportunity to participate in the rule making through submission of written data, views, or arguments...';

export const APA_LINK =
  'https://lib.law.uw.edu/c.php?g=1239468&p=9071075';

export const ILRC_CITATION =
  'Any member of the public is allowed to submit a comment during the open comment period. You do not need specialized training and you are able to submit your comment anonymously.';

export const ILRC_LINK =
  'https://www.ilrc.org/community-resources/how-submit-comment-federal-regulations';

/** Evidence that public comments change final rules (for Why Comment). */
export const COMMENT_IMPACT_SOURCES = [
  {
    id: 'gao',
    label: 'GAO',
    title: 'GAO-20-383R: agencies report comments changing final rules',
    url: 'https://www.gao.gov/assets/gao-20-383r.pdf',
  },
  {
    id: 'fr-process',
    label: 'FR primer',
    title: 'Office of the Federal Register: The Rulemaking Process',
    url: 'https://uploads.federalregister.gov/uploads/2013/09/The-Rulemaking-Process.pdf',
  },
  {
    id: 'eb5-2019',
    label: '2019 EB-5 final rule',
    title: 'EB-5 Immigrant Investor Program Modernization final rule (84 FR 35750)',
    url: 'https://www.govinfo.gov/content/pkg/FR-2019-07-24/pdf/2019-15000.pdf',
  },
] as const;

export const DISTINCTNESS_WARNING =
  'If 500 people paste the same paragraph, USCIS counts it as 1. Your personal story makes it distinct. GAO notes that mass mailing campaigns can yield thousands of duplicate comments that agencies may post individually, as attachments, or as a count. OIRA tooling has distilled about 300k comments down to about 30k distinct ones.';

/** After the LLM draft: what to do before filing on regulations.gov. */
export const UNIQUE_AFTER_LLM_CHECKLIST = [
  'Aim for more than 30% rewrite of the AI draft before you file.',
  'Rewrite the opening and closing yourself.',
  'Cut any repetitive phrases that still show up (for example the same ask opener in every section).',
  'Never paste chat preamble into regulations.gov (no “Here is a tighter version…”, no word or character-limit talk).',
] as const;

/** @deprecated use UNIQUE_AFTER_LLM_CHECKLIST */
export const UNIQUE_COMMENT_CHECKLIST = UNIQUE_AFTER_LLM_CHECKLIST;

export const PROJECT_TYPE_OPTIONS = [
  { value: 'rural', label: 'Rural' },
  { value: 'tea_hua', label: 'TEA high-unemployment' },
  { value: 'infrastructure', label: 'Infrastructure' },
  { value: 'mixed', label: 'Mixed' },
] as const;

/** Step B checkbox: idea-only processing / reserved-visa ask (paraphrase, do not copy). */
export const TIMELINE_NOTE_PROMPT =
  'Processing timelines (idea only — paraphrase; do not invent how long I have waited unless I stated it in My Personal Story): I-526 and I-526E processing has been unreliable and not in a predictable order, and wait times have grown. Reserved rural, high-unemployment, and infrastructure visa numbers can go unused when too few petitions become visa-ready. Ask DHS/USCIS for more predictable I-526E processing and to use reserved-category visas instead of leaving them unused.';

import nprmConfig from '@/config/nprm.json';

export const NPRM_CONFIG = nprmConfig;

export const DOCKET_ID = nprmConfig.docketId;
export const DOCUMENT_ID = nprmConfig.documentId;
export const FR_CITATION = nprmConfig.frCitation;
export const RIN = nprmConfig.rin;
export const FR_HTML = nprmConfig.federalRegisterHtml;
export const FR_PDF = nprmConfig.federalRegisterPdf;
export const COMMENT_ON_URL = nprmConfig.regulationsGovComment;
export const DOCKET_URL = nprmConfig.regulationsGovDocket;
export const DOCUMENT_URL = nprmConfig.regulationsGovDocument;
export const NPRM_LAST_UPDATED = nprmConfig.lastUpdated;
export const COMMENT_PERIOD_END = new Date(nprmConfig.deadlineIso);

/** Federal how-to-comment guidance (personal experience strengthens comments). */
export const COMMENT_GUIDANCE = [
  {
    id: 'hhs',
    label: 'HHS',
    title: 'HHS: how to comment on open rules',
    url: 'https://www.hhs.gov/regulations/comment-on-open-rules/index.html',
  },
  {
    id: 'epa',
    label: 'EPA',
    title: 'EPA tips for effective public comment',
    url: 'https://www.epa.gov/system/files/documents/2024-10/eng-pr-so2-ffa-sip-public-comment-fact-sheet.pdf',
  },
  {
    id: 'tips',
    label: 'Tips PDF',
    title: 'Tips for submitting effective comments (federal guidance)',
    // Served locally: USDA/regulations.gov hosts for this public-domain PDF are
    // intermittently blocked or 404 for many visitors.
    url: '/docs/tips-for-submitting-effective-comments.pdf',
  },
] as const;

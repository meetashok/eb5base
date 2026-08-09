import type { Metadata } from 'next';
import { isNprmTabId, type NprmTabId } from '@/lib/nprm/tabs';

const TAB_META: Record<
  NprmTabId,
  { title: string; description: string }
> = {
  overview: {
    title: 'NPRM Explainer - EB-5 Proposed Rule July 2026',
    description:
      'Plain-English overview of USCIS Docket USCIS-2026-0100 (91 FR 40676). What the July 2026 EB-5 NPRM covers and how to verify it in the Federal Register.',
  },
  themes: {
    title: 'NPRM Themes - What investors are debating',
    description:
      'Theme-by-theme views of the EB-5 Reform Act NPRM: grandfathering, sustainment, bridge financing, TEA, and program integrity.',
  },
  comments: {
    title: 'NPRM Comments (48) - Themes & Summaries',
    description:
      'Browse AI summaries of comments filed on Docket USCIS-2026-0100. Verify each filing on regulations.gov. Information only.',
  },
  write: {
    title: 'Write an NPRM comment',
    description:
      'Prompt builder to draft a distinct personal comment on the July 2026 EB-5 NPRM for filing on regulations.gov.',
  },
  about: {
    title: 'About the NPRM Comment Guide',
    description:
      'Sources, disclaimer, and how EB5 Base summarizes the EB-5 proposed rule and public comments.',
  },
};

export function nprmMetadata(tab: NprmTabId): Metadata {
  const meta = TAB_META[tab];
  return {
    title: meta.title,
    description: meta.description,
    openGraph: {
      title: `${meta.title} | EB5 Base`,
      description: meta.description,
      url: tab === 'overview' ? 'https://eb5base.com/nprm' : `https://eb5base.com/nprm/${tab}`,
    },
  };
}

export function metadataForNprmTabParam(tab: string): Metadata {
  if (!isNprmTabId(tab) || tab === 'overview') {
    return nprmMetadata('overview');
  }
  return nprmMetadata(tab);
}

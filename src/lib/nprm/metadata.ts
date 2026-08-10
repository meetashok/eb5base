import type { Metadata } from 'next';
import { isNprmTabId, type NprmTabId } from '@/lib/nprm/tabs';

const TAB_META: Record<
  NprmTabId,
  { title: string; description: string }
> = {
  overview: {
    title: 'EB-5 NPRM 2026: Plain-English Guide to DHS Proposed Rule',
    description:
      'DHS published a 358-page proposed rule on July 2, 2026 to implement the 2022 RIA. Comment deadline Aug 31, 2026. Plain-English summary, impact by investor type, and comment builder.',
  },
  summary: {
    title: 'EB-5 NPRM Summary - Current vs Proposed',
    description:
      'Section-by-section plain-English notes on investment amounts, TEA, sustainment, good-faith protections, sanctions, and more. Cite the Federal Register.',
  },
  themes: {
    title: 'NPRM Comment Themes That Move the Needle',
    description:
      'Theme-by-theme guidance for commenting on the EB-5 Reform Act NPRM: sustainment, good faith, TEA, sanctions, and more.',
  },
  comments: {
    title: 'NPRM Comments (48) - Themes & Summaries',
    description:
      'Browse AI summaries of comments filed on Docket USCIS-2026-0100. Verify each filing on regulations.gov. Information only.',
  },
  write: {
    title: 'Build My EB-5 NPRM Comment',
    description:
      'Personalize a draft comment on the July 2026 EB-5 NPRM. EB5 Base does not submit for you. File on regulations.gov.',
  },
  about: {
    title: 'About the NPRM Comment Guide',
    description:
      'Sources, disclaimer, and how EB5 Base summarizes the EB-5 proposed rule and public comments.',
  },
};

export function nprmMetadata(tab: NprmTabId): Metadata {
  const meta = TAB_META[tab];
  const url =
    tab === 'overview' ? 'https://eb5base.com/nprm' : `https://eb5base.com/nprm/${tab}`;
  return {
    title: meta.title,
    description: meta.description,
    alternates: { canonical: url },
    openGraph: {
      title: `${meta.title} | EB5 Base`,
      description: meta.description,
      url,
      siteName: 'EB5 Base',
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${meta.title} | EB5 Base`,
      description: meta.description,
    },
  };
}

export function metadataForNprmTabParam(tab: string): Metadata {
  if (!isNprmTabId(tab) || tab === 'overview') {
    return nprmMetadata('overview');
  }
  return nprmMetadata(tab);
}

import type { Metadata } from 'next';
import { isNprmTabId, type NprmTabId } from '@/lib/nprm/tabs';

/**
 * Keep base titles short: root layout appends " | EB5 Base" (~11 chars).
 * Target rendered document title under 60 characters.
 */
const TAB_META: Record<
  NprmTabId,
  { title: string; description: string }
> = {
  overview: {
    title: 'EB-5 NPRM 2026 Plain English Guide',
    description:
      'DHS draft rule July 2 2026 to apply the 2022 RIA. Comments close Aug 31 2026. What investors should know, with links to official dockets.',
  },
  summary: {
    title: 'EB-5 NPRM Summary in Plain English',
    description:
      'Section-by-section notes on investment amounts, TEA, sustainment, good-faith protections, and sanctions. Cite the Federal Register.',
  },
  themes: {
    title: 'NPRM Comment Themes That Matter',
    description:
      'Theme-by-theme guidance for commenting on the EB-5 Reform Act NPRM: sustainment, good faith, TEA, sanctions, and more.',
  },
  comments: {
    title: 'NPRM Comments: Themes and Summaries',
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
      title: meta.title,
      description: meta.description,
      url,
      siteName: 'EB5 Base',
      type: 'article',
      images: [{ url: '/opengraph-image', width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title: meta.title,
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

export function nprmDocumentTitle(tab: NprmTabId): string {
  return TAB_META[tab].title;
}

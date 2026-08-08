import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'EB-5 NPRM Tracker',
  description:
    'Track USCIS Docket USCIS-2026-0100 comments by theme and build a distinct personal comment prompt. Information site only — file on regulations.gov.',
  openGraph: {
    title: 'EB-5 NPRM Tracker | EB5 Base',
    description:
      'Browse real NPRM comments, learn CFR stakes, generate a distinct prompt for your own LLM.',
    url: 'https://eb5base.com/nprm',
  },
};

export default function NprmLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

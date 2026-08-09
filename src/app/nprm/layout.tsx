import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Comment on the EB-5 Proposed Rule',
  description:
    'USCIS Docket USCIS-2026-0100 (91 FR 40676). Read EB-5 NPRM comments by theme and draft a distinct personal comment. Information only; file on regulations.gov.',
  openGraph: {
    title: 'Comment on the EB-5 Proposed Rule | EB5 Base',
    description:
      'Context on the July 2026 EB-5 NPRM: grandfathering, sustainment, bridge financing, and more. Build a distinct comment for regulations.gov.',
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

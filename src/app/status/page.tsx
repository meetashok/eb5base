import type { Metadata } from 'next';
import PageHero from '@/components/PageHero';
import { BrandWordmark } from '@/components/Logo';
import StatusUpdateEmbed from '@/components/StatusUpdateEmbed';

export const metadata: Metadata = {
  title: 'Status Update',
  description:
    'Draft a structured EB-5 status update for sharing with your community: milestones, live preview, and one-click copy. All fields optional; drafts stay in your browser.',
  alternates: { canonical: 'https://eb5base.com/status' },
  openGraph: {
    title: 'Status Update | EB5 Base',
    description:
      'Draft a structured EB-5 status update for sharing with your community. Drafts stay in your browser.',
    url: 'https://eb5base.com/status',
  },
};

export default function StatusUpdatePage() {
  return (
    <div>
      <PageHero
        eyebrow={<span>Status Update</span>}
        title="Build your EB-5 status for sharing with your community"
        subtitle={
          <p>
            Fill in the milestones that apply, preview the message live, and copy or share it with
            your investor group, including WhatsApp. Part of{' '}
            <BrandWordmark variant="on-light" className="font-semibold" />, same builder as{' '}
            <a
              href="https://bit.ly/eb5status"
              className="link link-secondary"
              target="_blank"
              rel="noopener noreferrer"
            >
              bit.ly/eb5status
            </a>
            .
          </p>
        }
      />

      <div className="max-w-3xl mx-auto px-4 pb-6 space-y-3">
        <div
          className="rounded-xl border-2 border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 leading-relaxed"
          role="note"
        >
          <p className="font-bold mb-1">Before you share publicly</p>
          <p>
            Do not share A-numbers, receipt numbers, home addresses, or attorney details. If you
            type personal identifiers, remove them before posting to a community group.
          </p>
        </div>
      </div>

      <StatusUpdateEmbed />
    </div>
  );
}

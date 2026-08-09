import type { Metadata } from 'next';
import PageHero from '@/components/PageHero';
import { BrandWordmark } from '@/components/Logo';
import StatusUpdateEmbed from '@/components/StatusUpdateEmbed';

export const metadata: Metadata = {
  title: 'Status Update',
  description:
    'Draft a structured EB-5 status update for sharing with your community: milestones, live preview, and one-click copy. All fields optional; drafts stay in your browser.',
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

        <aside className="rounded-xl border-2 border-base-300 bg-base-100 p-4 shadow-sm space-y-2">
          <p className="text-xs uppercase tracking-wider font-bold text-secondary">
            Sample preview
          </p>
          <p className="text-sm text-neutral leading-relaxed font-medium">
            I-526E filed Mar 2023 · India · TEA rural · Still waiting on interview · Capital
            deployed to JCE · No personal identifiers shared.
          </p>
          <p className="text-xs text-neutral/70">
            Empty forms feel intimidating. Start from your real milestones in the builder below.
            Drafts stay in your browser.
          </p>
        </aside>
      </div>

      <StatusUpdateEmbed />
    </div>
  );
}

import { DISCLAIMER, CONTACT_EMAIL } from '@/lib/constants';

export const metadata = {
  title: 'Terms of Service',
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-bold text-primary">{title}</h2>
      <div className="space-y-3 text-sm text-neutral/80 leading-relaxed">{children}</div>
    </section>
  );
}

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-primary mb-2">Terms of Service</h1>
      <p className="text-sm text-neutral/50 mb-8">Last updated: July 14, 2026</p>

      <div className="space-y-10">
        <Section title="Agreement">
          <p>
            These Terms govern your use of EB5 Base at eb5base.com. By signing in or using the
            service, you agree to these Terms and our{' '}
            <a href="/privacy" className="link link-secondary">
              Privacy Policy
            </a>
            .
          </p>
        </Section>

        <Section title="Acceptable use">
          <p>
            Use EB5 Base only for lawful purposes related to tracking your own (or your household&apos;s)
            EB-5 immigration cases. Do not attempt to access another user&apos;s data, probe the
            system, abuse the USCIS polling features, or submit receipt numbers you are not
            authorized to track.
          </p>
        </Section>

        <Section title="No guarantee of accuracy">
          <p>
            USCIS is the source of truth for case status. EB5 Base may show delayed, incomplete, or
            stub/demo statuses depending on configuration. We do not guarantee that status data is
            complete, current, or error-free.
          </p>
        </Section>

        <Section title="Your responsibility">
          <p>
            You are responsible for entering accurate receipt numbers and keeping your account
            secure. Encrypted storage does not remove your duty to protect access to your login.
          </p>
        </Section>

        <Section title="Account termination">
          <p>
            You may delete your account at any time in Settings. We may suspend or terminate accounts
            that violate these Terms or abuse the service.
          </p>
        </Section>

        <Section title="Limitation of liability">
          <p>
            EB5 Base is provided &quot;as is&quot; without warranties of any kind. To the fullest
            extent allowed by law, we are not liable for indirect, incidental, or consequential
            damages arising from your use of the service, including immigration, travel, or
            investment decisions.
          </p>
        </Section>

        <Section title="Dispute resolution">
          <p>
            These Terms are governed by the laws of the United States, without regard to conflict of
            law rules. Disputes should first be raised by emailing {CONTACT_EMAIL}. If unresolved,
            disputes will be handled in a court of competent jurisdiction agreed by the parties, unless
            applicable law requires otherwise.
          </p>
        </Section>

        <Section title="Contact">
          <p>
            <a href={`mailto:${CONTACT_EMAIL}`} className="link link-secondary">
              {CONTACT_EMAIL}
            </a>
          </p>
        </Section>

        <p className="text-meta text-neutral/50 pt-4 border-t border-base-300">{DISCLAIMER}</p>
      </div>
    </div>
  );
}

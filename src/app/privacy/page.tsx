import { CONTACT_EMAIL } from '@/lib/constants';

export const metadata = {
  title: 'Privacy Policy',
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-bold text-primary">{title}</h2>
      <div className="space-y-3 text-[15px] text-neutral/80 leading-relaxed">{children}</div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-primary mb-2">Privacy Policy</h1>
      <p className="text-sm text-neutral/50 mb-8">Last updated: July 14, 2026</p>

      <div className="space-y-10">
        <Section title="Overview">
          <p>
            EB5 Base (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) operates a USCIS case
            status tracker for EB-5 investors. This policy explains what we collect, how we store it,
            and your choices. By using the site, you also agree to our{' '}
            <a href="/terms" className="link link-secondary">
              Terms of Service
            </a>
            .
          </p>
        </Section>

        <Section title="What we collect">
          <p>
            <strong className="text-neutral">Account data.</strong> Email address, display name, and
            sign-in details from Google OAuth or magic link.
          </p>
          <p>
            <strong className="text-neutral">Case data.</strong> USCIS receipt numbers (encrypted),
            form types, filing dates, project/regional center details you provide, family member
            labels, optional WOM details, and status history returned by USCIS (or our development
            stub).
          </p>
        </Section>

        <Section title="How we store data">
          <p>
            Data is stored in Supabase (Postgres) with Row Level Security so you can only access your
            own rows. Receipt numbers are encrypted at rest with server-side AES-256-GCM. Plaintext
            receipt numbers are not stored in the database.
          </p>
        </Section>

        <Section title="How we use data">
          <p>
            We use your data only to poll USCIS case status, show you your timeline, send the email
            alerts you opt into, and compute anonymized aggregate insights. Insights never include
            receipt numbers and require a minimum group size before we show results.
          </p>
        </Section>

        <Section title="Sharing">
          <p>
            We do not sell personal information. We do not share receipt numbers with third parties.
            Aggregate insights are anonymized. Service providers (hosting, email delivery, database)
            process data only to run the product.
          </p>
        </Section>

        <Section title="Retention">
          <p>We keep your data until you delete your account. Deletion removes your data from our database.</p>
        </Section>

        <Section title="Your rights">
          <p>
            <strong className="text-neutral">Right to know / export.</strong> Use Export My Data in
            Settings to download a JSON file of your information (including decrypted receipt numbers
            for your own records).
          </p>
          <p>
            <strong className="text-neutral">Right to delete.</strong> Use Delete My Account in
            Settings to permanently remove your data.
          </p>
          <p>
            <strong className="text-neutral">Right to opt out of sale.</strong> We do not sell personal
            information. You may still exercise this right by contacting us.
          </p>
          <p>
            <a href="/privacy#do-not-sell" className="link link-secondary">
              Do Not Sell My Personal Information
            </a>
          </p>
        </Section>

        <Section title="Do Not Sell My Personal Information">
          <p id="do-not-sell">
            EB5 Base does not sell personal information. If you have questions about this statement,
            email {CONTACT_EMAIL}.
          </p>
        </Section>

        <Section title="Breach notification">
          <p>
            If we learn of a breach that affects your personal information, we will notify affected
            users and regulators as required by applicable law, using the email on your account when
            possible.
          </p>
        </Section>

        <Section title="CCPA">
          <p>
            If you are a California resident, you have rights under the CCPA/CPRA including access,
            deletion, and opt-out of sale. We do not sell personal information. Contact{' '}
            {CONTACT_EMAIL} to make a request.
          </p>
        </Section>

        <Section title="Contact">
          <p>
            Email{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} className="link link-secondary">
              {CONTACT_EMAIL}
            </a>
            .
          </p>
        </Section>
      </div>
    </div>
  );
}

import { DISCLAIMER } from '@/lib/constants';

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
      <p className="text-sm text-neutral/50 mb-8">Last updated: August 10, 2026</p>

      <div className="space-y-10">
        <Section title="Agreement">
          <p>
            These Terms of Service (&quot;Terms&quot;) govern your access to and use of EB5 Base
            (&quot;EB5 Base,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) at{' '}
            <a href="https://eb5base.com" className="link link-secondary">
              eb5base.com
            </a>{' '}
            and related services. By creating an account, signing in, or using the site, you agree to
            these Terms and our{' '}
            <a href="/privacy" className="link link-secondary">
              Privacy Policy
            </a>
            .
          </p>
          <p>
            If you do not agree, do not use EB5 Base. We may update these Terms from time to time.
            Continued use after changes are posted means you accept the revised Terms.
          </p>
        </Section>

        <Section title="What EB5 Base is">
          <p>
            EB5 Base provides informational tools for EB-5 investors, including a
            plain-language NPRM explainer and comment guide, a status update
            builder for sharing milestones with the community, and a forthcoming
            case tracker. Some directory features remain paused while we review
            legal and compliance questions.
          </p>
          <p>{DISCLAIMER}</p>
        </Section>

        <Section title="Eligibility">
          <p>
            You must be at least 13 years old to use EB5 Base. If you are using the site on behalf
            of an organization, you represent that you have authority to bind that organization to
            these Terms.
          </p>
          <p>
            You agree to provide accurate account information and to keep it reasonably up to date.
          </p>
        </Section>

        <Section title="Accounts and security">
          <p>
            You are responsible for activity that occurs under your account and for keeping your
            sign-in method secure. Notify us promptly at{' '}
            <a href="mailto:hello@eb5base.com" className="link link-secondary">
              hello@eb5base.com
            </a>{' '}
            if you believe your account has been compromised.
          </p>
          <p>
            We may suspend or terminate accounts that violate these Terms, create risk for other
            users, or disrupt the service.
          </p>
        </Section>

        <Section title="Acceptable use">
          <p>You agree not to:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Submit false, misleading, or defamatory information</li>
            <li>Impersonate another person, regional center, law firm, or organization</li>
            <li>Upload content you do not have the right to share</li>
            <li>Harass, spam, or abuse other users or EB5 Base staff</li>
            <li>Attempt to scrape, reverse engineer, or disrupt the site</li>
            <li>Use EB5 Base for unlawful purposes or in violation of applicable regulations</li>
            <li>Circumvent moderation, access controls, or security measures</li>
          </ul>
          <p>
            EB5 Base is an informational community resource, not a marketplace or solicitation
            platform. Do not use it to make investment offers, guarantees, or legal representations
            on behalf of others without proper authority.
          </p>
        </Section>

        <Section title="User content">
          <p>
            You may submit projects, edits, status confirmations, duplicate reports, profile
            information, and other content (&quot;User Content&quot;). You retain ownership of your
            User Content, but you grant EB5 Base a non-exclusive, worldwide, royalty-free license
            to host, display, reproduce, adapt, and distribute it as needed to operate, improve, and
            promote the directory.
          </p>
          <p>
            You represent that your User Content is accurate to the best of your knowledge, that you
            have the right to submit it, and that it does not violate these Terms or applicable law.
          </p>
          <p>
            Because EB5 Base is crowdsourced, listings and community updates are not independently
            verified. Other users may rely on what you post, so submit information responsibly.
          </p>
        </Section>

        <Section title="Moderation and removal">
          <p>
            We may review, approve, reject, edit, hide, or remove User Content at our discretion,
            including content reported as inaccurate, duplicate, abusive, or out of scope. We are
            not obligated to publish any submission.
          </p>
          <p>
            Repeated violations, bad-faith submissions, or conduct that harms the community may result
            in account restrictions or termination.
          </p>
        </Section>

        <Section title="No professional advice">
          <p>
            EB5 Base does not provide immigration, legal, tax, or investment advice. Content on the
            site comes from community contributors and public sources. You are solely responsible
            for your immigration and investment decisions.
          </p>
          <p>
            Always consult a qualified immigration attorney and other appropriate professionals
            before making EB-5 investment decisions.
          </p>
        </Section>

        <Section title="Third-party services and links">
          <p>
            EB5 Base may link to third-party websites, regional centers, or services. We do not
            control and are not responsible for third-party content, policies, or practices.
          </p>
          <p>
            Sign-in and hosting are provided by third-party services described in our Privacy
            Policy.
          </p>
        </Section>

        <Section title="Disclaimer of warranties">
          <p>
            EB5 Base is provided on an &quot;as is&quot; and &quot;as available&quot; basis. To the
            fullest extent permitted by law, we disclaim all warranties, express or implied,
            including merchantability, fitness for a particular purpose, and non-infringement.
          </p>
          <p>
            We do not warrant that the site will be uninterrupted, error-free, complete, or current.
          </p>
        </Section>

        <Section title="Limitation of liability">
          <p>
            To the fullest extent permitted by law, EB5 Base and its operators will not be liable
            for any indirect, incidental, special, consequential, or punitive damages, or for any
            loss of profits, data, goodwill, or investment outcomes arising from your use of the
            site or reliance on User Content.
          </p>
          <p>
            Our total liability for any claim relating to EB5 Base will not exceed USD $100.
          </p>
        </Section>

        <Section title="Indemnification">
          <p>
            You agree to defend, indemnify, and hold harmless EB5 Base and its operators from claims,
            damages, losses, and expenses (including reasonable legal fees) arising out of your
            User Content, your use of the site, or your violation of these Terms.
          </p>
        </Section>

        <Section title="Termination">
          <p>
            You may stop using EB5 Base at any time. To request account deletion, email{' '}
            <a href="mailto:hello@eb5base.com" className="link link-secondary">
              hello@eb5base.com
            </a>
            .
          </p>
          <p>
            We may suspend or terminate access immediately if we reasonably believe you have violated
            these Terms or created risk for the service or other users.
          </p>
        </Section>

        <Section title="Governing law">
          <p>
            These Terms are governed by the laws of the State of Washington, United States, without
            regard to conflict-of-law rules. Except where prohibited, disputes will be brought in
            the state or federal courts located in Washington, and you consent to their jurisdiction.
          </p>
        </Section>

        <Section title="Contact">
          <p>
            Questions about these Terms:{' '}
            <a href="mailto:hello@eb5base.com" className="link link-secondary">
              hello@eb5base.com
            </a>
          </p>
        </Section>
      </div>
    </div>
  );
}

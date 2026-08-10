export const metadata = {
  title: 'Privacy Policy',
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-bold text-primary">{title}</h2>
      <div className="space-y-3 text-sm text-neutral/80 leading-relaxed">{children}</div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-primary mb-2">Privacy Policy</h1>
      <p className="text-sm text-neutral/50 mb-8">Last updated: July 11, 2026</p>

      <div className="space-y-10">
        <Section title="Overview">
          <p>
            EB5 Base (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) operates information
            tools for EB-5 investors (NPRM guide, status update, forthcoming case tracker) and a
            community directory that may be paused. This Privacy Policy explains what information
            we collect, how we use it, and the choices you have.
          </p>
          <p>
            By using EB5 Base, you agree to this policy and our{' '}
            <a href="/terms" className="link link-secondary">
              Terms of Service
            </a>
            .
          </p>
          <p>
            NPRM comment drafts and Status Update fields stay in your browser (localStorage) unless
            you copy them elsewhere. We do not collect A-numbers. If you join the Case Tracker
            waitlist, we store your email only to send one launch notification; we do not use it for
            ads or a marketing list. You can ask us to remove it at hello@eb5base.com.
          </p>
        </Section>

        <Section title="Information we collect">
          <p>
            <strong className="text-neutral">Account information.</strong> When you sign in, we
            collect your email address and basic authentication data. If you use Google sign-in,
            Google may share your name and profile image with us according to your Google account
            settings.
          </p>
          <p>
            <strong className="text-neutral">Profile information.</strong> You may provide a display
            name, role (such as investor, RC representative, attorney, or agent), profile visibility
            preferences, and email notification settings.
          </p>
          <p>
            <strong className="text-neutral">Community contributions.</strong> We collect information
            you choose to submit, including project listings, edits, status confirmations, duplicate
            reports, and regional center verification requests.
          </p>
          <p>
            <strong className="text-neutral">Case Tracker waitlist.</strong> If you opt in on the
            home page or Case Tracker page, we store the email address you submit, when you
            submitted it, and which page you used. We use it only for a one-time launch notice.
          </p>
          <p>
            <strong className="text-neutral">Technical information.</strong> Our hosting and
            analytics providers may collect limited technical data such as browser type, device
            information, page views, and approximate usage patterns.
          </p>
        </Section>

        <Section title="How we use information">
          <p>We use information to:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Create and secure your account</li>
            <li>Display your profile and community contributions according to your settings</li>
            <li>Operate, maintain, and improve EB5 Base</li>
            <li>Review submissions and moderate content</li>
            <li>Respond to support requests and reports</li>
            <li>Send service-related emails, such as login links and account notifications</li>
            <li>
              Notify waitlist subscribers once when Case Tracker launches (opt-in email only)
            </li>
            <li>Understand aggregate site usage through privacy-focused analytics</li>
          </ul>
          <p>We do not sell your personal information.</p>
        </Section>

        <Section title="What is public vs. private">
          <p>
            <strong className="text-neutral">Generally private:</strong> Your email address and
            account settings are not shown publicly on the directory.
          </p>
          <p>
            <strong className="text-neutral">May be public:</strong> Depending on your settings and
            activity, your display name, role, project submissions, edits, and other community
            contributions may be visible to other users as part of the directory. Status
            confirmations are aggregated. Other users see counts, not who confirmed.
          </p>
          <p>
            You can control whether your profile is visible to others through your profile settings.
            Even when profile visibility is limited, contributions you make to public directory
            content may still appear with your display name.
          </p>
        </Section>

        <Section title="Third-party services">
          <p>We use trusted third-party services to operate EB5 Base:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong className="text-neutral">Supabase</strong> for authentication, database
              hosting, and account session management
            </li>
            <li>
              <strong className="text-neutral">Google</strong> if you choose Google sign-in
            </li>
            <li>
              <strong className="text-neutral">GoatCounter</strong> for privacy-focused, anonymized
              website analytics
            </li>
          </ul>
          <p>
            These providers process information on our behalf according to their own privacy
            policies and our instructions. We recommend reviewing their policies if you want more
            detail about how they handle data.
          </p>
        </Section>

        <Section title="Cookies and similar technologies">
          <p>
            EB5 Base uses cookies and similar technologies needed for sign-in, session management,
            and security. Supabase authentication may set cookies so you can stay signed in.
          </p>
          <p>
            GoatCounter analytics is designed to avoid tracking cookies for advertising and does not
            build individual advertising profiles. We do not use advertising cookies or third-party
            ad networks.
          </p>
        </Section>

        <Section title="Analytics">
          <p>
            We use GoatCounter to understand aggregate traffic and usage, such as which pages are
            visited and general referral information. Analytics are intended to be lightweight and
            privacy-focused rather than used for cross-site tracking or ad targeting.
          </p>
        </Section>

        <Section title="Data retention">
          <p>
            We retain account and contribution data for as long as needed to operate EB5 Base,
            maintain the directory, comply with legal obligations, resolve disputes, and enforce our
            policies.
          </p>
          <p>
            If you request account deletion, we will take reasonable steps to remove or anonymize
            personal account information, although some community contributions may remain visible
            in anonymized or historical form where needed to preserve directory integrity.
          </p>
        </Section>

        <Section title="Your choices and rights">
          <p>
            You can update many profile fields and notification settings from your account. You may
            also contact us to request access to, correction of, or deletion of personal information
            associated with your account.
          </p>
          <p>
            Depending on where you live, you may have additional rights under laws such as GDPR or
            CCPA, including the right to know what personal information we process, request deletion,
            or object to certain processing. We will honor applicable legal rights when verified.
          </p>
        </Section>

        <Section title="Account deletion">
          <p>
            To request deletion of your account, email{' '}
            <a href="mailto:hello@eb5base.com" className="link link-secondary">
              hello@eb5base.com
            </a>
            . We may need to verify your request before processing it.
          </p>
        </Section>

        <Section title="Children">
          <p>
            EB5 Base is not directed to children under 13, and we do not knowingly collect personal
            information from children under 13. If you believe a child has provided us personal
            information, contact us and we will take appropriate steps to remove it.
          </p>
        </Section>

        <Section title="International users">
          <p>
            EB5 Base is operated from the United States. If you access the site from outside the
            United States, your information may be processed in the United States and other
            countries where our service providers operate. Those countries may have different data
            protection laws than your home country.
          </p>
        </Section>

        <Section title="Security">
          <p>
            We use reasonable administrative, technical, and organizational safeguards to protect
            personal information. No online service can guarantee absolute security, so please use
            a strong sign-in method and protect access to your email account.
          </p>
        </Section>

        <Section title="Changes to this policy">
          <p>
            We may update this Privacy Policy from time to time. When we do, we will revise the
            &quot;Last updated&quot; date above. Continued use of EB5 Base after changes become
            effective means you accept the revised policy.
          </p>
        </Section>

        <Section title="Contact">
          <p>
            Privacy questions or requests:{' '}
            <a href="mailto:hello@eb5base.com" className="link link-secondary">
              hello@eb5base.com
            </a>
          </p>
        </Section>
      </div>
    </div>
  );
}

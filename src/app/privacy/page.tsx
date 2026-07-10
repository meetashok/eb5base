export const metadata = {
  title: 'Privacy',
};

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-primary mb-6">Privacy Policy</h1>
      <div className="space-y-4 text-sm text-neutral/80 leading-relaxed">
        <p>
          EB5 Base collects account information you provide (email, display name, optional profile
          fields) and activity you choose to share (project submissions, status confirmations,
          duplicate reports).
        </p>
        <p>
          Authentication is handled by Supabase. Google OAuth may provide your name and avatar if
          you choose that sign-in method.
        </p>
        <p>
          We do not sell personal data. Profile visibility is controlled by your “Profile visible to
          others” setting. Confirmations and project contributions may be shown publicly as part of
          the
          directory.
        </p>
        <p>
          Questions:{' '}
          <a href="mailto:hello@eb5base.com" className="link link-secondary">
            hello@eb5base.com
          </a>
        </p>
      </div>
    </div>
  );
}

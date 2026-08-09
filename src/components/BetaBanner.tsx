const CONTACT_EMAIL = 'hello@eb5base.com';

export default function BetaBanner() {
  return (
    <div className="bg-accent/15 border-b border-accent/30 text-center px-4 py-2 text-sm text-neutral/80">
      <span className="font-medium text-primary">Public beta</span>
      {'. '}
      We&apos;re improving quickly. Send feedback to{' '}
      <a
        href={`mailto:${CONTACT_EMAIL}?subject=EB5%20Base%20feedback`}
        className="link link-secondary font-medium"
      >
        {CONTACT_EMAIL}
      </a>
      .
    </div>
  );
}

const CONTACT_EMAIL = 'hello@eb5base.com';

export default function BetaBanner() {
  return (
    <div className="bg-rose/10 border-b border-rose/25 text-center px-4 py-2 text-sm text-neutral/80">
      <span className="font-medium text-rose-dark">Public beta</span>
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

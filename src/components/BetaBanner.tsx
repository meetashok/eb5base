import Link from 'next/link';

const FEEDBACK_EMAIL = 'feedback@eb5base.com';

export default function BetaBanner() {
  return (
    <div className="bg-accent/15 border-b border-accent/30 text-center px-4 py-2 text-sm text-neutral/80">
      <span className="font-medium text-primary">Public beta</span>
      {' — '}
      We&apos;re improving quickly.{' '}
      <Link href={`mailto:${FEEDBACK_EMAIL}`} className="link link-secondary font-medium">
        Send feedback
      </Link>
    </div>
  );
}

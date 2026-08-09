import type { Metadata } from 'next';
import Link from 'next/link';
import Logo, { BrandWordmark } from '@/components/Logo';

export const metadata: Metadata = {
  title: 'Temporarily unavailable',
  description:
    'The EB5 Base project directory is paused. NPRM guide and Tracker preview remain available.',
  robots: { index: false, follow: false },
};

const CONTACT_EMAIL = 'hello@eb5base.com';

export default function MaintenancePage() {
  return (
    <div className="hero-glow border-b border-base-300/80">
      <div className="max-w-xl mx-auto px-4 py-16 md:py-20 text-center">
        <div className="flex justify-center mb-8">
          <Logo size={72} showWordmark wordmarkVariant="on-light" wordmarkClassName="text-2xl" />
        </div>

        <p className="hero-eyebrow text-secondary mb-3">Directory paused</p>
        <h1 className="text-3xl md:text-4xl font-bold text-primary tracking-tight text-balance">
          Project directory is offline
        </h1>
        <p className="mt-4 text-base md:text-lg text-neutral/70 leading-relaxed">
          We took the project directory offline while we review legal and compliance
          questions with counsel. Other EB5 Base tools below remain available.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row gap-2 justify-center">
          <Link href="/nprm" className="btn btn-primary rounded-full px-6">
            NPRM comment guide
          </Link>
          <Link href="/tracker" className="btn btn-outline rounded-full px-6">
            Case Tracker (coming soon)
          </Link>
          <Link href="/about" className="btn btn-ghost rounded-full px-6">
            About
          </Link>
        </div>

        <div className="mt-10 rounded-2xl border border-base-300 bg-base-100/80 px-6 py-5 text-center shadow-soft">
          <p className="text-sm text-neutral/70 leading-relaxed">
            If you need to reach us in the meantime, email{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} className="link link-secondary font-medium">
              {CONTACT_EMAIL}
            </a>
            .
          </p>
        </div>

        <p className="mt-8 text-sm text-neutral/50">
          <BrandWordmark variant="on-light" className="text-sm" />
          <span className="mx-2">·</span>
          eb5base.com
        </p>
      </div>
    </div>
  );
}

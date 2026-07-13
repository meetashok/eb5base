import type { Metadata } from 'next';
import Logo, { BrandWordmark } from '@/components/Logo';

export const metadata: Metadata = {
  title: 'Temporarily unavailable',
  description:
    'EB5 Base is temporarily unavailable while we review legal and compliance questions.',
  robots: { index: false, follow: false },
};

const CONTACT_EMAIL = 'hello@eb5base.com';

export default function MaintenancePage() {
  return (
    <div className="min-h-screen flex flex-col hero-glow">
      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="max-w-xl w-full text-center">
          <div className="flex justify-center mb-8">
            <Logo size={72} showWordmark wordmarkVariant="on-light" wordmarkClassName="text-2xl" />
          </div>

          <p className="hero-eyebrow text-secondary mb-3">Temporarily unavailable</p>
          <h1 className="text-3xl md:text-4xl font-bold text-primary tracking-tight text-balance">
            EB5 Base is paused
          </h1>
          <p className="mt-4 text-base md:text-lg text-neutral/70 leading-relaxed">
            We have taken the directory offline while we review legal and compliance
            questions with counsel. Thank you for your patience.
          </p>

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
    </div>
  );
}

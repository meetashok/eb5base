import Link from 'next/link';
import { BrandWordmark } from '@/components/Logo';
import PageHero from '@/components/PageHero';
import { CONTACT_EMAIL } from '@/lib/constants';

export const metadata = {
  title: 'Contact',
};

export default function ContactPage() {
  return (
    <div>
      <PageHero
        eyebrow="Get in touch"
        title="Contact"
        subtitle={
          <>
            Questions about{' '}
            <BrandWordmark variant="on-light" className="text-base inline-flex" /> or the case
            tracker — we read every message.
          </>
        }
      />

      <div className="max-w-2xl mx-auto px-4 py-10 space-y-6">
        <section className="card-elevated p-8 text-center">
          <h2 className="text-lg font-bold text-primary mb-2">General &amp; privacy</h2>
          <p className="text-neutral/70 mb-6 text-sm">
            Account help, privacy requests, product feedback, or anything else.
          </p>
          <a href={`mailto:${CONTACT_EMAIL}`} className="btn btn-primary rounded-full">
            {CONTACT_EMAIL}
          </a>
        </section>

        <p className="text-center text-sm text-neutral/50">
          Also see{' '}
          <Link href="/privacy" className="link link-secondary">
            Privacy
          </Link>{' '}
          and{' '}
          <Link href="/terms" className="link link-secondary">
            Terms
          </Link>
          .
        </p>
      </div>
    </div>
  );
}

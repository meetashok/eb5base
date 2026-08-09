import Link from 'next/link';
import { BrandWordmark } from '@/components/Logo';
import PageHero from '@/components/PageHero';

export const metadata = {
  title: 'Contact',
};

const CONTACT_EMAIL = 'hello@eb5base.com';

export default function ContactPage() {
  return (
    <div>
      <PageHero
        eyebrow="Get in touch"
        title="Contact"
        subtitle={
          <>
            Feedback, corrections, or questions about{' '}
            <BrandWordmark variant="on-light" className="text-base inline-flex" />. We read every
            message.
          </>
        }
      />

      <div className="max-w-2xl mx-auto px-4 py-10 space-y-6">
        <section className="card-elevated p-8 text-center space-y-4">
          <h2 className="text-lg font-bold text-primary">Email us</h2>
          <p className="text-neutral/70 text-sm leading-relaxed max-w-md mx-auto">
            Bug reports, corrections, UX suggestions, partnerships, account help, or anything
            else. One inbox:{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} className="link link-secondary font-medium">
              {CONTACT_EMAIL}
            </a>
            .
          </p>
          <a
            href={`mailto:${CONTACT_EMAIL}?subject=EB5%20Base%20inquiry`}
            className="btn btn-primary rounded-full"
          >
            {CONTACT_EMAIL}
          </a>
        </section>

        <p className="text-center text-sm text-neutral/50">
          Prefer a form-free start? Open a mail draft from the button above, or visit{' '}
          <Link href="/about" className="link link-secondary">
            About
          </Link>
          .
        </p>
      </div>
    </div>
  );
}

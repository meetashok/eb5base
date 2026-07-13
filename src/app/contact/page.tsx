import Link from 'next/link';
import { BrandWordmark } from '@/components/Logo';
import PageHero from '@/components/PageHero';

export const metadata = {
  title: 'Contact',
};

const FEEDBACK_EMAIL = 'feedback@eb5base.com';
const HELLO_EMAIL = 'hello@eb5base.com';

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
        <section className="card-elevated p-8 text-center">
          <h2 className="text-lg font-bold text-primary mb-2">Send feedback</h2>
          <p className="text-neutral/70 mb-6 text-sm">
            Bug reports, wrong project data, UX suggestions, especially during our public beta.
          </p>
          <a
            href={`mailto:${FEEDBACK_EMAIL}?subject=EB5%20Base%20feedback`}
            className="btn btn-primary rounded-full"
          >
            {FEEDBACK_EMAIL}
          </a>
        </section>

        <section className="card-elevated p-8 text-center">
          <h2 className="text-lg font-bold text-primary mb-2">General questions</h2>
          <p className="text-neutral/70 mb-6 text-sm">
            Partnerships, regional center verification, account help, or anything else.
          </p>
          <a href={`mailto:${HELLO_EMAIL}`} className="btn btn-outline rounded-full">
            {HELLO_EMAIL}
          </a>
        </section>

        <p className="text-center text-sm text-neutral/50">
          Signed in? See your contributions on{' '}
          <Link href="/timeline" className="link link-secondary">
            My Timeline
          </Link>
          .
        </p>
      </div>
    </div>
  );
}

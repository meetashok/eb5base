import PageHero from '@/components/PageHero';
import { BrandWordmark } from '@/components/Logo';

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
            Feedback, corrections, or questions about{' '}
            <BrandWordmark variant="on-light" className="text-base inline-flex" />. We read every
            message.
          </>
        }
      />

      <div className="max-w-2xl mx-auto px-4 py-10">
        <section className="card-elevated p-8 text-center">
          <p className="text-neutral/70 mb-6">
            Email us directly and we&apos;ll get back to you as soon as we can.
          </p>
          <a href="mailto:hello@eb5base.com" className="btn btn-primary rounded-full">
            hello@eb5base.com
          </a>
        </section>
      </div>
    </div>
  );
}

import Link from 'next/link';
import { DISCLAIMER, CONTACT_EMAIL } from '@/lib/constants';
import PageHero from '@/components/PageHero';
import { BrandWordmark } from '@/components/Logo';

export const metadata = {
  title: 'About',
};

export default function AboutPage() {
  return (
    <div>
      <PageHero
        eyebrow="About"
        title={
          <>
            Why <BrandWordmark variant="on-light" className="text-[0.95em]" /> exists
          </>
        }
        subtitle="A case status tracker built by an EB-5 investor, for the EB-5 community."
      />

      <div className="max-w-3xl mx-auto px-4 py-10 space-y-8 text-sm text-neutral/80 leading-relaxed">
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-primary">The platform</h2>
          <p>
            EB5 Base helps immigrant investors track USCIS applications (I-526E, I-485, I-131, I-765)
            with encrypted receipt storage, email alerts when status changes, and anonymized community
            insights by project and filing cohort.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-primary">Who built it</h2>
          <p>
            Built by Ashok Kumar, an EB-5 investor who wanted a clearer view of case progress —
            without handing receipt numbers to a black-box service.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-primary">Open source</h2>
          <p>
            The codebase is open so the community can verify how encryption, polling, and privacy
            controls work. Contributions and review are welcome.
          </p>
          <p>
            <a
              href="https://github.com/meetashok/eb5base"
              className="link link-secondary"
              target="_blank"
              rel="noreferrer"
            >
              github.com/meetashok/eb5base
            </a>
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-primary">Contact</h2>
          <p>
            Questions or feedback:{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} className="link link-secondary">
              {CONTACT_EMAIL}
            </a>
            . Also see{' '}
            <Link href="/contact" className="link link-secondary">
              Contact
            </Link>
            ,{' '}
            <Link href="/privacy" className="link link-secondary">
              Privacy
            </Link>
            , and{' '}
            <Link href="/terms" className="link link-secondary">
              Terms
            </Link>
            .
          </p>
        </section>

        <p className="text-meta text-neutral/50 pt-4 border-t border-base-300">{DISCLAIMER}</p>
      </div>
    </div>
  );
}

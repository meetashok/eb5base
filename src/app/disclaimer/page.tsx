import Link from 'next/link';
import { DISCLAIMER } from '@/lib/constants';
import { DOCKET_URL, FR_HTML } from '@/lib/nprm/config';
import PageHero from '@/components/PageHero';

export const metadata = {
  title: 'Disclaimer',
  description:
    'EB5 Base is not affiliated with USCIS or DHS. Not legal or financial advice. Verify on regulations.gov and consult an immigration attorney.',
};

export default function DisclaimerPage() {
  return (
    <div>
      <PageHero
        eyebrow="Legal"
        title="Disclaimer"
        subtitle="Read this before relying on any tool or summary on EB5 Base."
      />
      <div className="max-w-3xl mx-auto px-4 py-10 space-y-6 text-sm text-neutral/85 leading-relaxed">
        <p>
          EB5 Base is not affiliated with USCIS, DHS, or any government agency. Nothing on this
          site is legal or financial advice. Information is based on public Federal Register
          documents and regulations.gov filings. Always verify on{' '}
          <a
            href={FR_HTML}
            target="_blank"
            rel="noopener noreferrer"
            className="link link-secondary font-medium"
          >
            the Federal Register
          </a>{' '}
          and{' '}
          <a
            href={DOCKET_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="link link-secondary font-medium"
          >
            regulations.gov
          </a>
          , and consult a licensed immigration attorney for your situation.
        </p>
        <p>{DISCLAIMER}</p>
        <p>
          EB5 Base does not submit comments to regulations.gov on your behalf. Drafts built here
          stay in your browser unless you choose to copy and file them yourself.
        </p>
        <p>
          Questions?{' '}
          <a href="mailto:hello@eb5base.com" className="link link-secondary font-medium">
            hello@eb5base.com
          </a>
          {' · '}
          <Link href="/about" className="link link-secondary font-medium">
            About
          </Link>
          {' · '}
          <Link href="/terms" className="link link-secondary font-medium">
            Terms
          </Link>
          {' · '}
          <Link href="/privacy" className="link link-secondary font-medium">
            Privacy
          </Link>
        </p>
      </div>
    </div>
  );
}

import { DISCLAIMER } from '@/lib/constants';

export const metadata = {
  title: 'About',
};

function HeadingIcon({ children }: { children: React.ReactNode }) {
  return <span className="inline-flex mr-2 text-secondary align-middle">{children}</span>;
}

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12 prose prose-lg prose-neutral">
      <h1 className="text-3xl font-bold text-primary mb-8 !mt-0">About EB5 Base</h1>

      <section className="mb-12 space-y-4 text-neutral/80 not-prose leading-relaxed">
        <p>
          EB5 Base is a free, public, crowdsourced directory of EB-5 immigration investment
          projects. It exists so investors, attorneys, agents, and regional center operators can
          find factual project information in one place — without paywalls or sales pitches.
        </p>
        <p>
          Listings are contributed by the community. Status confirmations help surface whether a
          project is
          still accepting subscriptions. Nothing here is independently verified by EB5 Base, and
          the directory does not replace due diligence with qualified professionals.
        </p>
        <p>
          Whether you are considering your first EB-5 investment or tracking projects you already
          know, EB5 Base is built to stay open, factual, and useful.
        </p>
      </section>

      <section className="mb-12 not-prose">
        <h2 className="text-xl font-bold text-primary mb-4 flex items-center">
          <HeadingIcon>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </HeadingIcon>
          How it works
        </h2>
        <ol className="list-decimal pl-5 space-y-3 text-neutral/80">
          <li>
            <strong className="text-neutral">Browse projects</strong> — Search by name, regional
            center, location, TEA designation, I-956F status, and subscription status.
          </li>
          <li>
            <strong className="text-neutral">Confirm status</strong> — Signed-in users can report
            whether a project is still open for subscriptions (rate-limited to keep signal clean).
          </li>
          <li>
            <strong className="text-neutral">Add what you know</strong> — Contribute factual project
            details, contacts, and notes so others benefit from shared knowledge.
          </li>
        </ol>
      </section>

      <section className="mb-12 not-prose">
        <h2 className="text-xl font-bold text-primary mb-4 flex items-center">
          <HeadingIcon>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
            </svg>
          </HeadingIcon>
          Legal
        </h2>
        <div className="bg-base-200 rounded-xl p-6 mb-4">
          <p className="text-sm text-neutral/80 leading-relaxed">{DISCLAIMER}</p>
        </div>
        <ul className="list-disc pl-5 space-y-2 text-neutral/80">
          <li>EB5 Base does not rank, rate, recommend, or endorse any project.</li>
          <li>This site is non-commercial and maintained by EB-5 investors for EB-5 investors.</li>
          <li>Always consult a qualified immigration attorney.</li>
        </ul>
      </section>

      <section className="mb-12 not-prose">
        <h2 className="text-xl font-bold text-primary mb-2 flex items-center">
          <HeadingIcon>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </HeadingIcon>
          Contact
        </h2>
        <p className="text-neutral/80">
          Feedback and questions:{' '}
          <a href="mailto:hello@eb5base.com" className="link link-secondary">
            hello@eb5base.com
          </a>
        </p>
      </section>

      <p className="text-sm font-medium text-primary not-prose">
        Built by EB-5 investors, for EB-5 investors.
      </p>
    </div>
  );
}

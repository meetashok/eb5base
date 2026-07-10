import { DISCLAIMER } from '@/lib/constants';

export const metadata = {
  title: 'About',
};

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12 prose prose-neutral">
      <h1 className="text-3xl font-bold text-primary mb-6">About EB5 Base</h1>

      <section className="space-y-4 text-sm leading-relaxed text-neutral/80 mb-10">
        <p>
          EB5 Base is a free, public, crowdsourced directory of EB-5 immigration investment
          projects. It exists so investors, attorneys, agents, and regional center operators can
          find factual project information in one place — without paywalls or sales pitches.
        </p>
        <p>
          Listings are contributed by the community. Status votes help surface whether a project is
          still accepting subscriptions. Nothing here is independently verified by EB5 Base, and
          the directory does not replace due diligence with qualified professionals.
        </p>
        <p>
          Whether you are considering your first EB-5 investment or tracking projects you already
          know, EB5 Base is built to stay open, factual, and useful.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-bold text-primary mb-4">How it works</h2>
        <ol className="list-decimal pl-5 space-y-3 text-sm text-neutral/80">
          <li>
            <strong className="text-neutral">Browse projects</strong> — Search by name, regional
            center, location, TEA designation, I-956F status, and subscription status.
          </li>
          <li>
            <strong className="text-neutral">Vote on status</strong> — Signed-in users can report
            whether a project is still open for subscriptions (rate-limited to keep signal clean).
          </li>
          <li>
            <strong className="text-neutral">Add what you know</strong> — Contribute factual project
            details, contacts, and notes so others benefit from shared knowledge.
          </li>
        </ol>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-bold text-primary mb-4">Legal</h2>
        <p className="text-sm text-neutral/80 mb-4">{DISCLAIMER}</p>
        <ul className="list-disc pl-5 space-y-2 text-sm text-neutral/80">
          <li>EB5 Base does not rank, rate, recommend, or endorse any project.</li>
          <li>This site is non-commercial and maintained by EB-5 investors for EB-5 investors.</li>
          <li>Always consult a qualified immigration attorney.</li>
        </ul>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-bold text-primary mb-2">Contact</h2>
        <p className="text-sm text-neutral/80">
          Feedback and questions:{' '}
          <a href="mailto:hello@eb5base.com" className="link link-secondary">
            hello@eb5base.com
          </a>
        </p>
      </section>

      <p className="text-sm font-medium text-primary">
        Built by EB-5 investors, for EB-5 investors.
      </p>
    </div>
  );
}

import { DISCLAIMER } from '@/lib/constants';

export const metadata = {
  title: 'About',
};

function CheckItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-3 items-start">
      <svg
        className="w-5 h-5 text-success shrink-0 mt-0.5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden
      >
        <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span>{children}</span>
    </li>
  );
}

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-primary mb-8">About EB5 Base</h1>

      <section className="mb-12 space-y-4 text-neutral/80 leading-relaxed">
        <h2 className="text-xl font-bold text-primary">Why this exists</h2>
        <p>
          The EB-5 community deserves better access to information. Finding which projects are
          open, which have I-956F approval, or what other investors think often means digging
          through WhatsApp groups and scattered websites. EB5 Base brings this together in one
          place.
        </p>
      </section>

      <section className="mb-12">
        <h2 className="text-xl font-bold text-primary mb-4">How it works</h2>
        <ol className="list-decimal pl-5 space-y-3 text-neutral/80">
          <li>
            <strong className="text-neutral">Browse projects</strong> — Search by name, regional
            center, location, TEA designation, and status.
          </li>
          <li>
            <strong className="text-neutral">Confirm subscription status</strong> — Share whether a
            project is still open so the community stays current.
          </li>
          <li>
            <strong className="text-neutral">Contribute</strong> — Add projects and update details
            so fellow investors benefit from shared knowledge.
          </li>
        </ol>
      </section>

      <section className="mb-12">
        <h2 className="text-xl font-bold text-primary mb-4">Your data is safe</h2>
        <ul className="space-y-3 text-neutral/80">
          <CheckItem>Email used only for auth, never displayed or shared</CheckItem>
          <CheckItem>Country of birth optional and never shown publicly</CheckItem>
          <CheckItem>Confirmations show display name only</CheckItem>
          <CheckItem>No tracking cookies, no ads, no third-party data sharing</CheckItem>
          <CheckItem>Analytics are privacy-focused and anonymized (GoatCounter)</CheckItem>
        </ul>
      </section>

      <section className="mb-12 space-y-3 text-neutral/80 leading-relaxed">
        <h2 className="text-xl font-bold text-primary">Free for investors</h2>
        <p>
          EB5 Base is free to use for investors. Browse, confirm, add projects, and access all
          features at no cost.
        </p>
      </section>

      <section className="mb-12 space-y-3 text-neutral/80 leading-relaxed">
        <h2 className="text-xl font-bold text-primary">Who&apos;s behind this</h2>
        <p>
          Ashok Kumar, founder. EB-5 investor and data scientist based in the Seattle area.
          Built EB5 Base because the information investors need was too scattered.
        </p>
        <p>
          <a
            href="https://www.linkedin.com/in/ashokkumar42/"
            target="_blank"
            rel="noopener noreferrer"
            className="link link-secondary"
          >
            LinkedIn profile
          </a>
        </p>
      </section>

      <section className="mb-12">
        <h2 className="text-xl font-bold text-primary mb-4">Questions or feedback?</h2>
        <a href="mailto:hello@eb5base.com" className="btn btn-primary rounded-full">
          hello@eb5base.com
        </a>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold text-primary mb-4">Legal</h2>
        <div className="bg-base-200 rounded-xl p-6">
          <p className="text-sm text-neutral/80 leading-relaxed">{DISCLAIMER}</p>
        </div>
      </section>
    </div>
  );
}

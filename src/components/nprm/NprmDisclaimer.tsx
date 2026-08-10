import { GlossaryText } from '@/components/nprm/GlossaryTerm';
import NprmSectionHeading from '@/components/nprm/NprmSectionHeading';
import { NPRM_DISCLAIMER_PARAS } from '@/lib/nprm/constants';

/** Full disclaimer block for the About tab. */
export default function NprmDisclaimer({ className = '' }: { className?: string }) {
  return (
    <aside
      id="disclaimer"
      className={`scroll-mt-28 rounded-xl border-2 border-neutral/20 bg-base-100 px-4 py-4 sm:px-5 sm:py-5 shadow-soft ${className}`}
    >
      <NprmSectionHeading
        as="h3"
        eyebrow="Disclaimer"
        title="Not legal advice"
        className="mb-3"
      />
      <div className="space-y-3 text-sm text-neutral leading-relaxed">
        {NPRM_DISCLAIMER_PARAS.map((para) => (
          <p key={para.slice(0, 48)}>
            <GlossaryText text={para} />
          </p>
        ))}
      </div>
      <ul className="mt-4 list-disc list-outside pl-5 space-y-2 text-sm text-neutral leading-relaxed">
        <li>
          This page is educational and informational for EB-5 investors commenting
          on Docket USCIS-2026-0100.
        </li>
        <li>
          We do not file comments for you, store your personal story on the server,
          or provide immigration counsel.
        </li>
        <li>
          You alone are responsible for the text you submit on regulations.gov.
        </li>
        <li>
          Consider retaining a short memo with your immigration attorney for your
          file before you submit.
        </li>
      </ul>
    </aside>
  );
}

import { NPRM_DISCLAIMER } from '@/lib/nprm/constants';

/** Full disclaimer block — intended for About tab. */
export default function NprmDisclaimer({ className = '' }: { className?: string }) {
  return (
    <aside
      id="disclaimer"
      className={`scroll-mt-28 rounded-xl border-2 border-neutral/20 bg-base-100 px-4 py-4 sm:px-5 sm:py-5 shadow-soft ${className}`}
    >
      <h3 className="text-base font-bold text-primary mb-2">
        Disclaimer — not legal advice
      </h3>
      <p className="text-sm text-neutral leading-relaxed">{NPRM_DISCLAIMER}</p>
      <ul className="mt-3 space-y-1.5 text-sm text-neutral leading-relaxed">
        <li>
          - This page is educational and informational for EB-5 investors
          commenting on Docket USCIS-2026-0100.
        </li>
        <li>
          - We do not file comments for you, store your personal story on the
          server, or provide immigration counsel.
        </li>
        <li>
          - Consider retaining a short memo with your immigration attorney for
          your file before you submit.
        </li>
      </ul>
    </aside>
  );
}

import Link from 'next/link';
import { DOCKET_URL, FR_HTML } from '@/lib/nprm/config';

/** Trust strip under the nav. Scrolls away with the page (not sticky). */
export default function TrustDisclaimerBar() {
  return (
    <div className="border-b border-amber-200/80 bg-amber-50 text-amber-950">
      <div className="max-w-6xl mx-auto px-4 py-1.5 text-[11px] sm:text-xs leading-snug text-center sm:text-left">
        EB5 Base is not affiliated with USCIS or DHS. Not legal or financial advice. Based on
        public Federal Register documents. Verify on{' '}
        <a
          href={FR_HTML}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold underline underline-offset-2"
        >
          Federal Register
        </a>
        {' / '}
        <a
          href={DOCKET_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold underline underline-offset-2"
        >
          regulations.gov
        </a>
        {' · '}
        <Link href="/disclaimer" className="font-semibold underline underline-offset-2">
          Full disclaimer
        </Link>
        .
      </div>
    </div>
  );
}

import Link from 'next/link';

/** Trust strip under the nav. Scrolls away with the page (not sticky). */
export default function TrustDisclaimerBar() {
  return (
    <div className="border-b border-amber-200/80 bg-amber-50 text-amber-950">
      <div className="max-w-6xl mx-auto px-4 py-1.5 text-[11px] sm:text-xs leading-snug text-center sm:text-left">
        EB5 Base is not affiliated with USCIS, DHS, any law firm, immigration
        firm, or regional center. Nothing on this website constitutes legal or
        financial advice.{' '}
        <Link
          href="/about#disclaimer"
          className="font-semibold underline underline-offset-2"
        >
          Full disclaimer
        </Link>
        .
      </div>
    </div>
  );
}

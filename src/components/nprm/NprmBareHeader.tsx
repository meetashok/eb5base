import Link from 'next/link';
import Logo from '@/components/Logo';

/** Shown when site-wide maintenance hides the global Navbar. */
export default function NprmBareHeader() {
  return (
    <header className="bg-nav-gradient text-primary-content shadow-nav">
      <div className="max-w-6xl mx-auto px-4 min-h-14 flex items-center justify-between gap-3">
        <Link href="/nprm" className="inline-flex items-center gap-2 hover:opacity-90">
          <Logo
            size={32}
            showWordmark
            wordmarkVariant="on-dark"
            wordmarkClassName="text-lg"
          />
          <span className="badge badge-xs rounded-full border border-copper/50 bg-copper/20 text-copper-light font-semibold uppercase tracking-wider px-1.5 min-h-0 h-4 text-[9px]">
            NPRM
          </span>
        </Link>
        <a
          href="https://www.regulations.gov/commenton/USCIS-2026-0100-0001"
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-xs btn-accent text-accent-content"
        >
          File on regulations.gov
        </a>
      </div>
    </header>
  );
}

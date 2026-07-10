import Link from 'next/link';
import { DISCLAIMER } from '@/lib/constants';

export default function Footer() {
  return (
    <footer className="bg-base-200 border-t border-base-300 mt-auto">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <p className="text-meta text-neutral/70 leading-relaxed max-w-4xl">{DISCLAIMER}</p>
        <div className="flex flex-wrap gap-4 mt-6 text-sm">
          <Link href="/about" className="link link-hover text-secondary">
            About
          </Link>
          <Link href="/privacy" className="link link-hover text-secondary">
            Privacy
          </Link>
          <Link href="/contact" className="link link-hover text-secondary">
            Contact
          </Link>
        </div>
        <p className="text-meta text-neutral/50 mt-4">© {new Date().getFullYear()} EB5 Base</p>
      </div>
    </footer>
  );
}

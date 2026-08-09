import Link from 'next/link';
import { DISCLAIMER } from '@/lib/constants';
import Logo from '@/components/Logo';

export default function Footer() {
  return (
    <footer className="border-t border-base-300/80 mt-16 bg-surface-warm">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <p className="text-meta text-neutral/60 leading-relaxed max-w-4xl mb-6">{DISCLAIMER}</p>
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-3 text-sm text-neutral/50">
            <Logo size={28} showWordmark wordmarkVariant="on-light" wordmarkClassName="text-base" />
            <span>© {new Date().getFullYear()} EB5 Base. Built for the EB-5 community.</span>
          </div>
          <div className="flex gap-6 flex-wrap justify-center">
            <Link
              href="/about"
              className="text-sm text-neutral/50 hover:text-primary transition-colors"
            >
              About
            </Link>
            <Link
              href="/terms"
              className="text-sm text-neutral/50 hover:text-primary transition-colors"
            >
              Terms
            </Link>
            <Link
              href="/privacy"
              className="text-sm text-neutral/50 hover:text-primary transition-colors"
            >
              Privacy
            </Link>
            <Link
              href="/contact"
              className="text-sm text-neutral/50 hover:text-primary transition-colors"
            >
              Contact
            </Link>
            <a
              href="mailto:hello@eb5base.com"
              className="text-sm text-neutral/50 hover:text-primary transition-colors"
            >
              hello@eb5base.com
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

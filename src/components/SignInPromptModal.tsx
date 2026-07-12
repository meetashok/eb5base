'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Logo, { BrandWordmark } from '@/components/Logo';

interface SignInPromptModalProps {
  open: boolean;
  onDismiss: () => void;
  onSignIn: () => void;
  title?: string;
  description?: string;
}

const FEATURES = [
  'Add projects and suggest edits',
  'Confirm subscription status',
  'Report duplicates and contribute',
];

function CheckIcon() {
  return (
    <svg
      className="h-4 w-4 text-secondary shrink-0"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      aria-hidden
    >
      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function SignInPromptModal({
  open,
  onDismiss,
  onSignIn,
  title = 'Sign in to continue',
  description = 'Join the community directory for EB-5 projects. Sign in to add listings, confirm status, and help keep data accurate.',
}: SignInPromptModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onDismiss();
    }
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onDismiss]);

  if (!open || !mounted) return null;

  return createPortal(
    <dialog className="modal modal-open z-[100]">
      <div className="modal-box max-w-md p-0 overflow-hidden border border-base-300/70 shadow-lift bg-base-100 rounded-2xl">
        <div className="relative px-6 pt-8 pb-6 text-center page-hero border-b border-base-300/50">
          <div
            className="absolute inset-0 opacity-50 pointer-events-none"
            aria-hidden
            style={{
              background:
                'radial-gradient(ellipse at 50% 0%, rgba(212, 175, 55, 0.18), transparent 65%)',
            }}
          />
          <button
            type="button"
            className="btn btn-ghost btn-sm btn-circle absolute top-3 right-3 z-10 text-neutral/50 hover:text-primary"
            onClick={onDismiss}
            aria-label="Close"
          >
            <CloseIcon />
          </button>
          <Logo size={52} className="justify-center mb-4 relative" />
          <p className="page-hero-eyebrow mb-2 relative">Community</p>
          <h3 className="text-xl font-bold text-primary relative">{title}</h3>
        </div>

        <div className="px-6 py-5 space-y-5">
          <p className="text-sm text-neutral/70 text-center leading-relaxed">{description}</p>

          <ul className="space-y-2.5 panel-copper px-4 py-3.5">
            {FEATURES.map((feature) => (
              <li key={feature} className="flex items-start gap-2.5 text-sm text-neutral/80">
                <CheckIcon />
                <span>{feature}</span>
              </li>
            ))}
          </ul>

          <div className="flex flex-col gap-2">
            <button
              type="button"
              className="btn btn-primary w-full rounded-full shadow-soft"
              onClick={onSignIn}
            >
              Sign in to <BrandWordmark variant="on-dark" className="text-[0.95em] ml-1" />
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-sm rounded-full text-neutral/60"
              onClick={onDismiss}
            >
              Not now
            </button>
          </div>

          <p className="text-xs text-neutral/45 text-center">
            Free · Google sign-in · Takes about a minute
          </p>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop bg-primary/30 backdrop-blur-[2px]">
        <button type="button" onClick={onDismiss} aria-label="Close dialog">
          close
        </button>
      </form>
    </dialog>,
    document.body
  );
}

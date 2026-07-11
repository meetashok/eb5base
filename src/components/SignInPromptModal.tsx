'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface SignInPromptModalProps {
  open: boolean;
  onDismiss: () => void;
  onSignIn: () => void;
  title?: string;
  description?: string;
}

export default function SignInPromptModal({
  open,
  onDismiss,
  onSignIn,
  title = 'Sign in to continue',
  description = 'Sign in to add projects, confirm subscription status, and access community features. It only takes a moment.',
}: SignInPromptModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open || !mounted) return null;

  return createPortal(
    <dialog className="modal modal-open z-[100]">
      <div className="modal-box max-w-sm">
        <h3 className="font-bold text-lg text-primary">{title}</h3>
        <p className="py-2 text-sm text-neutral/70">{description}</p>
        <div className="modal-action mt-2">
          <button type="button" className="btn btn-ghost btn-sm" onClick={onDismiss}>
            Not now
          </button>
          <button type="button" className="btn btn-primary btn-sm" onClick={onSignIn}>
            Sign in
          </button>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop bg-black/50">
        <button type="button" onClick={onDismiss}>
          close
        </button>
      </form>
    </dialog>,
    document.body
  );
}

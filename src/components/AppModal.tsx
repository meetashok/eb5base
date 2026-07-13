'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

type AppModalProps = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  boxClassName?: string;
};

/**
 * DaisyUI modal portaled to document.body so it isn't clipped by overflow-hidden
 * ancestors (e.g. project detail hero cards).
 */
export default function AppModal({ open, onClose, children, boxClassName = '' }: AppModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose]);

  if (!open || !mounted) return null;

  return createPortal(
    <dialog className="modal modal-open z-[100]">
      <div className={`modal-box ${boxClassName}`.trim()}>{children}</div>
      <form method="dialog" className="modal-backdrop bg-primary/30 backdrop-blur-[2px]">
        <button type="button" onClick={onClose} aria-label="Close dialog">
          close
        </button>
      </form>
    </dialog>,
    document.body
  );
}

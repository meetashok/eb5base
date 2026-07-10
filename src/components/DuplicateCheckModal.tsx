'use client';

import Link from 'next/link';

export interface SimilarProject {
  id: string;
  name: string;
  regional_center?: string | null;
  location_state?: string | null;
}

interface DuplicateCheckModalProps {
  open: boolean;
  projects: SimilarProject[];
  title?: string;
  onClose: () => void;
  onProceed: () => void;
}

export default function DuplicateCheckModal({
  open,
  projects,
  title = 'We found similar projects',
  onClose,
  onProceed,
}: DuplicateCheckModalProps) {
  if (!open) return null;

  return (
    <dialog className="modal modal-open">
      <div className="modal-box">
        <h3 className="font-bold text-lg text-primary">{title}</h3>
        <p className="py-2 text-sm text-neutral/70">
          Please check whether your project is already listed before submitting.
        </p>
        <ul className="space-y-2 my-4">
          {projects.map((p) => (
            <li
              key={p.id}
              className="flex items-center justify-between gap-3 p-3 border border-base-300 rounded-lg"
            >
              <div>
                <p className="font-medium">{p.name}</p>
                <p className="text-meta text-neutral/60">
                  {[p.regional_center, p.location_state].filter(Boolean).join(' · ')}
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <Link href={`/projects/${p.id}`} className="btn btn-ghost btn-sm">
                  View
                </Link>
                <Link href={`/projects/${p.id}`} className="btn btn-outline btn-sm">
                  This is a duplicate
                </Link>
              </div>
            </li>
          ))}
        </ul>
        <div className="modal-action">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn btn-primary" onClick={onProceed}>
            None of these are mine — submit
          </button>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button type="button" onClick={onClose}>
          close
        </button>
      </form>
    </dialog>
  );
}

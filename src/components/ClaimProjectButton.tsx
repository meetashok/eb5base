'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { useToast } from '@/components/Toast';
import type { Project } from '@/lib/types';

interface ClaimProjectButtonProps {
  project: Pick<Project, 'id' | 'name' | 'claimed_by' | 'rc_verified_at'>;
  userId: string;
  canClaim: boolean;
}

export default function ClaimProjectButton({
  project,
  userId,
  canClaim,
}: ClaimProjectButtonProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [saving, setSaving] = useState(false);

  if (!canClaim) return null;
  if (project.rc_verified_at) return null;

  async function handleClaim() {
    if (!confirmed) return;
    setSaving(true);
    const supabase = createClient();
    const now = new Date().toISOString();
    const { error } = await supabase
      .from('projects')
      .update({
        claimed_by: userId,
        claimed_at: now,
        rc_verified_at: now,
        rc_verified_by: userId,
      })
      .eq('id', project.id);

    setSaving(false);
    if (error) {
      toast(error.message, 'error');
      return;
    }
    toast('Project verified and published with RC verified badge.', 'success');
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <button
        type="button"
        className="btn btn-secondary btn-sm rounded-full"
        onClick={() => setOpen(true)}
      >
        {project.claimed_by ? 'Confirm details' : 'Claim & verify'}
      </button>

      {open && (
        <dialog className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg text-primary">Claim project</h3>
            <p className="text-sm text-neutral/70 py-2">
              Review <strong>{project.name}</strong> and confirm the listing details are accurate.
              Once you claim this project, <strong>only verified representatives of this regional center</strong>{' '}
              can edit the listing — please keep the project details accurate and up to date at all times.
              This project will show an <strong>RC verified</strong> badge on browse and detail pages.
            </p>
            <label className="flex items-start gap-2 cursor-pointer mt-4">
              <input
                type="checkbox"
                className="checkbox checkbox-sm checkbox-secondary mt-0.5"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
              />
              <span className="text-sm text-neutral/80">
                I confirm I represent this regional center and the project details are accurate.
              </span>
            </label>
            <div className="modal-action">
              <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                disabled={!confirmed || saving}
                onClick={handleClaim}
              >
                {saving ? 'Saving…' : 'Publish as RC verified'}
              </button>
            </div>
          </div>
          <form method="dialog" className="modal-backdrop">
            <button type="button" onClick={() => setOpen(false)}>
              close
            </button>
          </form>
        </dialog>
      )}
    </>
  );
}

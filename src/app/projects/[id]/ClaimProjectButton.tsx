'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';

interface ClaimProjectButtonProps {
  projectId: string;
  userId: string | null;
}

export default function ClaimProjectButton({ projectId, userId }: ClaimProjectButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function claim() {
    if (!userId) {
      window.location.href = `/login?redirect=/projects/${projectId}`;
      return;
    }
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error: err } = await supabase
      .from('projects')
      .update({ claimed_by: userId })
      .eq('id', projectId)
      .is('claimed_by', null);
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        className="btn btn-outline btn-sm transition-all duration-150"
        onClick={claim}
        disabled={loading}
      >
        {loading ? 'Claiming…' : 'Claim this project'}
      </button>
      {error && <p className="text-meta text-error">{error}</p>}
    </div>
  );
}

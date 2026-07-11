'use client';

import { useCallback, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { timeAgo } from '@/lib/utils';

interface ConfirmStatusButtonsProps {
  projectId: string;
  confirmationCount?: number;
  size?: 'sm' | 'md';
  showCount?: boolean;
  onConfirmed?: () => void;
}

export default function ConfirmStatusButtons({
  projectId,
  confirmationCount = 0,
  size = 'sm',
  showCount = true,
  onConfirmed,
}: ConfirmStatusButtonsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [rateLimited, setRateLimited] = useState(false);
  const [lastStatus, setLastStatus] = useState<string | null>(null);
  const [lastAt, setLastAt] = useState<string | null>(null);
  const [pendingStatus, setPendingStatus] = useState<'open' | 'closed' | null>(null);
  const [askInvested, setAskInvested] = useState(false);
  const [showDate, setShowDate] = useState(false);
  const [investmentDate, setInvestmentDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [thanks, setThanks] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localCount, setLocalCount] = useState(confirmationCount);

  useEffect(() => {
    setLocalCount(confirmationCount);
  }, [confirmationCount]);

  const refreshUserState = useCallback(async () => {
    const supabase = createClient();
    const { data: auth } = await supabase.auth.getUser();
    const uid = auth.user?.id ?? null;
    setUserId(uid);

    if (!uid) {
      setLoading(false);
      return;
    }

    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const [{ count }, { data: last }] = await Promise.all([
      supabase
        .from('project_votes')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', projectId)
        .eq('user_id', uid)
        .gte('created_at', start.toISOString()),
      supabase
        .from('project_votes')
        .select('subscription_status, created_at')
        .eq('project_id', projectId)
        .eq('user_id', uid)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    setRateLimited((count || 0) >= 2);
    if (last) {
      setLastStatus(last.subscription_status);
      setLastAt(last.created_at);
    }
    setLoading(false);
  }, [projectId]);

  useEffect(() => {
    refreshUserState();
  }, [refreshUserState]);

  function requireAuth() {
    const redirect = pathname || '/projects';
    router.push(`/login?redirect=${encodeURIComponent(redirect)}`);
  }

  function chooseStatus(status: 'open' | 'closed') {
    setError(null);
    if (!userId) {
      requireAuth();
      return;
    }
    if (rateLimited) return;
    setPendingStatus(status);
    setAskInvested(true);
    setShowDate(false);
    setInvestmentDate('');
  }

  async function insertConfirmation(invested: boolean, date?: string) {
    if (!userId || !pendingStatus) return;
    setSaving(true);
    setError(null);
    const supabase = createClient();

    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const { count } = await supabase
      .from('project_votes')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', projectId)
      .eq('user_id', userId)
      .gte('created_at', start.toISOString());

    if ((count || 0) >= 2) {
      setRateLimited(true);
      setAskInvested(false);
      setPendingStatus(null);
      setSaving(false);
      setError("You've already confirmed today. Come back tomorrow.");
      return;
    }

    const { error: insertError } = await supabase.from('project_votes').insert({
      project_id: projectId,
      user_id: userId,
      subscription_status: pendingStatus,
      invested,
      investment_date: invested && date ? date : null,
    });

    setSaving(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }

    setLocalCount((c) => c + 1);
    setLastStatus(pendingStatus);
    setLastAt(new Date().toISOString());
    setAskInvested(false);
    setShowDate(false);
    setPendingStatus(null);
    setThanks(true);
    setTimeout(() => setThanks(false), 2000);
    await refreshUserState();
    onConfirmed?.();
  }

  const btnSize = size === 'md' ? 'btn' : 'btn-sm';
  const iconSize = size === 'md' ? 'w-5 h-5' : 'w-4 h-4';

  if (loading) {
    return <div className="skeleton-shimmer h-16 w-full mt-3" />;
  }

  return (
    <div
      className="border-t border-base-200 pt-3 mt-3"
      onClick={(e) => e.preventDefault()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      {rateLimited ? (
        <p className="text-xs text-neutral/50">
          You&apos;ve confirmed this project&apos;s status today. Come back tomorrow.
        </p>
      ) : (
        <>
          <p className={`text-neutral/50 mb-2 ${size === 'md' ? 'text-sm text-neutral/60 mb-3' : 'text-xs'}`}>
            Is this project open for subscriptions?
          </p>
          <div className={`flex ${size === 'md' ? 'gap-3' : 'gap-2'}`}>
            <button
              type="button"
              className={`${btnSize} btn-outline btn-success flex-1 gap-1 rounded-full transition-all duration-150 ${
                pendingStatus === 'open' ? 'btn-success text-white' : ''
              }`}
              onClick={() => chooseStatus('open')}
              disabled={saving}
            >
              <svg className={iconSize} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Open
            </button>
            <button
              type="button"
              className={`${btnSize} btn-outline btn-error flex-1 gap-1 rounded-full transition-all duration-150 ${
                pendingStatus === 'closed' ? 'btn-error text-white' : ''
              }`}
              onClick={() => chooseStatus('closed')}
              disabled={saving}
            >
              <svg className={iconSize} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Closed
            </button>
          </div>
        </>
      )}

      {!userId && !rateLimited && (
        <p className="text-xs text-neutral/40 mt-2 text-center">
          <button type="button" className="link link-secondary" onClick={requireAuth}>
            Sign in to confirm status
          </button>
        </p>
      )}

      {askInvested && (
        <div className="mt-2 p-2 bg-base-200 rounded-lg text-sm">
          {!showDate ? (
            <>
              <p className="text-neutral/70">Did you invest in this project?</p>
              <div className="flex gap-2 mt-1">
                <button
                  type="button"
                  className="btn btn-xs btn-ghost"
                  disabled={saving}
                  onClick={() => setShowDate(true)}
                >
                  Yes
                </button>
                <button
                  type="button"
                  className="btn btn-xs btn-ghost"
                  disabled={saving}
                  onClick={() => insertConfirmation(false)}
                >
                  No
                </button>
                <button
                  type="button"
                  className="btn btn-xs btn-ghost ml-auto"
                  onClick={() => {
                    setAskInvested(false);
                    setPendingStatus(null);
                  }}
                >
                  Cancel
                </button>
              </div>
            </>
          ) : (
            <div className="space-y-2">
              <label className="form-control">
                <span className="label-text text-xs mb-1">Investment date</span>
                <input
                  type="date"
                  className="input input-bordered input-sm"
                  value={investmentDate}
                  onChange={(e) => setInvestmentDate(e.target.value)}
                />
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="btn btn-xs btn-primary"
                  disabled={saving || !investmentDate}
                  onClick={() => insertConfirmation(true, investmentDate)}
                >
                  {saving ? 'Saving…' : 'Confirm'}
                </button>
                <button
                  type="button"
                  className="btn btn-xs btn-ghost"
                  onClick={() => setShowDate(false)}
                >
                  Back
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {thanks && (
        <div className="text-center mt-2">
          <p className="text-xs text-success font-medium">Thanks!</p>
          <p className="text-xs text-neutral/50 mt-1">
            <a href="/projects/new" className="link link-primary">
              Know another project?
            </a>
          </p>
        </div>
      )}
      {error && <p className="text-xs text-error mt-2">{error}</p>}

      {showCount && localCount > 0 && (
        <p className="text-xs text-neutral/40 mt-2 text-center">
          {localCount} confirmation{localCount !== 1 ? 's' : ''}
        </p>
      )}

      {lastStatus && lastAt && (
        <p className="text-xs text-neutral/40 mt-1 text-center">
          You last confirmed: {lastStatus === 'open' ? 'Open' : 'Closed'}, {timeAgo(lastAt)}
        </p>
      )}
    </div>
  );
}

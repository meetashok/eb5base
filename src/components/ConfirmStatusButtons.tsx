'use client';

import { useCallback, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { timeAgo } from '@/lib/utils';
import SignInPromptModal from './SignInPromptModal';

interface ConfirmStatusButtonsProps {
  projectId: string;
  confirmationCount?: number;
  size?: 'sm' | 'md';
  compact?: boolean;
  showCount?: boolean;
  onConfirmed?: () => void;
}

export default function ConfirmStatusButtons({
  projectId,
  confirmationCount = 0,
  size = 'sm',
  compact = false,
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
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);

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

  function goToLogin() {
    const redirect = pathname || '/projects';
    router.push(`/login?redirect=${encodeURIComponent(redirect)}`);
  }

  function promptSignIn() {
    setShowAuthPrompt(true);
  }

  function chooseStatus(status: 'open' | 'closed') {
    setError(null);
    if (!userId) {
      setPendingStatus(status);
      promptSignIn();
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

  const effectiveSize = compact ? 'sm' : size;
  const iconBox = compact ? 'w-2.5 h-2.5' : effectiveSize === 'md' ? 'w-3.5 h-3.5' : 'w-3 h-3';

  if (loading) {
    return (
      <div
        className={
          compact ? 'skeleton-shimmer h-8 w-full mt-1' : 'skeleton-shimmer h-16 w-full mt-3'
        }
      />
    );
  }

  const openBtnClass = compact
    ? `h-6 min-h-0 px-2 text-[10px] font-medium gap-1 rounded-md border border-secondary/40 text-secondary hover:bg-secondary/10 inline-flex items-center justify-center transition-colors ${
        pendingStatus === 'open' && userId ? 'bg-secondary/15 border-secondary' : ''
      }`
    : `btn btn-sm btn-outline border-secondary text-secondary hover:bg-secondary hover:text-secondary-content gap-1.5 rounded-lg inline-flex items-center justify-center ${
        pendingStatus === 'open' && userId ? 'bg-secondary text-secondary-content border-secondary' : ''
      }`;

  const closedBtnClass = compact
    ? `h-6 min-h-0 px-2 text-[10px] font-medium gap-1 rounded-md border border-error/40 text-error hover:bg-error/10 inline-flex items-center justify-center transition-colors ${
        pendingStatus === 'closed' && userId ? 'bg-error/15 border-error' : ''
      }`
    : `btn btn-sm btn-outline border-error/60 text-error hover:bg-error hover:text-white gap-1.5 rounded-lg inline-flex items-center justify-center ${
        pendingStatus === 'closed' && userId ? 'bg-error text-white border-error' : ''
      }`;

  return (
    <>
      <div
        className={compact ? 'border-t border-base-200/70 pt-2 mt-1' : 'border-t border-base-200 pt-3 mt-3'}
        onClick={(e) => e.preventDefault()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        {rateLimited ? (
          <p className="text-[10px] text-neutral/50">
            You&apos;ve confirmed this project&apos;s status today. Come back tomorrow.
          </p>
        ) : (
          <div className={compact ? 'space-y-1' : 'space-y-2'}>
            <p
              className={
                compact
                  ? 'text-[10px] text-neutral/50 leading-tight'
                  : 'text-sm text-neutral/60'
              }
            >
              {compact ? 'Open for subscriptions?' : 'Is this project open for subscriptions?'}
            </p>
            <div className={`flex ${compact ? 'gap-1' : 'gap-2'}`}>
              <button
                type="button"
                className={openBtnClass}
                onClick={() => chooseStatus('open')}
                disabled={saving}
              >
                <span className={`${iconBox} inline-flex items-center justify-center shrink-0`}>
                  <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </span>
                <span>Open</span>
              </button>
              <button
                type="button"
                className={closedBtnClass}
                onClick={() => chooseStatus('closed')}
                disabled={saving}
              >
                <span className={`${iconBox} inline-flex items-center justify-center shrink-0`}>
                  <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </span>
                <span>Closed</span>
              </button>
            </div>
          </div>
        )}

        {!userId && !rateLimited && !compact && (
          <p className="text-xs text-neutral/50 mt-2 text-center">
            <button type="button" className="link link-secondary" onClick={promptSignIn}>
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
              <a href="/projects/add" className="link link-primary">
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
          <p className="text-[10px] text-neutral/40 mt-1 text-center">
            You last confirmed: {lastStatus === 'open' ? 'Open' : 'Closed'}, {timeAgo(lastAt)}
          </p>
        )}
      </div>

      <SignInPromptModal
        open={showAuthPrompt}
        onDismiss={() => {
          setShowAuthPrompt(false);
          setPendingStatus(null);
        }}
        onSignIn={goToLogin}
      />
    </>
  );
}

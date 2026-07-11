'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { timeAgo } from '@/lib/utils';
import { AddProjectLink } from './AuthGatedLinks';
import { useAuthPrompt } from './AuthPromptProvider';

const REPROMPT_DAYS = 3;
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const DAILY_LIMIT = 1;

interface ConfirmStatusButtonsProps {
  projectId: string;
  projectHref?: string;
  confirmationCount?: number;
  size?: 'sm' | 'md';
  variant?: 'card' | 'detail';
  /** @deprecated use variant="card" */
  compact?: boolean;
  showCount?: boolean;
  onConfirmed?: () => void;
}

function daysSince(date: string): number {
  return (Date.now() - new Date(date).getTime()) / MS_PER_DAY;
}

function statusLabel(status: string): string {
  return status === 'open' ? 'Open' : 'Closed';
}

export default function ConfirmStatusButtons({
  projectId,
  projectHref,
  confirmationCount = 0,
  size = 'sm',
  variant: variantProp,
  compact = false,
  showCount = true,
  onConfirmed,
}: ConfirmStatusButtonsProps) {
  const variant = variantProp ?? (compact ? 'card' : 'detail');
  const isCard = variant === 'card';
  const { promptSignIn } = useAuthPrompt();
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [rateLimited, setRateLimited] = useState(false);
  const [lastStatus, setLastStatus] = useState<string | null>(null);
  const [lastAt, setLastAt] = useState<string | null>(null);
  const [pendingStatus, setPendingStatus] = useState<'open' | 'closed' | null>(null);
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

    setRateLimited((count || 0) >= DAILY_LIMIT);
    if (last) {
      setLastStatus(last.subscription_status);
      setLastAt(last.created_at);
    } else {
      setLastStatus(null);
      setLastAt(null);
    }
    setLoading(false);
  }, [projectId]);

  useEffect(() => {
    refreshUserState();
  }, [refreshUserState]);

  async function insertConfirmation(
    status: 'open' | 'closed',
    options?: { bypassDailyLimit?: boolean }
  ) {
    if (!userId) return;
    setSaving(true);
    setError(null);
    const supabase = createClient();

    if (!options?.bypassDailyLimit) {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const { count } = await supabase
        .from('project_votes')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', projectId)
        .eq('user_id', userId)
        .gte('created_at', start.toISOString());

      if ((count || 0) >= DAILY_LIMIT) {
        setRateLimited(true);
        setPendingStatus(null);
        setSaving(false);
        setError(
          isCard
            ? "You've already confirmed today. Come back tomorrow or change it on the project page."
            : "You've already confirmed today. Come back tomorrow."
        );
        return;
      }
    }

    const { error: insertError } = await supabase.from('project_votes').insert({
      project_id: projectId,
      user_id: userId,
      subscription_status: status,
      invested: false,
      investment_date: null,
    });

    setSaving(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }

    setLocalCount((c) => c + 1);
    setLastStatus(status);
    setLastAt(new Date().toISOString());
    setPendingStatus(null);
    setThanks(true);
    await refreshUserState();
    onConfirmed?.();
  }

  function chooseStatus(status: 'open' | 'closed') {
    setError(null);
    if (!userId) {
      setPendingStatus(status);
      promptSignIn();
      return;
    }
    if (rateLimited) return;
    void insertConfirmation(status);
  }

  function handleReprompt(confirmed: boolean) {
    if (!lastStatus || (lastStatus !== 'open' && lastStatus !== 'closed')) return;
    const prior = lastStatus as 'open' | 'closed';
    const next = confirmed ? prior : prior === 'open' ? 'closed' : 'open';
    void insertConfirmation(next, { bypassDailyLimit: true });
  }

  const effectiveSize = isCard ? 'sm' : size;
  const iconBox = isCard ? 'w-2.5 h-2.5' : effectiveSize === 'md' ? 'w-3.5 h-3.5' : 'w-3 h-3';

  if (loading) {
    return (
      <div
        className={
          isCard ? 'skeleton-shimmer h-8 w-full mt-1' : 'skeleton-shimmer h-16 w-full mt-3'
        }
      />
    );
  }

  const needsReprompt =
    isCard && userId && lastStatus && lastAt && daysSince(lastAt) >= REPROMPT_DAYS;

  const showThanks =
    userId &&
    lastStatus &&
    lastAt &&
    thanks &&
    (isCard ? daysSince(lastAt) < REPROMPT_DAYS && !needsReprompt : true);

  const showCardThanks = isCard && showThanks;

  const showDetailThanks = !isCard && showThanks && !rateLimited;

  const openBtnClass = isCard
    ? `h-6 min-h-0 px-2 text-[10px] font-medium gap-1 rounded-md border border-secondary/40 text-secondary hover:bg-secondary/10 inline-flex items-center justify-center transition-colors ${
        pendingStatus === 'open' && userId ? 'bg-secondary/15 border-secondary' : ''
      }`
    : `btn btn-sm btn-outline border-secondary text-secondary hover:bg-secondary hover:text-secondary-content gap-1.5 rounded-lg inline-flex items-center justify-center ${
        pendingStatus === 'open' && userId ? 'bg-secondary text-secondary-content border-secondary' : ''
      }`;

  const closedBtnClass = isCard
    ? `h-6 min-h-0 px-2 text-[10px] font-medium gap-1 rounded-md border border-error/40 text-error hover:bg-error/10 inline-flex items-center justify-center transition-colors ${
        pendingStatus === 'closed' && userId ? 'bg-error/15 border-error' : ''
      }`
    : `btn btn-sm btn-outline border-error/60 text-error hover:bg-error hover:text-white gap-1.5 rounded-lg inline-flex items-center justify-center ${
        pendingStatus === 'closed' && userId ? 'bg-error text-white border-error' : ''
      }`;

  const repromptLabel = lastStatus === 'open' ? 'open' : 'closed';

  return (
    <div
      className={isCard ? 'border-t border-base-200/70 pt-2 mt-1' : 'border-t border-base-200 pt-3 mt-3'}
      onClick={(e) => e.preventDefault()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      {showCardThanks ? (
        <div className="space-y-1">
          <p className="text-[10px] text-success font-medium">Thank you for confirming.</p>
          {projectHref && (
            <Link href={projectHref} className="text-[10px] link link-secondary">
              Change your confirmation
            </Link>
          )}
        </div>
      ) : showDetailThanks ? (
        <div className="space-y-1 text-center">
          <p className="text-sm text-success font-medium">Thank you for confirming.</p>
          <p className="text-xs text-neutral/50">
            <AddProjectLink className="link link-primary">Know another project?</AddProjectLink>
          </p>
        </div>
      ) : needsReprompt ? (
        <div className="space-y-1">
          <p className="text-[10px] text-neutral/60 leading-snug">
            You confirmed {timeAgo(lastAt!)} that it&apos;s {statusLabel(lastStatus!)}. Is it still{' '}
            {repromptLabel}?
          </p>
          <div className="flex gap-1">
            <button
              type="button"
              className="h-6 min-h-0 px-2 text-[10px] font-medium rounded-md border border-secondary/40 text-secondary hover:bg-secondary/10"
              disabled={saving}
              onClick={() => handleReprompt(true)}
            >
              Yes
            </button>
            <button
              type="button"
              className="h-6 min-h-0 px-2 text-[10px] font-medium rounded-md border border-base-300 text-neutral/70 hover:bg-base-200"
              disabled={saving}
              onClick={() => handleReprompt(false)}
            >
              No
            </button>
          </div>
        </div>
      ) : rateLimited ? (
        <p className={isCard ? 'text-[10px] text-neutral/50' : 'text-xs text-neutral/50'}>
          You&apos;ve confirmed this project&apos;s status today. Come back tomorrow.
          {isCard && projectHref && (
            <>
              {' '}
              <Link href={projectHref} className="link link-secondary">
                Change on project page
              </Link>
            </>
          )}
        </p>
      ) : (
        <div className={isCard ? 'space-y-1' : 'space-y-2'}>
          <p
            className={
              isCard ? 'text-[10px] text-neutral/50 leading-tight' : 'text-sm text-neutral/60'
            }
          >
            {isCard ? 'Open for subscriptions?' : 'Is this project open for subscriptions?'}
          </p>
          <div className={`flex ${isCard ? 'gap-1' : 'gap-2'}`}>
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

      {!userId && !rateLimited && !showDetailThanks && !isCard && (
        <p className="text-xs text-neutral/50 mt-2 text-center">
          <button type="button" className="link link-secondary" onClick={() => promptSignIn()}>
            Sign in to continue
          </button>
        </p>
      )}

      {error && <p className="text-xs text-error mt-2">{error}</p>}

      {showCount && localCount > 0 && !isCard && !showDetailThanks && (
        <p className="text-xs text-neutral/40 mt-2 text-center">
          {localCount} confirmation{localCount !== 1 ? 's' : ''}
        </p>
      )}

      {lastStatus && lastAt && !isCard && !showDetailThanks && (
        <p className="text-[10px] text-neutral/40 mt-1 text-center">
          You last confirmed: {statusLabel(lastStatus)}, {timeAgo(lastAt)}
        </p>
      )}
    </div>
  );
}

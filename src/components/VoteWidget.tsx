'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import type { VoteWithProfile } from '@/lib/types';
import { formatDate, timeAgo } from '@/lib/utils';

interface VoteWidgetProps {
  projectId: string;
}

interface Consensus {
  open: number;
  closed: number;
  total: number;
}

export default function VoteWidget({ projectId }: VoteWidgetProps) {
  const [userId, setUserId] = useState<string | null>(null);
  const [consensus, setConsensus] = useState<Consensus>({ open: 0, closed: 0, total: 0 });
  const [recent, setRecent] = useState<VoteWithProfile[]>([]);
  const [investorCount, setInvestorCount] = useState(0);
  const [casting, setCasting] = useState(false);
  const [showInvestModal, setShowInvestModal] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<'open' | 'closed' | null>(null);
  const [invested, setInvested] = useState(false);
  const [investmentDate, setInvestmentDate] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const supabase = createClient();
    const since = new Date();
    since.setDate(since.getDate() - 30);

    const [{ data: votes30 }, { data: recentVotes }, { count }, { data: auth }] =
      await Promise.all([
        supabase
          .from('project_votes')
          .select('subscription_status')
          .eq('project_id', projectId)
          .gte('created_at', since.toISOString()),
        supabase
          .from('project_votes')
          .select('*, profiles:user_id(display_name, avatar_url)')
          .eq('project_id', projectId)
          .order('created_at', { ascending: false })
          .limit(10),
        supabase
          .from('project_votes')
          .select('*', { count: 'exact', head: true })
          .eq('project_id', projectId)
          .eq('invested', true),
        supabase.auth.getUser(),
      ]);

    const open = (votes30 || []).filter((v) => v.subscription_status === 'open').length;
    const closed = (votes30 || []).filter((v) => v.subscription_status === 'closed').length;
    setConsensus({ open, closed, total: open + closed });
    setRecent((recentVotes as VoteWithProfile[]) || []);
    setInvestorCount(count || 0);
    setUserId(auth.user?.id ?? null);
    setLoading(false);
  }, [projectId]);

  useEffect(() => {
    load();
  }, [load]);

  async function checkRateLimit(uid: string): Promise<boolean> {
    const supabase = createClient();
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const { count } = await supabase
      .from('project_votes')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', projectId)
      .eq('user_id', uid)
      .gte('created_at', start.toISOString());
    return (count || 0) >= 2;
  }

  async function startVote() {
    setError(null);
    if (!userId) {
      window.location.href = `/login?redirect=/projects/${projectId}`;
      return;
    }
    const limited = await checkRateLimit(userId);
    if (limited) {
      setError("You've already voted today. Come back tomorrow.");
      return;
    }
    setCasting(true);
  }

  function chooseStatus(status: 'open' | 'closed') {
    setPendingStatus(status);
    setShowInvestModal(true);
  }

  async function submitVote() {
    if (!userId || !pendingStatus) return;
    setSaving(true);
    setError(null);
    const supabase = createClient();

    const limited = await checkRateLimit(userId);
    if (limited) {
      setError("You've already voted today. Come back tomorrow.");
      setSaving(false);
      setShowInvestModal(false);
      setCasting(false);
      return;
    }

    const { error: insertError } = await supabase.from('project_votes').insert({
      project_id: projectId,
      user_id: userId,
      subscription_status: pendingStatus,
      invested,
      investment_date: invested && investmentDate ? investmentDate : null,
    });

    if (insertError) {
      setError(insertError.message);
      setSaving(false);
      return;
    }

    setShowInvestModal(false);
    setCasting(false);
    setPendingStatus(null);
    setInvested(false);
    setInvestmentDate('');
    setSaving(false);
    await load();
  }

  const majority =
    consensus.total === 0
      ? null
      : consensus.open >= consensus.closed
        ? 'Open'
        : 'Closed';
  const majorityCount =
    majority === 'Open' ? consensus.open : majority === 'Closed' ? consensus.closed : 0;
  const openPct = consensus.total ? Math.round((consensus.open / consensus.total) * 100) : 0;

  if (loading) {
    return (
      <section className="bg-base-200/50 rounded-xl p-6 space-y-3">
        <div className="skeleton-shimmer h-6 w-2/3" />
        <div className="skeleton-shimmer h-16 w-full" />
        <div className="skeleton-shimmer h-10 w-40" />
      </section>
    );
  }

  return (
    <section className="bg-base-200/50 rounded-xl p-4 md:p-6 space-y-5">
      <h2 className="text-lg font-bold text-primary">
        Is this project still accepting subscriptions?
      </h2>

      <div className="bg-base-200 rounded-lg p-4">
        {consensus.total === 0 ? (
          <p className="text-sm text-neutral/70">No votes in the last 30 days yet.</p>
        ) : (
          <>
            <p className="text-sm font-medium">
              {majorityCount} of {consensus.total} votes in the last 30 days say {majority}
            </p>
            <div className="mt-3 h-3 rounded-full bg-base-300 overflow-hidden flex">
              <div className="bg-success h-full" style={{ width: `${openPct}%` }} />
              <div className="bg-error h-full" style={{ width: `${100 - openPct}%` }} />
            </div>
            <div className="flex justify-between text-meta mt-1 text-neutral/60">
              <span>Open {openPct}%</span>
              <span>Closed {100 - openPct}%</span>
            </div>
          </>
        )}
      </div>

      {recent.length > 0 && (
        <div>
          <h3 className="font-medium mb-2 text-sm">Recent votes</h3>
          <ul className="space-y-2">
            {recent.map((v) => (
              <li key={v.id} className="text-sm text-neutral/80">
                <span className="font-medium">
                  {v.profiles?.display_name || 'Anonymous'}
                </span>{' '}
                voted{' '}
                <span className="capitalize font-medium">
                  {v.subscription_status === 'open' ? 'Open' : 'Closed'}
                </span>{' '}
                — {formatDate(v.created_at)}
                <span className="text-meta text-neutral/50 ml-1">({timeAgo(v.created_at)})</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {error && <p className="text-error text-sm">{error}</p>}

      {!casting ? (
        userId ? (
          <button
            type="button"
            className="btn btn-primary transition-all duration-150"
            onClick={startVote}
          >
            Cast your vote
          </button>
        ) : (
          <Link
            href={`/login?redirect=/projects/${projectId}`}
            className="btn btn-primary transition-all duration-150"
          >
            Sign in to vote
          </Link>
        )
      ) : (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="btn btn-success transition-all duration-150"
            onClick={() => chooseStatus('open')}
          >
            Still Open
          </button>
          <button
            type="button"
            className="btn btn-error transition-all duration-150"
            onClick={() => chooseStatus('closed')}
          >
            Closed
          </button>
          <button
            type="button"
            className="btn btn-ghost transition-all duration-150"
            onClick={() => setCasting(false)}
          >
            Cancel
          </button>
        </div>
      )}

      <p className="text-sm text-neutral/70">
        {investorCount} investor{investorCount === 1 ? '' : 's'} have reported investing in this
        project
      </p>

      {showInvestModal && (
        <dialog className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg text-primary">Did you invest in this project?</h3>
            <div className="py-4 space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="invested"
                  className="radio radio-primary"
                  checked={!invested}
                  onChange={() => setInvested(false)}
                />
                <span>No</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="invested"
                  className="radio radio-primary"
                  checked={invested}
                  onChange={() => setInvested(true)}
                />
                <span>Yes</span>
              </label>
              {invested && (
                <label className="form-control w-full">
                  <span className="label-text mb-1">Investment date</span>
                  <input
                    type="date"
                    className="input input-bordered"
                    value={investmentDate}
                    onChange={(e) => setInvestmentDate(e.target.value)}
                  />
                </label>
              )}
            </div>
            <div className="modal-action">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => {
                  setShowInvestModal(false);
                  setPendingStatus(null);
                }}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={submitVote}
                disabled={saving || (invested && !investmentDate)}
              >
                {saving ? 'Saving…' : 'Submit vote'}
              </button>
            </div>
          </div>
          <form method="dialog" className="modal-backdrop">
            <button
              type="button"
              onClick={() => {
                setShowInvestModal(false);
                setPendingStatus(null);
              }}
            >
              close
            </button>
          </form>
        </dialog>
      )}
    </section>
  );
}

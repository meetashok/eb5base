'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import ConfirmStatusButtons from './ConfirmStatusButtons';

interface ConfirmationWidgetProps {
  projectId: string;
}

interface Consensus {
  open: number;
  closed: number;
  total: number;
}

export default function ConfirmationWidget({ projectId }: ConfirmationWidgetProps) {
  const [consensus, setConsensus] = useState<Consensus>({ open: 0, closed: 0, total: 0 });
  const [investorCount, setInvestorCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const supabase = createClient();
    const since = new Date();
    since.setDate(since.getDate() - 30);

    const [{ data: votes30 }, { count }] = await Promise.all([
      supabase
        .from('project_votes')
        .select('subscription_status')
        .eq('project_id', projectId)
        .gte('created_at', since.toISOString()),
      supabase
        .from('project_votes')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', projectId)
        .eq('invested', true),
    ]);

    const open = (votes30 || []).filter((v) => v.subscription_status === 'open').length;
    const closed = (votes30 || []).filter((v) => v.subscription_status === 'closed').length;
    setConsensus({ open, closed, total: open + closed });
    setInvestorCount(count || 0);
    setLoading(false);
  }, [projectId]);

  useEffect(() => {
    load();
  }, [load]);

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
      <section className="card-elevated p-6 space-y-3">
        <div className="skeleton-shimmer h-6 w-2/3" />
        <div className="skeleton-shimmer h-16 w-full" />
        <div className="skeleton-shimmer h-10 w-40" />
      </section>
    );
  }

  return (
    <section className="card-elevated overflow-hidden">
      <div className="widget-header">
        <h2 className="text-lg font-bold">Subscription Status</h2>
        <p className="text-sm text-primary-content/70 mt-0.5">Community confirmations (last 30 days)</p>
      </div>
      <div className="p-4 md:p-6">
        <div className="mb-4">
          {consensus.total === 0 ? (
            <p className="text-sm text-neutral/70 mb-2">
              No confirmations in the last 30 days yet.
            </p>
          ) : (
            <p className="text-sm text-neutral/70 mb-2">
              {majorityCount} of {consensus.total} confirmations in the last 30 days say{' '}
              <strong className="text-secondary">{majority}</strong>
            </p>
          )}
          <div className="w-full bg-base-300 rounded-full h-3 overflow-hidden shadow-inner">
            <div
              className="bg-gradient-to-r from-secondary to-secondary/80 h-full rounded-full transition-all duration-300"
              style={{ width: `${openPct}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-neutral/50 mt-1">
            <span>Open ({consensus.open})</span>
            <span>Closed ({consensus.closed})</span>
          </div>
        </div>

        <ConfirmStatusButtons
          projectId={projectId}
          confirmationCount={consensus.total}
          size="md"
          showCount={false}
          onConfirmed={load}
        />

        <p className="text-sm text-neutral/50 mt-4 panel-copper px-3 py-2">
          {investorCount} investor{investorCount !== 1 ? 's' : ''} have reported investing in this
          project
        </p>
      </div>
    </section>
  );
}

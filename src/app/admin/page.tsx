'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { useToast } from '@/components/Toast';
import { brandPath, projectPath } from '@/lib/slugs';
import { statusBadgeClass, statusLabel } from '@/lib/approvals';
import type { ContentSubmission, ModerationStatus } from '@/lib/types';
import { formatDate } from '@/lib/utils';

interface QueueItem extends ContentSubmission {
  title: string;
  submitter_name: string | null;
}

export default function AdminApprovalsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<QueueItem[]>([]);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [acting, setActing] = useState(false);

  async function loadQueue() {
    const supabase = createClient();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      router.replace('/login?redirect=/admin');
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', auth.user.id)
      .maybeSingle();

    if (!profile?.is_admin) {
      setLoading(false);
      router.replace('/profile');
      return;
    }

    const { data: subs, error } = await supabase
      .from('content_submissions')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    if (error) {
      console.error(error.message);
      setItems([]);
      setLoading(false);
      return;
    }

    const rows = (subs as ContentSubmission[]) || [];
    const enriched: QueueItem[] = [];

    for (const s of rows) {
      let title = `${s.entity_type} ${s.entity_id.slice(0, 8)}`;
      if (s.entity_type === 'project') {
        const { data: p } = await supabase
          .from('projects')
          .select('name')
          .eq('id', s.entity_id)
          .maybeSingle();
        if (p?.name) title = p.name;
        else if (typeof s.payload?.name === 'string') title = s.payload.name;
      } else {
        const { data: b } = await supabase
          .from('rc_brands')
          .select('name')
          .eq('id', s.entity_id)
          .maybeSingle();
        if (b?.name) title = b.name;
        else if (typeof s.payload?.name === 'string') title = s.payload.name;
      }

      const { data: submitter } = await supabase
        .from('profiles')
        .select('display_name, email')
        .eq('id', s.submitted_by)
        .maybeSingle();

      enriched.push({
        ...s,
        title,
        submitter_name: submitter?.display_name || submitter?.email || 'User',
      });
    }

    setItems(enriched);
    setLoading(false);
  }

  useEffect(() => {
    loadQueue();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  async function approve(item: QueueItem) {
    setActing(true);
    const supabase = createClient();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return;

    if (item.action === 'create') {
      const table = item.entity_type === 'project' ? 'projects' : 'rc_brands';
      const { error } = await supabase
        .from(table)
        .update({
          status: 'approved' as ModerationStatus,
          rejection_reason: null,
        })
        .eq('id', item.entity_id);
      if (error) {
        toast(error.message, 'error');
        setActing(false);
        return;
      }
    } else {
      // Apply proposed payload to live entity
      const table = item.entity_type === 'project' ? 'projects' : 'rc_brands';
      const payload = { ...(item.payload || {}) };
      delete payload.status;
      delete payload.added_by;
      delete payload.rejection_reason;
      const { error } = await supabase.from(table).update(payload).eq('id', item.entity_id);
      if (error) {
        toast(error.message, 'error');
        setActing(false);
        return;
      }
    }

    const { error: subErr } = await supabase
      .from('content_submissions')
      .update({
        status: 'approved',
        reviewed_by: auth.user.id,
        reviewed_at: new Date().toISOString(),
        rejection_reason: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', item.id);

    setActing(false);
    if (subErr) {
      toast(subErr.message, 'error');
      return;
    }
    toast('Approved', 'success');
    setItems((prev) => prev.filter((i) => i.id !== item.id));
  }

  async function reject(item: QueueItem) {
    if (!rejectReason.trim()) {
      toast('Please provide a rejection reason', 'error');
      return;
    }
    setActing(true);
    const supabase = createClient();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return;

    if (item.action === 'create') {
      const table = item.entity_type === 'project' ? 'projects' : 'rc_brands';
      await supabase
        .from(table)
        .update({
          status: 'rejected' as ModerationStatus,
          rejection_reason: rejectReason.trim(),
        })
        .eq('id', item.entity_id);
    }

    const { error } = await supabase
      .from('content_submissions')
      .update({
        status: 'rejected',
        rejection_reason: rejectReason.trim(),
        reviewed_by: auth.user.id,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', item.id);

    setActing(false);
    setRejectId(null);
    setRejectReason('');
    if (error) {
      toast(error.message, 'error');
      return;
    }
    toast('Rejected', 'success');
    setItems((prev) => prev.filter((i) => i.id !== item.id));
  }

  function itemHref(item: QueueItem): string | null {
    if (item.entity_type === 'project') {
      return projectPath({ id: item.entity_id, slug: null });
    }
    return brandPath({ id: item.entity_id, slug: null });
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="skeleton-shimmer h-8 w-64 mb-4" />
        <div className="skeleton-shimmer h-40 w-full" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-primary mb-2">Approval queue</h1>
      <p className="text-sm text-neutral/60 mb-8">
        Review community submissions for projects and regional centers.
      </p>

      {items.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-base-300 rounded-xl">
          <p className="text-neutral/60">No pending submissions</p>
        </div>
      ) : (
        <ul className="space-y-4">
          {items.map((item) => (
            <li
              key={item.id}
              className="card card-bordered shadow-sm bg-base-100"
            >
              <div className="card-body p-5 gap-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h2 className="font-bold text-primary">{item.title}</h2>
                    <p className="text-sm text-neutral/60 mt-1">
                      {item.action === 'create' ? 'New' : 'Edit'}{' '}
                      {item.entity_type === 'project' ? 'project' : 'regional center'}
                      {' · '}
                      by {item.submitter_name}
                      {' · '}
                      {formatDate(item.created_at)}
                    </p>
                  </div>
                  <span className={`badge rounded-full ${statusBadgeClass(item.status)}`}>
                    {statusLabel(item.status)}
                  </span>
                </div>

                {item.action === 'update' && (
                  <details className="text-sm">
                    <summary className="cursor-pointer text-neutral/60">Proposed changes</summary>
                    <pre className="mt-2 p-3 bg-base-200 rounded-lg overflow-auto text-xs">
                      {JSON.stringify(item.payload, null, 2)}
                    </pre>
                  </details>
                )}

                <div className="flex flex-wrap gap-2 mt-2">
                  {itemHref(item) && (
                    <Link href={itemHref(item)!} className="btn btn-ghost btn-sm rounded-full">
                      View
                    </Link>
                  )}
                  <button
                    type="button"
                    className="btn btn-success btn-sm rounded-full"
                    disabled={acting}
                    onClick={() => approve(item)}
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline btn-error btn-sm rounded-full"
                    disabled={acting}
                    onClick={() => {
                      setRejectId(item.id);
                      setRejectReason('');
                    }}
                  >
                    Reject
                  </button>
                </div>

                {rejectId === item.id && (
                  <div className="mt-2 p-3 bg-base-200 rounded-lg space-y-2">
                    <label className="form-control">
                      <span className="label-text text-sm">Reason for rejection</span>
                      <textarea
                        className="textarea textarea-bordered textarea-sm"
                        rows={2}
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="Explain what needs to change…"
                      />
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm rounded-full"
                        onClick={() => setRejectId(null)}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="btn btn-error btn-sm rounded-full"
                        disabled={acting}
                        onClick={() => reject(item)}
                      >
                        Confirm reject
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

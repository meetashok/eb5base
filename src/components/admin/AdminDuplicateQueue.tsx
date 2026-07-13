'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { useToast } from '@/components/Toast';
import { brandPath, projectPath } from '@/lib/slugs';
import type { DuplicateReportGroup } from '@/lib/types';
import { formatDate } from '@/lib/utils';

interface DuplicateQueueItem extends DuplicateReportGroup {
  reported_name: string;
  duplicate_names: string[];
}

export default function AdminDuplicateQueue() {
  const router = useRouter();
  const { toast } = useToast();
  const [items, setItems] = useState<DuplicateQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [resolveId, setResolveId] = useState<string | null>(null);
  const [canonicalId, setCanonicalId] = useState<string>('');

  async function load() {
    const supabase = createClient();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      router.replace('/login?redirect=/admin');
      return;
    }

    const { data, error } = await supabase
      .from('duplicate_report_groups')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    if (error) {
      console.error(error.message);
      setItems([]);
      setLoading(false);
      return;
    }

    const enriched: DuplicateQueueItem[] = [];
    for (const row of (data as DuplicateReportGroup[]) || []) {
      const table = row.entity_type === 'project' ? 'projects' : 'rc_brands';
      const { data: reported } = await supabase
        .from(table)
        .select('name')
        .eq('id', row.reported_entity_id)
        .maybeSingle();

      const duplicateNames: string[] = [];
      for (const dupId of row.duplicate_entity_ids || []) {
        const { data: dup } = await supabase
          .from(table)
          .select('name')
          .eq('id', dupId)
          .maybeSingle();
        if (dup?.name) duplicateNames.push(dup.name);
      }

      enriched.push({
        ...row,
        reported_name: reported?.name || row.reported_entity_id.slice(0, 8),
        duplicate_names: duplicateNames,
      });
    }

    setItems(enriched);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function allIds(item: DuplicateQueueItem): { id: string; name: string }[] {
    const ids = [item.reported_entity_id, ...(item.duplicate_entity_ids || [])];
    const names = [item.reported_name, ...item.duplicate_names];
    return ids.map((id, i) => ({ id, name: names[i] || id.slice(0, 8) }));
  }

  async function resolve(item: DuplicateQueueItem, dismiss = false) {
    setActing(true);
    const supabase = createClient();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return;

    if (dismiss) {
      await supabase
        .from('duplicate_report_groups')
        .update({
          status: 'dismissed',
          resolved_by: auth.user.id,
          resolved_at: new Date().toISOString(),
        })
        .eq('id', item.id);
      toast('Dismissed', 'success');
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      setActing(false);
      return;
    }

    if (!canonicalId) {
      toast('Select the primary listing to keep', 'error');
      setActing(false);
      return;
    }

    const mergeIds = allIds(item)
      .map((x) => x.id)
      .filter((id) => id !== canonicalId);

    const table = item.entity_type === 'project' ? 'projects' : 'rc_brands';
    for (const dupId of mergeIds) {
      await supabase
        .from(table)
        .update({ merged_into: canonicalId })
        .eq('id', dupId);
    }

    await supabase
      .from('duplicate_report_groups')
      .update({
        status: 'resolved',
        canonical_entity_id: canonicalId,
        resolved_by: auth.user.id,
        resolved_at: new Date().toISOString(),
      })
      .eq('id', item.id);

    toast('Duplicates merged', 'success');
    setResolveId(null);
    setCanonicalId('');
    setItems((prev) => prev.filter((i) => i.id !== item.id));
    setActing(false);
  }

  if (loading) {
    return <div className="skeleton-shimmer h-32 w-full" />;
  }

  if (items.length === 0) {
    return (
      <div className="card-elevated text-center py-12 border-dashed border-2 border-base-300/60">
        <p className="text-neutral/60">No pending duplicate reports</p>
      </div>
    );
  }

  return (
    <ul className="space-y-4">
      {items.map((item) => (
        <li key={item.id} className="card-elevated p-5 space-y-3">
          <div>
            <h2 className="font-bold text-primary">{item.reported_name}</h2>
            <p className="text-sm text-neutral/60 mt-1">
              Reported as duplicate of: {item.duplicate_names.join(', ') || '-'}
              {' · '}
              {item.entity_type === 'project' ? 'Project' : 'Regional center'}
              {' · '}
              {formatDate(item.created_at)}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {item.entity_type === 'project' ? (
              <Link
                href={projectPath({ id: item.reported_entity_id, slug: null })}
                className="btn btn-ghost btn-sm rounded-full"
              >
                View reported
              </Link>
            ) : (
              <Link
                href={brandPath({ id: item.reported_entity_id, slug: null })}
                className="btn btn-ghost btn-sm rounded-full"
              >
                View reported
              </Link>
            )}
            <button
              type="button"
              className="btn btn-primary btn-sm rounded-full"
              disabled={acting}
              onClick={() => {
                setResolveId(item.id);
                setCanonicalId(item.reported_entity_id);
              }}
            >
              Resolve merge
            </button>
            <button
              type="button"
              className="btn btn-outline btn-sm rounded-full"
              disabled={acting}
              onClick={() => resolve(item, true)}
            >
              Dismiss
            </button>
          </div>

          {resolveId === item.id && (
            <div className="p-3 panel-copper space-y-3">
              <p className="text-sm font-medium text-primary">Choose primary listing to keep</p>
              <div className="space-y-2">
                {allIds(item).map((entry) => (
                  <label key={entry.id} className="flex items-center gap-2 cursor-pointer text-sm">
                    <input
                      type="radio"
                      name={`canonical-${item.id}`}
                      className="radio radio-sm radio-secondary"
                      checked={canonicalId === entry.id}
                      onChange={() => setCanonicalId(entry.id)}
                    />
                    {entry.name}
                  </label>
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="btn btn-ghost btn-sm rounded-full"
                  onClick={() => setResolveId(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm rounded-full"
                  disabled={acting || !canonicalId}
                  onClick={() => resolve(item)}
                >
                  Merge duplicates
                </button>
              </div>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}

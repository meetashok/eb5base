'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { useToast } from '@/components/Toast';
import { formatDate } from '@/lib/utils';

interface PendingMembership {
  id: string;
  user_id: string;
  rc_id: string;
  created_at: string;
  regional_centers: { name: string; rc_brands?: { name: string } | null } | null;
  profiles: { display_name: string | null; email: string | null } | null;
}

export default function AdminRcVerifyQueue() {
  const router = useRouter();
  const { toast } = useToast();
  const [items, setItems] = useState<PendingMembership[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);

  async function load() {
    const supabase = createClient();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      router.replace('/login?redirect=/admin');
      return;
    }

    const { data, error } = await supabase
      .from('rc_memberships')
      .select(
        'id, user_id, rc_id, created_at, regional_centers(name, rc_brands:brand_id(name)), profiles: user_id(display_name, email)'
      )
      .eq('active', true)
      .is('verified_at', null)
      .is('revoked_at', null)
      .order('created_at', { ascending: true });

    if (error) {
      console.error(error.message);
      setItems([]);
    } else {
      const rows = (data || []) as unknown as PendingMembership[];
      setItems(rows);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function verify(id: string) {
    setActing(true);
    const supabase = createClient();
    const { error } = await supabase
      .from('rc_memberships')
      .update({ verified_at: new Date().toISOString() })
      .eq('id', id);

    setActing(false);
    if (error) {
      toast(error.message, 'error');
      return;
    }
    toast('RC representative verified', 'success');
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  if (loading) {
    return <div className="skeleton-shimmer h-32 w-full" />;
  }

  if (items.length === 0) {
    return (
      <div className="card-elevated text-center py-12 border-dashed border-2 border-base-300/60">
        <p className="text-neutral/60">No pending RC verification requests</p>
      </div>
    );
  }

  return (
    <ul className="space-y-4">
      {items.map((item) => (
        <li key={item.id} className="card-elevated p-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-bold text-primary">
              {item.profiles?.display_name || item.profiles?.email || 'User'}
            </p>
            <p className="text-sm text-neutral/60 mt-1">
              {item.regional_centers?.rc_brands?.name ||
                item.regional_centers?.name ||
                'Regional center'}{' '}
              · Requested {formatDate(item.created_at)}
            </p>
          </div>
          <button
            type="button"
            className="btn btn-secondary btn-sm rounded-full"
            disabled={acting}
            onClick={() => verify(item.id)}
          >
            Verify representative
          </button>
        </li>
      ))}
    </ul>
  );
}

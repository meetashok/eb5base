'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { useToast } from '@/components/Toast';
import { allocateUniqueSlug, slugify } from '@/lib/slugs';
import { createSubmission } from '@/lib/approvals';

export default function NewRcBrandPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [website, setWebsite] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.replace('/login?redirect=/rc/add');
        return;
      }
      setCheckingAuth(false);
    });
  }, [router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError('Name is required.');
      return;
    }
    setSaving(true);
    setError(null);
    const supabase = createClient();

    const { data: existing } = await supabase
      .from('rc_brands')
      .select('id, name')
      .ilike('name', name.trim())
      .maybeSingle();

    if (existing) {
      setSaving(false);
      setError(
        `“${existing.name}” already exists. Open it instead of creating a duplicate.`
      );
      return;
    }

    const slug = await allocateUniqueSlug(slugify(name.trim()), async (candidate) => {
      const { data, error: slugErr } = await supabase
        .from('rc_brands')
        .select('id')
        .eq('slug', candidate)
        .maybeSingle();
      if (slugErr && /slug/i.test(slugErr.message)) return false;
      return Boolean(data);
    });

    const baseInsert = {
      name: name.trim(),
      website_url: website.trim() || null,
      description: description.trim() || null,
      status: 'pending' as const,
      added_by: null as string | null,
    };

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) baseInsert.added_by = user.id;

    let { data, error: insertError } = await supabase
      .from('rc_brands')
      .insert({ ...baseInsert, slug })
      .select('id, slug')
      .single();

    if (insertError && /slug/i.test(insertError.message)) {
      ({ data, error: insertError } = await supabase
        .from('rc_brands')
        .insert(baseInsert)
        .select('id')
        .single());
    }

    if (insertError && /status|added_by/i.test(insertError.message)) {
      ({ data, error: insertError } = await supabase
        .from('rc_brands')
        .insert({
          name: baseInsert.name,
          website_url: baseInsert.website_url,
          description: baseInsert.description,
        })
        .select('id')
        .single());
    }

    setSaving(false);
    if (insertError || !data) {
      setError(insertError?.message || 'Failed to create regional center');
      toast(insertError?.message || 'Failed to create', 'error');
      return;
    }

    if (user) {
      await createSubmission(supabase, {
        entity_type: 'rc_brand',
        entity_id: data.id,
        action: 'create',
        payload: baseInsert,
        submitted_by: user.id,
      });
    }

    toast('Submitted for approval. It will appear publicly once an admin reviews it.', 'success');
    router.push('/profile?tab=submissions');
  }

  if (checkingAuth) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="skeleton-shimmer h-8 w-64 mb-4" />
        <div className="skeleton-shimmer h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-primary mb-2">Add Regional Center</h1>
      <p className="text-sm text-neutral/60 mb-6">
        Please search the{' '}
        <Link href="/rc" className="link link-secondary">
          existing list
        </Link>{' '}
        before adding to avoid duplicates.
      </p>

      <form onSubmit={handleSubmit} className="card card-bordered shadow-sm bg-base-100">
        <div className="card-body gap-4">
          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">Name *</span>
            </label>
            <input
              type="text"
              className="input input-bordered"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. EB5 United, Golden Gate Global"
            />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">Website</span>
            </label>
            <input
              type="url"
              className="input input-bordered"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://"
            />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">Description</span>
            </label>
            <textarea
              className="textarea textarea-bordered"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {error && <p className="text-error text-sm">{error}</p>}

          <div className="flex gap-3 mt-2">
            <Link href="/rc" className="btn btn-ghost rounded-full flex-1">
              Cancel
            </Link>
            <button
              type="submit"
              className="btn btn-primary rounded-full flex-1"
              disabled={saving}
            >
              {saving ? (
                <span className="loading loading-spinner loading-sm" />
              ) : (
                'Add Regional Center'
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { useAuthPrompt } from '@/components/AuthPromptProvider';
import { useToast } from '@/components/Toast';
import { allocateUniqueSlug, brandPath, slugify } from '@/lib/slugs';
import { createSubmission, isAdmin } from '@/lib/approvals';
import type { ModerationStatus } from '@/lib/types';

export default function NewRcBrandPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, authLoading, promptSignIn } = useAuthPrompt();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [authPrompted, setAuthPrompted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [website, setWebsite] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (user) {
      setCheckingAuth(false);
      return;
    }
    if (!authPrompted) {
      promptSignIn('/rc/add');
      setAuthPrompted(true);
    }
    setCheckingAuth(false);
  }, [authLoading, user, authPrompted, promptSignIn]);

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

    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    const uid = authUser?.id;
    const autoApproveBrand = uid ? await isAdmin(supabase, uid) : false;

    const baseInsert = {
      name: name.trim(),
      website_url: website.trim() || null,
      description: description.trim() || null,
      status: (autoApproveBrand ? 'approved' : 'pending') as ModerationStatus,
      added_by: null as string | null,
    };

    if (authUser) baseInsert.added_by = authUser.id;

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

    if (authUser && !autoApproveBrand) {
      await createSubmission(supabase, {
        entity_type: 'rc_brand',
        entity_id: data.id,
        action: 'create',
        payload: baseInsert,
        submitted_by: authUser.id,
      });
    }

    toast(
      autoApproveBrand
        ? 'Regional center published.'
        : 'Submitted for approval. It will appear publicly once an admin reviews it.',
      'success'
    );
    router.push(autoApproveBrand ? brandPath(data) : '/timeline');
  }

  if (checkingAuth) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="skeleton-shimmer h-8 w-64 mb-4" />
        <div className="skeleton-shimmer h-64 w-full" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-primary mb-2">Add Regional Center</h1>
        <p className="text-neutral/70 mb-4">Sign in to add a regional center to the directory.</p>
        <Link href="/rc" className="btn btn-ghost btn-sm rounded-full">
          Back to regional centers
        </Link>
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

      <form onSubmit={handleSubmit} className="card-elevated bg-base-100 p-6">
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

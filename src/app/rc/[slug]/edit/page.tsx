'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { useToast } from '@/components/Toast';
import {
  allocateUniqueSlug,
  brandPath,
  isUuid,
  slugify,
} from '@/lib/slugs';
import type { RcBrand } from '@/lib/types';
import {
  createSubmission,
  shouldAutoApproveBrandAction,
} from '@/lib/approvals';

export default function EditRcBrandPage() {
  const params = useParams();
  const param = params.slug as string;
  const router = useRouter();
  const { toast } = useToast();

  const [brandId, setBrandId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [existingSlug, setExistingSlug] = useState<string | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [website, setWebsite] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) {
        router.replace(`/login?redirect=/rc/${param}/edit`);
        return;
      }
      setUserId(auth.user.id);

      let query = supabase.from('rc_brands').select('*');
      query = isUuid(param) ? query.eq('id', param) : query.eq('slug', param);
      const { data, error: err } = await query.maybeSingle();

      if (err || !data) {
        setError(err?.message || 'Regional center not found');
        setCheckingAuth(false);
        return;
      }

      const brand = data as RcBrand;
      setBrandId(brand.id);
      setExistingSlug(brand.slug);
      setName(brand.name);
      setWebsite(brand.website_url || '');
      setDescription(brand.description || '');
      setCheckingAuth(false);
    })();
  }, [param, router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!brandId || !name.trim() || !userId) {
      setError('Name is required.');
      return;
    }
    setSaving(true);
    setError(null);
    const supabase = createClient();

    const { data: dup } = await supabase
      .from('rc_brands')
      .select('id, name')
      .ilike('name', name.trim())
      .neq('id', brandId)
      .maybeSingle();

    if (dup) {
      setSaving(false);
      setError(`“${dup.name}” already exists under another listing.`);
      return;
    }

    const slug = await allocateUniqueSlug(slugify(name.trim()), async (candidate) => {
      if (candidate === existingSlug) return false;
      const { data, error: slugErr } = await supabase
        .from('rc_brands')
        .select('id')
        .eq('slug', candidate)
        .neq('id', brandId)
        .maybeSingle();
      if (slugErr && /slug/i.test(slugErr.message)) return false;
      return Boolean(data);
    });

    const baseUpdate = {
      name: name.trim(),
      website_url: website.trim() || null,
      description: description.trim() || null,
      updated_at: new Date().toISOString(),
    };

    const autoApprove = await shouldAutoApproveBrandAction(supabase, userId, brandId);

    if (autoApprove) {
      let updateError = (
        await supabase
          .from('rc_brands')
          .update({ ...baseUpdate, slug })
          .eq('id', brandId)
      ).error;

      if (updateError && /slug/i.test(updateError.message)) {
        updateError = (
          await supabase.from('rc_brands').update(baseUpdate).eq('id', brandId)
        ).error;
      }

      setSaving(false);
      if (updateError) {
        setError(updateError.message);
        toast(updateError.message, 'error');
        return;
      }

      toast('Regional center updated', 'success');
      router.push(brandPath({ id: brandId, slug: existingSlug || slug }));
      return;
    }

    const result = await createSubmission(supabase, {
      entity_type: 'rc_brand',
      entity_id: brandId,
      action: 'update',
      payload: { ...baseUpdate, slug },
      submitted_by: userId,
    });

    setSaving(false);
    if ('error' in result) {
      setError(result.error);
      toast(result.error, 'error');
      return;
    }

    toast('Edits submitted for approval', 'success');
    router.push('/profile?tab=activity');
  }

  async function handleDelete() {
    if (!brandId) return;
    setDeleting(true);
    setError(null);
    const supabase = createClient();

    // Unlink related rows so FK constraints don't block delete
    await supabase.from('projects').update({ brand_id: null }).eq('brand_id', brandId);
    await supabase
      .from('regional_centers')
      .update({ brand_id: null })
      .eq('brand_id', brandId);
    await supabase.from('rc_brand_contacts').delete().eq('brand_id', brandId);

    const { error: delErr } = await supabase.from('rc_brands').delete().eq('id', brandId);

    setDeleting(false);
    if (delErr) {
      setError(delErr.message);
      setConfirmDelete(false);
      toast(delErr.message, 'error');
      return;
    }

    toast('Regional center deleted', 'success');
    router.push('/rc');
  }

  if (checkingAuth) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="skeleton-shimmer h-8 w-64 mb-4" />
        <div className="skeleton-shimmer h-64 w-full" />
      </div>
    );
  }

  if (error && !brandId) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10">
        <p className="text-error">{error}</p>
        <Link href="/rc" className="btn btn-ghost rounded-full mt-4">
          Back to Regional Centers
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-primary mb-2">Edit Regional Center</h1>
      <p className="text-sm text-neutral/60 mb-6">
        Changes are reviewed by an admin before going live, unless you are a verified
        representative for this regional center.
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

          <div className="flex flex-wrap gap-3 mt-2">
            <button
              type="button"
              className="btn btn-ghost rounded-full flex-1"
              onClick={() =>
                router.push(
                  brandId
                    ? brandPath({ id: brandId, slug: existingSlug })
                    : '/rc'
                )
              }
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary rounded-full flex-1"
              disabled={saving || deleting}
            >
              {saving ? (
                <span className="loading loading-spinner loading-sm" />
              ) : (
                'Save Changes'
              )}
            </button>
          </div>

          <button
            type="button"
            className="btn btn-outline btn-error rounded-full w-full mt-2"
            disabled={saving || deleting}
            onClick={() => setConfirmDelete(true)}
          >
            Delete Regional Center
          </button>
        </div>
      </form>

      {confirmDelete && (
        <dialog className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg text-primary">Delete this regional center?</h3>
            <p className="py-3 text-sm text-neutral/70">
              This permanently removes <span className="font-medium">{name}</span>. Linked
              projects stay in the directory but will no longer point to this brand.
            </p>
            <div className="modal-action">
              <button
                type="button"
                className="btn btn-ghost rounded-full"
                disabled={deleting}
                onClick={() => setConfirmDelete(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-error rounded-full"
                disabled={deleting}
                onClick={handleDelete}
              >
                {deleting ? (
                  <span className="loading loading-spinner loading-sm" />
                ) : (
                  'Delete permanently'
                )}
              </button>
            </div>
          </div>
          <form method="dialog" className="modal-backdrop">
            <button type="button" onClick={() => !deleting && setConfirmDelete(false)}>
              close
            </button>
          </form>
        </dialog>
      )}
    </div>
  );
}

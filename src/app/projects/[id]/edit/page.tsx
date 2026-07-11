'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import BrandAutocomplete, { type BrandSelection } from '@/components/BrandAutocomplete';
import {
  F956_OPTIONS,
  PROJECT_TYPES,
  SUBSCRIPTION_OPTIONS,
  TEA_OPTIONS,
  US_STATES,
} from '@/lib/constants';
import type { F956Status, Project, SubscriptionStatus } from '@/lib/types';
import { PROJECT_SELECT } from '@/lib/types';
import {
  allocateUniqueSlug,
  isUuid,
  projectPath,
  slugify,
} from '@/lib/slugs';

export default function EditProjectPage() {
  const params = useParams();
  const param = params.id as string;
  const router = useRouter();
  const [projectId, setProjectId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [brandName, setBrandName] = useState('');
  const [brandSelection, setBrandSelection] = useState<BrandSelection | null>(null);
  const [name, setName] = useState('');
  const [projectTypes, setProjectTypes] = useState<string[]>([]);
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [website, setWebsite] = useState('');
  const [tea, setTea] = useState<string[]>([]);
  const [f956, setF956] = useState<F956Status>('unknown');
  const [f956Date, setF956Date] = useState('');
  const [subscription, setSubscription] = useState<SubscriptionStatus>('unknown');
  const [amount, setAmount] = useState('');
  const [totalSlots, setTotalSlots] = useState('');
  const [notes, setNotes] = useState('');
  const [existingSlug, setExistingSlug] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) {
        router.replace(`/login?redirect=/projects/${param}/edit`);
        return;
      }

      let query = supabase.from('projects').select(PROJECT_SELECT);
      query = isUuid(param) ? query.eq('id', param) : query.eq('slug', param);
      const { data, error: err } = await query.maybeSingle();

      if (err || !data) {
        setError('Project not found');
        setLoading(false);
        return;
      }

      const p = data as Project;
      setProjectId(p.id);
      setExistingSlug(p.slug);

      // Allow edit if user added the project OR is an active verified RC member
      let canEdit = p.added_by === auth.user.id;
      if (!canEdit && p.rc_id) {
        const { data: membership } = await supabase
          .from('rc_memberships')
          .select('id')
          .eq('rc_id', p.rc_id)
          .eq('user_id', auth.user.id)
          .eq('active', true)
          .not('verified_at', 'is', null)
          .is('revoked_at', null)
          .maybeSingle();
        canEdit = Boolean(membership);
      }

      if (!canEdit) {
        setError('You can only edit projects you added or that belong to your regional center.');
        setLoading(false);
        return;
      }

      setName(p.name);
      setBrandName(p.rc_brands?.name || p.regional_centers?.name || '');
      if (p.brand_id && p.rc_brands) {
        setBrandSelection({
          id: p.brand_id,
          name: p.rc_brands.name,
          website_url: p.rc_brands.website_url,
          isNew: false,
        });
      }
      setProjectTypes(p.project_type || []);
      setCity(p.location_city || '');
      setState(p.location_state || '');
      setWebsite(p.website_url || '');
      setTea(p.tea_designations || []);
      setF956((p.f956_status as F956Status) || 'unknown');
      setF956Date(p.f956_approval_date || '');
      setSubscription((p.subscription_status as SubscriptionStatus) || 'unknown');
      setAmount(p.investment_amount != null ? String(p.investment_amount) : '');
      setTotalSlots(p.total_slots != null ? String(p.total_slots) : '');
      setNotes(p.notes || '');
      setLoading(false);
    })();
  }, [param, router]);

  function toggle(list: string[], value: string, setter: (v: string[]) => void) {
    setter(list.includes(value) ? list.filter((x) => x !== value) : [...list, value]);
  }

  async function resolveBrandId(): Promise<string | null> {
    const supabase = createClient();
    if (brandSelection && !brandSelection.isNew && brandSelection.id) return brandSelection.id;

    const nameToCreate = (brandSelection?.name || brandName).trim();
    if (!nameToCreate) return null;

    const { data: existing } = await supabase
      .from('rc_brands')
      .select('id')
      .ilike('name', nameToCreate)
      .maybeSingle();
    if (existing?.id) return existing.id;

    const { data: created, error: createError } = await supabase
      .from('rc_brands')
      .insert({
        name: nameToCreate,
        slug: await allocateUniqueSlug(slugify(nameToCreate), async (candidate) => {
          const { data } = await supabase
            .from('rc_brands')
            .select('id')
            .eq('slug', candidate)
            .maybeSingle();
          return Boolean(data);
        }),
        status: 'approved',
      })
      .select('id')
      .single();

    if (createError || !created) {
      throw new Error(createError?.message || 'Failed to create regional center');
    }
    return created.id;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!projectId) return;
    setSaving(true);
    setError(null);
    const supabase = createClient();
    try {
      const brandId = await resolveBrandId();
      const nextSlugBase = slugify(name.trim());
      const slug = await allocateUniqueSlug(nextSlugBase, async (candidate) => {
        if (candidate === existingSlug) return false;
        let q = supabase
          .from('projects')
          .select('id')
          .eq('slug', candidate)
          .neq('id', projectId);
        q = brandId ? q.eq('brand_id', brandId) : q.is('brand_id', null);
        const { data } = await q.maybeSingle();
        return Boolean(data);
      });

      const { error: err } = await supabase
        .from('projects')
        .update({
          name: name.trim(),
          slug,
          project_type: projectTypes.length ? projectTypes : null,
          location_city: city.trim() || null,
          location_state: state || null,
          brand_id: brandId,
          tea_designations: tea.length ? tea : null,
          f956_status: f956,
          f956_approval_date: f956 === 'approved' && f956Date ? f956Date : null,
          investment_amount: amount ? parseInt(amount, 10) : null,
          total_slots: totalSlots ? parseInt(totalSlots, 10) : null,
          subscription_status: subscription,
          website_url: website.trim() || null,
          notes: notes.trim() || null,
        })
        .eq('id', projectId);
      setSaving(false);
      if (err) {
        setError(err.message);
        return;
      }

      const { data: brandRow } = brandId
        ? await supabase.from('rc_brands').select('id, slug').eq('id', brandId).maybeSingle()
        : { data: null };

      router.push(
        projectPath({
          id: projectId,
          slug,
          brand_id: brandId,
          rc_brands: brandRow,
        })
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="skeleton-shimmer h-8 w-48 mb-4" />
        <div className="skeleton-shimmer h-64 w-full" />
      </div>
    );
  }

  if (error && !name) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <p className="text-error">{error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-primary mb-6">Edit Project</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <label className="form-control">
          <span className="label-text mb-1">Regional Center</span>
          <BrandAutocomplete
            value={brandName}
            onChange={(v) => {
              setBrandName(v);
              setBrandSelection(null);
            }}
            onSelect={(sel) => setBrandSelection(sel)}
          />
        </label>
        <label className="form-control">
          <span className="label-text mb-1">Project Name</span>
          <input
            className="input input-bordered"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>

        <fieldset>
          <legend className="label-text mb-2">Project Type</legend>
          <div className="flex flex-wrap gap-3">
            {PROJECT_TYPES.map((opt) => (
              <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="checkbox checkbox-sm checkbox-primary"
                  checked={projectTypes.includes(opt.value)}
                  onChange={() => toggle(projectTypes, opt.value, setProjectTypes)}
                />
                <span className="text-sm">{opt.label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="form-control">
            <span className="label-text mb-1">City</span>
            <input
              className="input input-bordered"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </label>
          <label className="form-control">
            <span className="label-text mb-1">State</span>
            <select
              className="select select-bordered"
              value={state}
              onChange={(e) => setState(e.target.value)}
            >
              <option value="">Select</option>
              {US_STATES.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="form-control">
          <span className="label-text mb-1">Website</span>
          <input
            type="url"
            className="input input-bordered"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
          />
        </label>

        <fieldset>
          <legend className="label-text mb-2">TEA</legend>
          <div className="flex flex-wrap gap-3">
            {TEA_OPTIONS.map((opt) => (
              <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="checkbox checkbox-sm checkbox-primary"
                  checked={tea.includes(opt.value)}
                  onChange={() => toggle(tea, opt.value, setTea)}
                />
                <span className="text-sm">{opt.label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <label className="form-control">
          <span className="label-text mb-1">I-956F Status</span>
          <select
            className="select select-bordered"
            value={f956}
            onChange={(e) => setF956(e.target.value as F956Status)}
          >
            {F956_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>

        {f956 === 'approved' && (
          <label className="form-control">
            <span className="label-text mb-1">Approval Date</span>
            <input
              type="date"
              className="input input-bordered"
              value={f956Date}
              onChange={(e) => setF956Date(e.target.value)}
            />
          </label>
        )}

        <label className="form-control">
          <span className="label-text mb-1">Subscription Status</span>
          <select
            className="select select-bordered"
            value={subscription}
            onChange={(e) => setSubscription(e.target.value as SubscriptionStatus)}
          >
            {SUBSCRIPTION_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>

        <label className="form-control">
          <span className="label-text mb-1">Investment Amount</span>
          <input
            type="number"
            className="input input-bordered"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </label>

        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium">Total Investor Positions</span>
          </label>
          <input
            type="number"
            className="input input-bordered"
            placeholder="e.g. 600"
            value={totalSlots}
            onChange={(e) => setTotalSlots(e.target.value)}
            min={1}
          />
        </div>

        <label className="form-control">
          <span className="label-text mb-1">Notes</span>
          <textarea
            className="textarea textarea-bordered"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </label>

        {error && <p className="text-error text-sm">{error}</p>}

        <div className="flex gap-2">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() =>
              router.push(projectId ? `/projects/${existingSlug || projectId}` : '/projects')
            }
          >
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </form>
    </div>
  );
}

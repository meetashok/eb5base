'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { useAuthPrompt } from '@/components/AuthPromptProvider';
import { AddRcLink } from '@/components/AuthGatedLinks';
import BrandAutocomplete, { type BrandSelection } from '@/components/BrandAutocomplete';
import DuplicateCheckModal, { type SimilarProject } from '@/components/DuplicateCheckModal';
import TEATag from '@/components/TEATag';
import StatusBadge from '@/components/StatusBadge';
import {
  CONTACT_ROLES,
  F956_OPTIONS,
  PROJECT_TYPES,
  SUBSCRIPTION_OPTIONS,
  TEA_OPTIONS,
  US_STATES,
} from '@/lib/constants';
import type { F956Status, SubscriptionStatus } from '@/lib/types';
import {
  formatCurrency,
  f956Label,
  f956Variant,
  projectTypeLabel,
  subscriptionLabel,
  subscriptionVariant,
} from '@/lib/utils';
import { allocateUniqueSlug, projectPath, slugify } from '@/lib/slugs';
import { useToast } from '@/components/Toast';
import { createSubmission } from '@/lib/approvals';

interface ContactDraft {
  name: string;
  role: string;
  email: string;
  phone: string;
}

const emptyContact = (): ContactDraft => ({
  name: '',
  role: 'Sales',
  email: '',
  phone: '',
});

export default function NewProjectForm() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, authLoading, promptSignIn } = useAuthPrompt();
  const [userId, setUserId] = useState<string | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [authPrompted, setAuthPrompted] = useState(false);

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
  const [contacts, setContacts] = useState<ContactDraft[]>([]);
  const [notes, setNotes] = useState('');

  const [similarWhileTyping, setSimilarWhileTyping] = useState<SimilarProject[]>([]);
  const [dismissedSimilar, setDismissedSimilar] = useState(false);
  const [dupModalOpen, setDupModalOpen] = useState(false);
  const [dupMatches, setDupMatches] = useState<SimilarProject[]>([]);
  const [previewMode, setPreviewMode] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedBrandId = brandSelection && !brandSelection.isNew ? brandSelection.id : null;

  useEffect(() => {
    if (authLoading) return;
    if (user) {
      setUserId(user.id);
      setCheckingAuth(false);
      return;
    }
    if (!authPrompted) {
      promptSignIn('/projects/add');
      setAuthPrompted(true);
    }
    setCheckingAuth(false);
  }, [authLoading, user, authPrompted, promptSignIn]);

  useEffect(() => {
    if (!selectedBrandId || name.trim().length < 3 || dismissedSimilar) {
      setSimilarWhileTyping([]);
      return;
    }
    const t = setTimeout(async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('projects')
        .select('id, name, slug, brand_id, location_state, rc_brands!brand_id(id, name, slug)')
        .eq('brand_id', selectedBrandId)
        .ilike('name', `%${name.trim()}%`)
        .is('merged_into', null)
        .limit(5);
      setSimilarWhileTyping((data as SimilarProject[]) || []);
    }, 300);
    return () => clearTimeout(t);
  }, [name, selectedBrandId, dismissedSimilar]);

  function toggle(list: string[], value: string, setter: (v: string[]) => void) {
    setter(list.includes(value) ? list.filter((x) => x !== value) : [...list, value]);
  }

  function handleBrandSelect(selection: BrandSelection) {
    setBrandSelection(selection);
    setDismissedSimilar(false);
  }

  async function resolveBrandId(): Promise<string | null> {
    const supabase = createClient();
    if (brandSelection && !brandSelection.isNew && brandSelection.id) {
      return brandSelection.id;
    }

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
        status: 'pending',
        added_by: userId,
      })
      .select('id')
      .single();

    if (createError || !created) {
      throw new Error(createError?.message || 'Failed to create regional center');
    }

    await createSubmission(supabase, {
      entity_type: 'rc_brand',
      entity_id: created.id,
      action: 'create',
      payload: { name: nameToCreate },
      submitted_by: userId!,
    });

    return created.id;
  }

  async function runDuplicateCheck(): Promise<SimilarProject[]> {
    const supabase = createClient();
    const queries = [
      supabase
        .from('projects')
        .select('id, name, slug, brand_id, location_state, rc_brands!brand_id(id, name, slug)')
        .is('merged_into', null)
        .ilike('name', `%${name.trim()}%`)
        .limit(5),
    ];
    if (selectedBrandId) {
      queries.push(
        supabase
          .from('projects')
          .select('id, name, slug, brand_id, location_state, rc_brands!brand_id(id, name, slug)')
          .eq('brand_id', selectedBrandId)
          .is('merged_into', null)
          .limit(5)
      );
    }
    const results = await Promise.all(queries);
    const map = new Map<string, SimilarProject>();
    for (const r of results) {
      for (const p of (r.data as SimilarProject[]) || []) {
        map.set(p.id, p);
      }
    }
    return Array.from(map.values()).slice(0, 8);
  }

  async function handlePreview(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim() || !brandName.trim()) {
      setError('Project name and regional center are required.');
      return;
    }
    const matches = await runDuplicateCheck();
    if (matches.length) {
      setDupMatches(matches);
      setDupModalOpen(true);
      return;
    }
    setPreviewMode(true);
  }

  async function handleSubmit() {
    if (!userId) return;
    setSubmitting(true);
    setError(null);
    const supabase = createClient();

    try {
      const brandId = await resolveBrandId();
      if (!brandId) {
        setError('Regional center is required.');
        setSubmitting(false);
        return;
      }

      const projectSlug = await allocateUniqueSlug(slugify(name.trim()), async (candidate) => {
        let q = supabase.from('projects').select('id').eq('slug', candidate);
        q = brandId ? q.eq('brand_id', brandId) : q.is('brand_id', null);
        const { data } = await q.maybeSingle();
        return Boolean(data);
      });

      const payload = {
        name: name.trim(),
        slug: projectSlug,
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
        added_by: userId,
        status: 'pending' as const,
      };

      const { data: project, error: insertError } = await supabase
        .from('projects')
        .insert(payload)
        .select('id, slug, brand_id')
        .single();

      if (insertError || !project) {
        setError(insertError?.message || 'Failed to create project');
        toast(insertError?.message || 'Failed to create project', 'error');
        setSubmitting(false);
        return;
      }

      const validContacts = contacts.filter((c) => c.name.trim());
      if (validContacts.length) {
        await supabase.from('project_contacts').insert(
          validContacts.map((c) => ({
            project_id: project.id,
            name: c.name.trim(),
            role: c.role || null,
            email: c.email.trim() || null,
            phone: c.phone.trim() || null,
          }))
        );
      }

      await createSubmission(supabase, {
        entity_type: 'project',
        entity_id: project.id,
        action: 'create',
        payload,
        submitted_by: userId,
      });

      toast('Submitted for approval. It will appear publicly once an admin reviews it.', 'success');
      router.push('/profile?tab=submissions');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit');
      toast(err instanceof Error ? err.message : 'Failed to submit', 'error');
      setSubmitting(false);
    }
  }

  if (checkingAuth) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16">
        <div className="skeleton-shimmer h-8 w-64 mb-4" />
        <div className="skeleton-shimmer h-40 w-full" />
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-primary mb-2">Add Project</h1>
        <p className="text-neutral/70 mb-4">Sign in to add a project to the directory.</p>
        <Link href="/projects" className="btn btn-ghost btn-sm rounded-full">
          Back to browse
        </Link>
      </div>
    );
  }

  if (previewMode) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-primary mb-2">Preview listing</h1>
        <p className="text-sm text-neutral/70 mb-6">
          This is how your project will appear. Confirm to submit.
        </p>

        <div className="card-elevated p-6 space-y-4 mb-6">
          <h2 className="text-2xl font-bold text-primary">{name}</h2>
          <div className="flex flex-wrap gap-1.5">
            {tea.map((t) => (
              <TEATag key={t} designation={t} />
            ))}
            <StatusBadge label={`956F ${f956Label(f956)}`} variant={f956Variant(f956)} />
            <StatusBadge
              label={subscriptionLabel(subscription)}
              variant={subscriptionVariant(subscription)}
            />
          </div>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-meta text-neutral/50">Location</dt>
              <dd>{[city, state].filter(Boolean).join(', ') || 'Not listed'}</dd>
            </div>
            <div>
              <dt className="text-meta text-neutral/50">Regional Center</dt>
              <dd>{brandName || 'Not listed'}</dd>
            </div>
            <div>
              <dt className="text-meta text-neutral/50">Investment</dt>
              <dd>{formatCurrency(amount ? parseInt(amount, 10) : null)}</dd>
            </div>
            <div>
              <dt className="text-meta text-neutral/50">Type</dt>
              <dd>{projectTypes.map(projectTypeLabel).join(', ') || 'Not listed'}</dd>
            </div>
          </dl>
          {notes && <p className="text-sm whitespace-pre-wrap">{notes}</p>}
        </div>

        {error && <p className="text-error text-sm mb-4">{error}</p>}

        <div className="flex gap-2">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => setPreviewMode(false)}
            disabled={submitting}
          >
            Back to edit
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? 'Submitting…' : 'Submit'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-primary mb-2">Add a New Project</h1>
      <p className="text-sm text-neutral/70 mb-8">
        Help fellow investors by adding an EB-5 project to the directory. Please provide factual
        information only.
      </p>

      <form onSubmit={handlePreview} className="space-y-10">
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-primary">Regional Center</h2>
          <label className="form-control">
            <span className="label-text mb-1">Regional Center *</span>
            <BrandAutocomplete
              value={brandName}
              onChange={(v) => {
                setBrandName(v);
                setBrandSelection(null);
                setDismissedSimilar(false);
              }}
              onSelect={handleBrandSelect}
            />
            <span className="label-text-alt text-neutral/50 mt-1">
              Can&apos;t find it?{' '}
              <AddRcLink className="link link-secondary">
                Add a new regional center
              </AddRcLink>{' '}
              first, then come back here.
            </span>
          </label>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-bold text-primary">Project Info</h2>
          <label className="form-control">
            <span className="label-text mb-1">Project Name *</span>
            <input
              type="text"
              className="input input-bordered"
              required
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setDismissedSimilar(false);
              }}
            />
          </label>
          {similarWhileTyping.length > 0 && !dismissedSimilar && (
            <div className="alert-heritage-warning p-3">
              <p className="text-sm font-medium mb-2">
                These projects already exist under {brandName}. Is yours one of these?
              </p>
              <ul className="space-y-1 mb-2">
                {similarWhileTyping.map((p) => (
                  <li key={p.id}>
                    <Link href={projectPath(p)} className="link link-secondary text-sm">
                      {p.name}
                      {p.location_state ? ` (${p.location_state})` : ''}
                    </Link>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                className="btn btn-ghost btn-xs"
                onClick={() => setDismissedSimilar(true)}
              >
                None of these. Create new
              </button>
            </div>
          )}

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
              <span className="label-text mb-1">Location City</span>
              <input
                type="text"
                className="input input-bordered"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </label>
            <label className="form-control">
              <span className="label-text mb-1">Location State</span>
              <select
                className="select select-bordered"
                value={state}
                onChange={(e) => setState(e.target.value)}
              >
                <option value="">Select state</option>
                {US_STATES.map((s) => (
                  <option key={s.code} value={s.code}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="form-control">
            <span className="label-text mb-1">Website (optional)</span>
            <input
              type="url"
              className="input input-bordered"
              placeholder="https://"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
            />
          </label>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-bold text-primary">Classification</h2>
          <fieldset>
            <legend className="label-text mb-2">TEA Designations</legend>
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
              <span className="label-text mb-1">I-956F Approval Date</span>
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
            <span className="label-text mb-1">Investment Amount (USD)</span>
            <input
              type="number"
              className="input input-bordered"
              placeholder="800000"
              min={0}
              step={1000}
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
            <label className="label">
              <span className="label-text-alt text-neutral/50">
                How many investor slots does this project have?
              </span>
            </label>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-primary">Contacts (optional)</h2>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => setContacts((c) => [...c, emptyContact()])}
            >
              + Add Contact
            </button>
          </div>
          {contacts.map((c, i) => (
            <div
              key={i}
              className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 border border-base-300 rounded-lg"
            >
              <input
                type="text"
                className="input input-bordered input-sm"
                placeholder="Name"
                value={c.name}
                onChange={(e) => {
                  const next = [...contacts];
                  next[i] = { ...c, name: e.target.value };
                  setContacts(next);
                }}
              />
              <select
                className="select select-bordered select-sm"
                value={c.role}
                onChange={(e) => {
                  const next = [...contacts];
                  next[i] = { ...c, role: e.target.value };
                  setContacts(next);
                }}
              >
                {CONTACT_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
              <input
                type="email"
                className="input input-bordered input-sm"
                placeholder="Email"
                value={c.email}
                onChange={(e) => {
                  const next = [...contacts];
                  next[i] = { ...c, email: e.target.value };
                  setContacts(next);
                }}
              />
              <div className="flex gap-2">
                <input
                  type="tel"
                  className="input input-bordered input-sm flex-1"
                  placeholder="Phone"
                  value={c.phone}
                  onChange={(e) => {
                    const next = [...contacts];
                    next[i] = { ...c, phone: e.target.value };
                    setContacts(next);
                  }}
                />
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => setContacts(contacts.filter((_, idx) => idx !== i))}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-primary">Notes</h2>
          <textarea
            className="textarea textarea-bordered w-full min-h-28"
            placeholder="Any additional factual information about this project"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <p className="text-meta text-neutral/50">
            Please provide factual, verifiable information only. No opinions or recommendations.
          </p>
        </section>

        {error && <p className="text-error text-sm">{error}</p>}

        <button type="submit" className="btn btn-primary transition-all duration-150">
          Preview
        </button>
      </form>

      <DuplicateCheckModal
        open={dupModalOpen}
        projects={dupMatches}
        onClose={() => setDupModalOpen(false)}
        onProceed={() => {
          setDupModalOpen(false);
          setPreviewMode(true);
        }}
      />
    </div>
  );
}

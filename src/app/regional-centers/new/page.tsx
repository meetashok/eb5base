'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { useToast } from '@/components/Toast';
import { US_STATES } from '@/lib/constants';

export default function NewRegionalCenterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [uscisRcId, setUscisRcId] = useState('');
  const [website, setWebsite] = useState('');
  const [description, setDescription] = useState('');
  const [hqState, setHqState] = useState('');
  const [operatingStates, setOperatingStates] = useState<string[]>([]);
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.replace('/login?redirect=/regional-centers/new');
        return;
      }
      setCheckingAuth(false);
    });
  }, [router]);

  function toggleState(state: string) {
    setOperatingStates((prev) =>
      prev.includes(state) ? prev.filter((s) => s !== state) : [...prev, state]
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError('Regional center name is required.');
      return;
    }
    setSaving(true);
    setError(null);
    const supabase = createClient();

    const { data: existing } = await supabase
      .from('regional_centers')
      .select('id, name')
      .ilike('name', name.trim())
      .maybeSingle();

    if (existing) {
      setSaving(false);
      setError(
        `A regional center named “${existing.name}” already exists. Open it instead of creating a duplicate.`
      );
      return;
    }

    const { data, error: insertError } = await supabase
      .from('regional_centers')
      .insert({
        name: name.trim(),
        uscis_rc_id: uscisRcId.trim() || null,
        website_url: website.trim() || null,
        description: description.trim() || null,
        headquarters_state: hqState || null,
        operating_states: operatingStates.length ? operatingStates : null,
        contact_email: contactEmail.trim() || null,
        contact_phone: contactPhone.trim() || null,
      })
      .select('id')
      .single();

    setSaving(false);
    if (insertError || !data) {
      setError(insertError?.message || 'Failed to create regional center');
      toast(insertError?.message || 'Failed to create regional center', 'error');
      return;
    }

    toast('Regional center added', 'success');
    router.push(`/rc/${data.id}`);
  }

  if (checkingAuth) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="skeleton-shimmer h-8 w-64 mb-4" />
        <div className="skeleton-shimmer h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-primary mb-2">Add Regional Center</h1>
      <p className="text-sm text-neutral/60 mb-6">
        Please check the{' '}
        <Link href="/regional-centers" className="link link-secondary">
          existing regional centers
        </Link>{' '}
        before adding a new one to avoid duplicates.
      </p>

      <form onSubmit={handleSubmit} className="card card-bordered shadow-sm bg-base-100">
        <div className="card-body gap-4">
          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">RC Name *</span>
            </label>
            <input
              type="text"
              className="input input-bordered"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Regional center name"
            />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">USCIS RC ID</span>
            </label>
            <input
              type="text"
              className="input input-bordered"
              value={uscisRcId}
              onChange={(e) => setUscisRcId(e.target.value)}
              placeholder="e.g. ID1031910107"
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

          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">Headquarters State</span>
            </label>
            <select
              className="select select-bordered"
              value={hqState}
              onChange={(e) => setHqState(e.target.value)}
            >
              <option value="">Select state</option>
              {US_STATES.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">Operating States</span>
            </label>
            <div className="border border-base-300 rounded-lg max-h-48 overflow-auto p-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {US_STATES.map((s) => (
                <label key={s.code} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    className="checkbox checkbox-primary checkbox-sm"
                    checked={operatingStates.includes(s.code)}
                    onChange={() => toggleState(s.code)}
                  />
                  {s.name}
                </label>
              ))}
            </div>
            {operatingStates.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {operatingStates.map((code) => (
                  <button
                    key={code}
                    type="button"
                    className="badge badge-sm rounded-full bg-base-200 gap-1"
                    onClick={() => toggleState(code)}
                  >
                    {US_STATES.find((s) => s.code === code)?.name || code} ✕
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Contact Email</span>
              </label>
              <input
                type="email"
                className="input input-bordered"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
              />
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Contact Phone</span>
              </label>
              <input
                type="tel"
                className="input input-bordered"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
              />
            </div>
          </div>

          {error && <p className="text-error text-sm">{error}</p>}

          <div className="flex gap-3 mt-2">
            <Link href="/regional-centers" className="btn btn-ghost rounded-full flex-1">
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

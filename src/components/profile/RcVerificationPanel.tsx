'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { allocateUniqueSlug, slugify } from '@/lib/slugs';
import type { RcBrand } from '@/lib/types';

export type BrandPick = Pick<RcBrand, 'id' | 'name' | 'slug'>;

type RcVerificationPanelProps = {
  selectedBrand: BrandPick | null;
  onSelectedBrandChange: (brand: BrandPick | null) => void;
  onError?: (message: string) => void;
  signInEmail?: string | null;
  title?: string;
};

function InfoIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4M12 8h.01" strokeLinecap="round" />
    </svg>
  );
}

export default function RcVerificationPanel({
  selectedBrand,
  onSelectedBrandChange,
  onError,
  signInEmail,
  title = 'Regional Center Verification',
}: RcVerificationPanelProps) {
  const [brandSearch, setBrandSearch] = useState(selectedBrand?.name || '');
  const [brandResults, setBrandResults] = useState<BrandPick[]>([]);
  const [showAddBrand, setShowAddBrand] = useState(false);
  const [newBrandName, setNewBrandName] = useState('');
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setBrandSearch(selectedBrand?.name || '');
  }, [selectedBrand]);

  useEffect(() => {
    const q = brandSearch.trim();
    if (q.length < 2 || selectedBrand?.name === q) {
      setBrandResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('rc_brands')
        .select('id, name, slug')
        .ilike('name', `%${q}%`)
        .order('name')
        .limit(10);
      setBrandResults(data || []);
    }, 250);
    return () => clearTimeout(timer);
  }, [brandSearch, selectedBrand]);

  async function addBrand() {
    if (!newBrandName.trim()) return;
    setSaving(true);
    const supabase = createClient();
    const trimmed = newBrandName.trim();

    const { data: existing } = await supabase
      .from('rc_brands')
      .select('id, name, slug')
      .ilike('name', trimmed)
      .maybeSingle();

    if (existing) {
      setSaving(false);
      onSelectedBrandChange(existing);
      setBrandSearch(existing.name);
      setBrandResults([]);
      setShowAddBrand(false);
      return;
    }

    const slug = await allocateUniqueSlug(slugify(trimmed), async (candidate) => {
      const { data, error } = await supabase
        .from('rc_brands')
        .select('id')
        .eq('slug', candidate)
        .maybeSingle();
      if (error && /slug/i.test(error.message)) return false;
      return Boolean(data);
    });

    const { data, error: err } = await supabase
      .from('rc_brands')
      .insert({ name: trimmed, slug })
      .select('id, name, slug')
      .single();

    setSaving(false);
    if (err) {
      onError?.(err.message);
      return;
    }
    if (data) {
      onSelectedBrandChange(data);
      setBrandSearch(data.name);
      setBrandResults([]);
      setShowAddBrand(false);
    }
  }

  async function copyVerifyEmail() {
    try {
      await navigator.clipboard.writeText('verify@eb5base.com');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      onError?.('Could not copy email address');
    }
  }

  return (
    <div>
      <h3 className="text-lg font-bold text-primary mb-4">{title}</h3>

      <div className="form-control mb-4">
        <label className="label">
          <span className="label-text font-medium">Which regional center do you work for?</span>
        </label>
        <input
          type="text"
          className="input input-bordered"
          placeholder="Search regional center brands..."
          value={brandSearch}
          onChange={(e) => {
            setBrandSearch(e.target.value);
            onSelectedBrandChange(null);
            setShowAddBrand(false);
          }}
          autoComplete="off"
        />
        {brandResults.length > 0 && !selectedBrand && (
          <ul className="menu bg-base-100 shadow-lg rounded-lg mt-1 border border-base-300 max-h-48 overflow-auto z-10">
            {brandResults.map((brand) => (
              <li key={brand.id}>
                <button
                  type="button"
                  onClick={() => {
                    onSelectedBrandChange(brand);
                    setBrandSearch(brand.name);
                    setBrandResults([]);
                  }}
                >
                  <span className="font-medium">{brand.name}</span>
                </button>
              </li>
            ))}
          </ul>
        )}

        {brandSearch.length > 2 && brandResults.length === 0 && !selectedBrand && !showAddBrand && (
          <div className="mt-2">
            <button
              type="button"
              className="btn btn-ghost btn-sm text-secondary"
              onClick={() => {
                setShowAddBrand(true);
                setNewBrandName(brandSearch.trim());
              }}
            >
              + Don&apos;t see your regional center? Add it
            </button>
          </div>
        )}
      </div>

      {showAddBrand && (
        <div className="bg-base-200 rounded-lg p-4 mb-4">
          <h4 className="text-sm font-semibold mb-3">Add your regional center</h4>
          <div className="form-control mb-3">
            <label className="label">
              <span className="label-text text-sm">Regional center name</span>
            </label>
            <input
              type="text"
              className="input input-bordered input-sm"
              value={newBrandName}
              onChange={(e) => setNewBrandName(e.target.value)}
            />
          </div>
          <button
            type="button"
            className="btn btn-sm btn-secondary rounded-full"
            disabled={!newBrandName.trim() || saving}
            onClick={addBrand}
          >
            Add Regional Center
          </button>
        </div>
      )}

      {selectedBrand && (
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-5 my-4">
          <h4 className="font-bold text-sm text-primary mb-3">
            Verify your role at {selectedBrand.name}
          </h4>
          <p className="text-sm text-neutral/70 mb-4">
            To confirm you work at this regional center, please send an email from your{' '}
            <strong>work email address</strong> to:
          </p>

          <div className="bg-base-100 rounded-lg p-3 mb-4 flex items-center justify-between border border-base-300 gap-2">
            <span className="font-mono text-sm font-semibold">verify@eb5base.com</span>
            <button type="button" className="btn btn-ghost btn-xs" onClick={copyVerifyEmail}>
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>

          <div className="text-sm text-neutral/70 space-y-2">
            <p>
              <strong>Subject:</strong> Verify - {selectedBrand.name}
            </p>
            <p>
              <strong>Include:</strong> Your name, your position at the regional center
              {signInEmail ? (
                <>
                  , and the email address you used to sign in to EB5 Base (
                  <span className="font-medium">{signInEmail}</span>)
                </>
              ) : (
                ', and the email address you used to sign in to EB5 Base'
              )}
            </p>
          </div>

          <div className="divider my-3" />

          <p className="text-xs text-neutral/50">
            We&apos;ll review your request within 24-48 hours and notify you by email once verified.
            You can use EB5 Base right away while verification is pending.
          </p>
        </div>
      )}

      {!selectedBrand && (
        <div className="bg-base-200 rounded-xl p-5 my-4">
          <div className="flex gap-3 items-start">
            <InfoIcon className="w-6 h-6 text-secondary mt-0.5 shrink-0" />
            <p className="text-sm text-neutral/60">
              Search for and select your regional center brand to start the verification process.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

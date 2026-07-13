'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { useAuthPrompt } from '@/components/AuthPromptProvider';
import AppModal from '@/components/AppModal';
import { isMissingRcBrandMergedInto } from '@/lib/schema-compat';
import type { RcBrand } from '@/lib/types';

interface ReportRcDuplicateButtonProps {
  brandId: string;
  userId: string | null;
}

export default function ReportRcDuplicateButton({
  brandId,
  userId,
}: ReportRcDuplicateButtonProps) {
  const { promptSignIn } = useAuthPrompt();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<RcBrand[]>([]);
  const [selected, setSelected] = useState<RcBrand[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!query.trim() || query.trim().length < 2) {
      setResults([]);
      return;
    }
    const t = setTimeout(async () => {
      const supabase = createClient();
      let res = await supabase
        .from('rc_brands')
        .select('id, name, slug')
        .is('merged_into', null)
        .neq('id', brandId)
        .ilike('name', `%${query.trim()}%`)
        .limit(8);
      if (res.error && isMissingRcBrandMergedInto(res.error.message)) {
        res = await supabase
          .from('rc_brands')
          .select('id, name, slug')
          .neq('id', brandId)
          .ilike('name', `%${query.trim()}%`)
          .limit(8);
      }
      setResults((res.data as RcBrand[]) || []);
    }, 250);
    return () => clearTimeout(t);
  }, [query, brandId]);

  function toggleSelect(b: RcBrand) {
    setSelected((prev) =>
      prev.some((x) => x.id === b.id) ? prev.filter((x) => x.id !== b.id) : [...prev, b]
    );
  }

  function closeModal() {
    setOpen(false);
  }

  async function submit() {
    if (!userId) {
      promptSignIn(`/rc/${brandId}`);
      return;
    }
    if (selected.length === 0) return;
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.from('duplicate_report_groups').insert({
      entity_type: 'rc_brand',
      reported_entity_id: brandId,
      duplicate_entity_ids: selected.map((b) => b.id),
      reported_by: userId,
      status: 'pending',
    });
    setSaving(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    setMessage('Duplicate report submitted. Thank you.');
    setOpen(false);
    setSelected([]);
    setQuery('');
  }

  return (
    <>
      <button
        type="button"
        className="text-meta text-neutral/50 hover:text-copper transition-all duration-150"
        onClick={() => {
          if (!userId) {
            promptSignIn(`/rc/${brandId}`);
            return;
          }
          setOpen(true);
        }}
      >
        Report duplicate
      </button>
      {message && <p className="text-meta text-success">{message}</p>}

      <AppModal open={open} onClose={closeModal} boxClassName="max-w-lg">
        <h3 className="font-bold text-lg text-primary">Report duplicate RC</h3>
        <p className="text-sm text-neutral/70 py-2">
          Select regional center listings that duplicate this one.
        </p>
        <input
          type="search"
          className="input input-bordered w-full"
          placeholder="Search regional centers…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <ul className="mt-3 max-h-48 overflow-auto space-y-1">
          {results.map((r) => {
            const isSelected = selected.some((x) => x.id === r.id);
            return (
              <li key={r.id}>
                <button
                  type="button"
                  className={`w-full text-left px-3 py-2 rounded-lg transition-all duration-150 ${
                    isSelected ? 'bg-copper text-white' : 'hover:bg-base-200'
                  }`}
                  onClick={() => toggleSelect(r)}
                >
                  <span className="font-medium">{r.name}</span>
                </button>
              </li>
            );
          })}
        </ul>
        {selected.length > 0 && (
          <p className="text-meta text-neutral/60 mt-2">
            {selected.length} listing{selected.length === 1 ? '' : 's'} selected
          </p>
        )}
        <div className="modal-action">
          <button type="button" className="btn btn-ghost" onClick={closeModal}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={selected.length === 0 || saving}
            onClick={submit}
          >
            {saving ? 'Submitting…' : 'Submit report'}
          </button>
        </div>
      </AppModal>
    </>
  );
}

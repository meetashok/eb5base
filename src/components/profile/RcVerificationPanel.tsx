'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import type { RegionalCenter } from '@/lib/types';

export type RcPick = Pick<RegionalCenter, 'id' | 'name' | 'uscis_rc_id'>;

type RcVerificationPanelProps = {
  selectedRc: RcPick | null;
  onSelectedRcChange: (rc: RcPick | null) => void;
  onError?: (message: string) => void;
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
  selectedRc,
  onSelectedRcChange,
  onError,
  title = 'Regional Center Verification',
}: RcVerificationPanelProps) {
  const [rcSearch, setRcSearch] = useState(selectedRc?.name || '');
  const [rcResults, setRcResults] = useState<RcPick[]>([]);
  const [showAddRc, setShowAddRc] = useState(false);
  const [newRcName, setNewRcName] = useState('');
  const [newRcId, setNewRcId] = useState('');
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setRcSearch(selectedRc?.name || '');
  }, [selectedRc]);

  useEffect(() => {
    const q = rcSearch.trim();
    if (q.length < 2 || selectedRc?.name === q) {
      setRcResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('regional_centers')
        .select('id, name, uscis_rc_id')
        .ilike('name', `%${q}%`)
        .order('name')
        .limit(10);
      setRcResults(data || []);
    }, 250);
    return () => clearTimeout(timer);
  }, [rcSearch, selectedRc]);

  async function addRegionalCenter() {
    if (!newRcName.trim()) return;
    setSaving(true);
    const supabase = createClient();
    const { data, error: err } = await supabase
      .from('regional_centers')
      .insert({
        name: newRcName.trim(),
        uscis_rc_id: newRcId.trim() || null,
      })
      .select('id, name, uscis_rc_id')
      .single();
    setSaving(false);
    if (err) {
      onError?.(err.message);
      return;
    }
    if (data) {
      onSelectedRcChange(data);
      setRcSearch(data.name);
      setRcResults([]);
      setShowAddRc(false);
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
          placeholder="Search regional centers..."
          value={rcSearch}
          onChange={(e) => {
            setRcSearch(e.target.value);
            onSelectedRcChange(null);
            setShowAddRc(false);
          }}
          autoComplete="off"
        />
        {rcResults.length > 0 && !selectedRc && (
          <ul className="menu bg-base-100 shadow-lg rounded-lg mt-1 border border-base-300 max-h-48 overflow-auto z-10">
            {rcResults.map((rc) => (
              <li key={rc.id}>
                <button
                  type="button"
                  onClick={() => {
                    onSelectedRcChange(rc);
                    setRcSearch(rc.name);
                    setRcResults([]);
                  }}
                >
                  <span className="font-medium">{rc.name}</span>
                  {rc.uscis_rc_id && (
                    <span className="text-xs text-neutral/50 ml-2">{rc.uscis_rc_id}</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}

        {rcSearch.length > 2 && rcResults.length === 0 && !selectedRc && !showAddRc && (
          <div className="mt-2">
            <button
              type="button"
              className="btn btn-ghost btn-sm text-secondary"
              onClick={() => {
                setShowAddRc(true);
                setNewRcName(rcSearch.trim());
              }}
            >
              + Don&apos;t see your regional center? Add it
            </button>
          </div>
        )}
      </div>

      {showAddRc && (
        <div className="bg-base-200 rounded-lg p-4 mb-4">
          <h4 className="text-sm font-semibold mb-3">Add your regional center</h4>
          <div className="form-control mb-3">
            <label className="label">
              <span className="label-text text-sm">RC Name</span>
            </label>
            <input
              type="text"
              className="input input-bordered input-sm"
              value={newRcName}
              onChange={(e) => setNewRcName(e.target.value)}
            />
          </div>
          <div className="form-control mb-3">
            <label className="label">
              <span className="label-text text-sm">USCIS RC ID</span>
            </label>
            <input
              type="text"
              className="input input-bordered input-sm"
              value={newRcId}
              onChange={(e) => setNewRcId(e.target.value)}
              placeholder="e.g. ID1031910107 (optional)"
            />
          </div>
          <button
            type="button"
            className="btn btn-sm btn-secondary rounded-full"
            disabled={!newRcName.trim() || saving}
            onClick={addRegionalCenter}
          >
            Add Regional Center
          </button>
        </div>
      )}

      {selectedRc && (
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-5 my-4">
          <h4 className="font-bold text-sm text-primary mb-3">
            Verify your role at {selectedRc.name}
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
              <strong>Subject:</strong> Verify - {selectedRc.name}
            </p>
            <p>
              <strong>Include:</strong> Your name and your position at the regional center
            </p>
          </div>

          <div className="divider my-3" />

          <p className="text-xs text-neutral/50">
            We&apos;ll review your request within 24-48 hours and notify you by email once verified.
            You can use EB5 Base right away while verification is pending.
          </p>
        </div>
      )}

      {!selectedRc && (
        <div className="bg-base-200 rounded-xl p-5 my-4">
          <div className="flex gap-3 items-start">
            <InfoIcon className="w-6 h-6 text-secondary mt-0.5 shrink-0" />
            <p className="text-sm text-neutral/60">
              Search for and select your regional center to start the verification process.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

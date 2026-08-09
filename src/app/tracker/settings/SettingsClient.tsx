'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import CountrySelect from '@/components/CountrySelect';
import CopyButton from '@/components/CopyButton';
import {
  CLASSIFICATION_OPTIONS,
  FORM_TYPES,
  I956F_STATUS_OPTIONS,
  NOTIFY_MODE_OPTIONS,
  WOM_STATUS_OPTIONS,
} from '@/lib/constants';
import { normalizeReceiptInput, receiptValidationMessage } from '@/lib/receipt-validation';
import type {
  CaseWithReceipt,
  FormType,
  IndividualWithCases,
  Profile,
  WomCase,
  WomStatus,
} from '@/lib/types';

export default function SettingsClient({
  profile,
  individuals,
  wom,
}: {
  profile: Profile;
  individuals: IndividualWithCases[];
  wom: WomCase[];
}) {
  const router = useRouter();
  const [msg, setMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [localProfile, setLocalProfile] = useState(profile);
  const [localIndividuals, setLocalIndividuals] = useState(individuals);
  const [localWom, setLocalWom] = useState(wom);
  const [newMemberTag, setNewMemberTag] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function saveProfile() {
    setSaving(true);
    setMsg(null);
    const res = await fetch('/api/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        project_name: localProfile.project_name,
        regional_center_name: localProfile.regional_center_name,
        classification: localProfile.classification,
        i956f_status: localProfile.i956f_status,
        i956f_approval_date: localProfile.i956f_approval_date,
        country_of_birth: localProfile.country_of_birth,
        attorney_name: localProfile.attorney_name,
        agent_name: localProfile.agent_name,
        email_notifications: localProfile.email_notifications,
        notify_mode: localProfile.notify_mode,
        display_name: localProfile.display_name,
      }),
    });
    setSaving(false);
    setMsg(res.ok ? 'Profile saved.' : 'Save failed.');
    if (res.ok) router.refresh();
  }

  async function apiAction(body: Record<string, unknown>) {
    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    if (!res.ok) {
      setMsg(json.error || 'Action failed');
      return false;
    }
    router.refresh();
    return true;
  }

  const allCases = useMemo(
    () => localIndividuals.flatMap((i) => i.cases.map((c) => ({ ...c, tag: i.tag }))),
    [localIndividuals]
  );

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-8">
      <div>
        <p className="text-xs uppercase tracking-[0.22em] font-semibold text-secondary mb-2">Account</p>
        <h1 className="text-3xl font-bold text-primary">Settings</h1>
      </div>

      {msg && <div className="alert text-sm">{msg}</div>}

      <section className="card-elevated">
        <div className="card-body gap-3">
          <h2 className="font-bold text-primary text-lg">Profile</h2>
          <label className="form-control">
            <span className="label-text">Display name</span>
            <input
              className="input input-bordered"
              value={localProfile.display_name || ''}
              onChange={(e) => setLocalProfile({ ...localProfile, display_name: e.target.value })}
            />
          </label>
          <label className="form-control">
            <span className="label-text">Project name</span>
            <input
              className="input input-bordered"
              value={localProfile.project_name || ''}
              onChange={(e) => setLocalProfile({ ...localProfile, project_name: e.target.value })}
            />
          </label>
          <label className="form-control">
            <span className="label-text">Regional center</span>
            <input
              className="input input-bordered"
              value={localProfile.regional_center_name || ''}
              onChange={(e) =>
                setLocalProfile({ ...localProfile, regional_center_name: e.target.value })
              }
            />
          </label>
          <label className="form-control">
            <span className="label-text">Classification</span>
            <select
              className="select select-bordered"
              value={localProfile.classification || ''}
              onChange={(e) =>
                setLocalProfile({
                  ...localProfile,
                  classification: (e.target.value || null) as Profile['classification'],
                })
              }
            >
              <option value="">Select…</option>
              {CLASSIFICATION_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label className="form-control">
            <span className="label-text">I-956F status</span>
            <select
              className="select select-bordered"
              value={localProfile.i956f_status || ''}
              onChange={(e) =>
                setLocalProfile({
                  ...localProfile,
                  i956f_status: (e.target.value || null) as Profile['i956f_status'],
                })
              }
            >
              <option value="">Select…</option>
              {I956F_STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <div>
            <span className="label-text mb-1 block">Country of birth</span>
            <CountrySelect
              value={localProfile.country_of_birth}
              onChange={(c) =>
                setLocalProfile({ ...localProfile, country_of_birth: c?.code || null })
              }
            />
          </div>
          <label className="form-control">
            <span className="label-text">Attorney</span>
            <input
              className="input input-bordered"
              value={localProfile.attorney_name || ''}
              onChange={(e) => setLocalProfile({ ...localProfile, attorney_name: e.target.value })}
            />
          </label>
          <label className="form-control">
            <span className="label-text">Agent</span>
            <input
              className="input input-bordered"
              value={localProfile.agent_name || ''}
              onChange={(e) => setLocalProfile({ ...localProfile, agent_name: e.target.value })}
            />
          </label>
          <button type="button" className="btn btn-primary rounded-full self-start" onClick={saveProfile} disabled={saving}>
            {saving ? <span className="loading loading-spinner loading-sm" /> : 'Save profile'}
          </button>
        </div>
      </section>

      <section className="card-elevated">
        <div className="card-body gap-3">
          <h2 className="font-bold text-primary text-lg">Family members</h2>
          {localIndividuals.map((ind) => (
            <div key={ind.id} className="flex gap-2 items-center">
              <input
                className="input input-bordered flex-1"
                value={ind.tag}
                onChange={(e) =>
                  setLocalIndividuals(
                    localIndividuals.map((i) =>
                      i.id === ind.id ? { ...i, tag: e.target.value } : i
                    )
                  )
                }
                onBlur={() => apiAction({ action: 'update_individual', id: ind.id, tag: ind.tag })}
              />
              {!ind.is_primary && (
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={async () => {
                    if (await apiAction({ action: 'delete_individual', id: ind.id })) {
                      setLocalIndividuals(localIndividuals.filter((i) => i.id !== ind.id));
                    }
                  }}
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          <div className="flex gap-2">
            <input
              className="input input-bordered flex-1"
              placeholder="New family member label"
              value={newMemberTag}
              onChange={(e) => setNewMemberTag(e.target.value)}
            />
            <button
              type="button"
              className="btn btn-outline rounded-full"
              onClick={async () => {
                const ok = await apiAction({
                  action: 'add_individual',
                  tag: newMemberTag || 'Family member',
                });
                if (ok) {
                  setNewMemberTag('');
                  router.refresh();
                }
              }}
            >
              Add
            </button>
          </div>
        </div>
      </section>

      <section className="card-elevated">
        <div className="card-body gap-4">
          <h2 className="font-bold text-primary text-lg">Receipt numbers</h2>
          {allCases.map((c: CaseWithReceipt & { tag: string }) => (
            <CaseEditor
              key={c.id}
              caseRow={c}
              onSave={async (receiptNumber, filedDate, formType) => {
                await apiAction({
                  action: 'upsert_case',
                  caseId: c.id,
                  individualId: c.individual_id,
                  receiptNumber,
                  filedDate,
                  formType,
                });
              }}
              onDelete={async () => {
                if (await apiAction({ action: 'delete_case', caseId: c.id })) {
                  setLocalIndividuals(
                    localIndividuals.map((i) => ({
                      ...i,
                      cases: i.cases.filter((x) => x.id !== c.id),
                    }))
                  );
                }
              }}
            />
          ))}
          <AddCaseForm
            individuals={localIndividuals}
            onAdd={async (payload) => {
              await apiAction({ action: 'upsert_case', ...payload });
              router.refresh();
            }}
          />
        </div>
      </section>

      <section className="card-elevated">
        <div className="card-body gap-3">
          <h2 className="font-bold text-primary text-lg">WOM</h2>
          {localWom.map((w) => (
            <div key={w.id} className="border border-base-300 rounded-xl p-3 space-y-2">
              <p className="text-sm font-medium">
                {w.related_form_type} ·{' '}
                {WOM_STATUS_OPTIONS.find((o) => o.value === w.wom_status)?.label}
              </p>
              <button
                type="button"
                className="btn btn-ghost btn-xs"
                onClick={async () => {
                  if (await apiAction({ action: 'delete_wom', womId: w.id })) {
                    setLocalWom(localWom.filter((x) => x.id !== w.id));
                  }
                }}
              >
                Remove
              </button>
            </div>
          ))}
          <WomForm
            onSave={async (payload) => {
              await apiAction({ action: 'upsert_wom', ...payload });
              router.refresh();
            }}
          />
        </div>
      </section>

      <section className="card-elevated">
        <div className="card-body gap-3">
          <h2 className="font-bold text-primary text-lg">Notifications</h2>
          <label className="label cursor-pointer justify-start gap-3">
            <input
              type="checkbox"
              className="toggle toggle-secondary"
              checked={localProfile.email_notifications}
              onChange={(e) =>
                setLocalProfile({ ...localProfile, email_notifications: e.target.checked })
              }
            />
            <span className="label-text">Email notifications</span>
          </label>
          <label className="form-control max-w-xs">
            <span className="label-text">Delivery</span>
            <select
              className="select select-bordered"
              value={localProfile.notify_mode || 'immediate'}
              onChange={(e) =>
                setLocalProfile({
                  ...localProfile,
                  notify_mode: e.target.value as Profile['notify_mode'],
                })
              }
            >
              {NOTIFY_MODE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <button type="button" className="btn btn-primary rounded-full self-start" onClick={saveProfile}>
            Save notifications
          </button>
        </div>
      </section>

      <section className="card-elevated border-error/30">
        <div className="card-body gap-3">
          <h2 className="font-bold text-primary text-lg">Data</h2>
          <a href="/api/account" className="btn btn-outline rounded-full self-start">
            Export My Data
          </a>
          {!confirmDelete ? (
            <button
              type="button"
              className="btn btn-error btn-outline rounded-full self-start"
              onClick={() => setConfirmDelete(true)}
            >
              Delete My Account
            </button>
          ) : (
            <div className="alert alert-error text-sm flex flex-col sm:flex-row gap-3 items-start">
              <span>Permanently delete your account and all data? This cannot be undone.</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="btn btn-error btn-sm"
                  onClick={async () => {
                    const res = await fetch('/api/account', { method: 'DELETE' });
                    if (res.ok) {
                      window.location.href = '/';
                    } else {
                      setMsg('Delete failed');
                    }
                  }}
                >
                  Confirm delete
                </button>
                <button type="button" className="btn btn-sm" onClick={() => setConfirmDelete(false)}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function CaseEditor({
  caseRow,
  onSave,
  onDelete,
}: {
  caseRow: CaseWithReceipt & { tag: string };
  onSave: (receipt: string, filedDate: string | null, formType: FormType) => Promise<void>;
  onDelete: () => Promise<void>;
}) {
  const [receipt, setReceipt] = useState(caseRow.receipt_number || '');
  const [filedDate, setFiledDate] = useState(caseRow.filed_date || '');
  const msg = receiptValidationMessage(receipt);

  return (
    <div className="border border-base-300 rounded-xl p-3 space-y-2">
      <p className="text-sm font-medium">
        {caseRow.tag} · {caseRow.form_type}
      </p>
      <div className="flex items-center gap-2 font-mono text-sm">
        <input
          className={`input input-bordered input-sm flex-1 uppercase ${msg && receipt ? 'input-error' : ''}`}
          value={receipt}
          onChange={(e) => setReceipt(normalizeReceiptInput(e.target.value))}
        />
        {receipt && !msg && <CopyButton value={receipt} />}
      </div>
      {msg && receipt && <p className="text-xs text-error">{msg}</p>}
      <input
        type="date"
        className="input input-bordered input-sm"
        value={filedDate}
        onChange={(e) => setFiledDate(e.target.value)}
      />
      <div className="flex gap-2">
        <button
          type="button"
          className="btn btn-primary btn-sm rounded-full"
          disabled={Boolean(msg)}
          onClick={() => onSave(receipt, filedDate || null, caseRow.form_type)}
        >
          Save
        </button>
        <button type="button" className="btn btn-ghost btn-sm" onClick={onDelete}>
          Remove
        </button>
      </div>
    </div>
  );
}

function AddCaseForm({
  individuals,
  onAdd,
}: {
  individuals: IndividualWithCases[];
  onAdd: (payload: {
    individualId: string;
    receiptNumber: string;
    filedDate: string | null;
    formType: FormType;
  }) => Promise<void>;
}) {
  const [individualId, setIndividualId] = useState(individuals[0]?.id || '');
  const [formType, setFormType] = useState<FormType>('I-485');
  const [receipt, setReceipt] = useState('');
  const [filedDate, setFiledDate] = useState('');
  const msg = receiptValidationMessage(receipt);

  return (
    <div className="border border-dashed border-base-300 rounded-xl p-3 space-y-2">
      <p className="text-sm font-medium">Add receipt</p>
      <select
        className="select select-bordered select-sm w-full"
        value={individualId}
        onChange={(e) => setIndividualId(e.target.value)}
      >
        {individuals.map((i) => (
          <option key={i.id} value={i.id}>
            {i.tag}
          </option>
        ))}
      </select>
      <select
        className="select select-bordered select-sm w-full"
        value={formType}
        onChange={(e) => setFormType(e.target.value as FormType)}
      >
        {FORM_TYPES.map((f) => (
          <option key={f} value={f}>
            {f}
          </option>
        ))}
      </select>
      <input
        className="input input-bordered input-sm w-full uppercase"
        placeholder="Receipt number"
        value={receipt}
        onChange={(e) => setReceipt(normalizeReceiptInput(e.target.value))}
      />
      <input
        type="date"
        className="input input-bordered input-sm"
        value={filedDate}
        onChange={(e) => setFiledDate(e.target.value)}
      />
      <button
        type="button"
        className="btn btn-outline btn-sm rounded-full"
        disabled={!receipt || Boolean(msg) || !individualId}
        onClick={async () => {
          await onAdd({
            individualId,
            receiptNumber: receipt,
            filedDate: filedDate || null,
            formType,
          });
          setReceipt('');
          setFiledDate('');
        }}
      >
        Add receipt
      </button>
    </div>
  );
}

function WomForm({
  onSave,
}: {
  onSave: (payload: {
    relatedFormType: FormType;
    courtDistrict: string;
    filedDate: string | null;
    womStatus: WomStatus;
  }) => Promise<void>;
}) {
  const [relatedFormType, setRelatedFormType] = useState<FormType>('I-526E');
  const [courtDistrict, setCourtDistrict] = useState('');
  const [filedDate, setFiledDate] = useState('');
  const [womStatus, setWomStatus] = useState<WomStatus>('filed');

  return (
    <div className="border border-dashed border-base-300 rounded-xl p-3 space-y-2">
      <p className="text-sm font-medium">Add WOM</p>
      <select
        className="select select-bordered select-sm w-full"
        value={relatedFormType}
        onChange={(e) => setRelatedFormType(e.target.value as FormType)}
      >
        {FORM_TYPES.map((f) => (
          <option key={f} value={f}>
            {f}
          </option>
        ))}
      </select>
      <input
        className="input input-bordered input-sm w-full"
        placeholder="Court / district"
        value={courtDistrict}
        onChange={(e) => setCourtDistrict(e.target.value)}
      />
      <input
        type="date"
        className="input input-bordered input-sm"
        value={filedDate}
        onChange={(e) => setFiledDate(e.target.value)}
      />
      <select
        className="select select-bordered select-sm w-full"
        value={womStatus}
        onChange={(e) => setWomStatus(e.target.value as WomStatus)}
      >
        {WOM_STATUS_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <button
        type="button"
        className="btn btn-outline btn-sm rounded-full"
        onClick={() =>
          onSave({
            relatedFormType,
            courtDistrict,
            filedDate: filedDate || null,
            womStatus,
          })
        }
      >
        Save WOM
      </button>
    </div>
  );
}

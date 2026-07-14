'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import CountrySelect from '@/components/CountrySelect';
import {
  CLASSIFICATION_OPTIONS,
  DERIVATIVE_FORM_TYPES,
  FORM_TYPES,
  I956F_STATUS_OPTIONS,
  PRIMARY_FORM_TYPES,
  WOM_STATUS_OPTIONS,
} from '@/lib/constants';
import { normalizeReceiptInput, receiptValidationMessage } from '@/lib/receipt-validation';
import type { FormType, WomStatus } from '@/lib/types';

const STORAGE_KEY = 'eb5base_onboarding_draft_v1';

type ReceiptDraft = { formType: FormType; receiptNumber: string; filedDate: string };
type IndividualDraft = { tag: string; isPrimary: boolean; receipts: ReceiptDraft[] };

type Draft = {
  step: number;
  projectName: string;
  regionalCenterName: string;
  classification: string;
  i956fStatus: string;
  i956fApprovalDate: string;
  countryOfBirth: string;
  attorneyName: string;
  agentName: string;
  individuals: IndividualDraft[];
  hasWom: boolean;
  womFormType: FormType;
  womCourt: string;
  womFiledDate: string;
  womStatus: WomStatus;
  consent: boolean;
};

function emptyReceipts(primary: boolean): ReceiptDraft[] {
  const types = primary ? PRIMARY_FORM_TYPES : DERIVATIVE_FORM_TYPES;
  return types.map((formType) => ({ formType, receiptNumber: '', filedDate: '' }));
}

function defaultDraft(displayName: string): Draft {
  return {
    step: 1,
    projectName: '',
    regionalCenterName: '',
    classification: '',
    i956fStatus: '',
    i956fApprovalDate: '',
    countryOfBirth: '',
    attorneyName: '',
    agentName: '',
    individuals: [
      {
        tag: displayName ? `${displayName} (primary)` : 'Primary applicant',
        isPrimary: true,
        receipts: emptyReceipts(true),
      },
    ],
    hasWom: false,
    womFormType: 'I-526E',
    womCourt: '',
    womFiledDate: '',
    womStatus: 'filed',
    consent: false,
  };
}

function ReceiptField({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
}) {
  const msg = receiptValidationMessage(value);
  return (
    <label className="form-control w-full">
      <span className="label-text text-sm font-medium">{label}</span>
      <input
        className={`input input-bordered w-full font-mono uppercase ${msg && value ? 'input-error' : ''}`}
        value={value}
        maxLength={13}
        placeholder="IOE0932612345"
        onChange={(e) => onChange(normalizeReceiptInput(e.target.value))}
      />
      {value && msg && <span className="label-text-alt text-error mt-1">{msg}</span>}
    </label>
  );
}

export default function OnboardingClient({
  displayName,
  email,
}: {
  displayName: string;
  email: string | null;
}) {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft>(() => defaultDraft(displayName));
  const [hydrated, setHydrated] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [projectSuggestions, setProjectSuggestions] = useState<string[]>([]);
  const [rcSuggestions, setRcSuggestions] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Draft;
        setDraft({ ...defaultDraft(displayName), ...parsed });
      }
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, [displayName]);

  useEffect(() => {
    if (!hydrated) return;
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  }, [draft, hydrated]);

  useEffect(() => {
    if (draft.step !== 1) return;
    const t = setTimeout(async () => {
      try {
        const [p, r] = await Promise.all([
          fetch(`/api/suggestions?type=project&q=${encodeURIComponent(draft.projectName)}`).then((x) =>
            x.ok ? x.json() : { suggestions: [] }
          ),
          fetch(`/api/suggestions?type=rc&q=${encodeURIComponent(draft.regionalCenterName)}`).then((x) =>
            x.ok ? x.json() : { suggestions: [] }
          ),
        ]);
        setProjectSuggestions(p.suggestions || []);
        setRcSuggestions(r.suggestions || []);
      } catch {
        /* ignore */
      }
    }, 250);
    return () => clearTimeout(t);
  }, [draft.projectName, draft.regionalCenterName, draft.step]);

  const step = draft.step;
  const progress = useMemo(() => `${step} / 5`, [step]);

  function update<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  function go(next: number) {
    setError(null);
    setDraft((d) => ({ ...d, step: next }));
  }

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectName: draft.projectName,
          regionalCenterName: draft.regionalCenterName,
          classification: draft.classification || null,
          i956fStatus: draft.i956fStatus || null,
          i956fApprovalDate: draft.i956fApprovalDate || null,
          countryOfBirth: draft.countryOfBirth || null,
          attorneyName: draft.attorneyName,
          agentName: draft.agentName,
          individuals: draft.individuals.map((ind) => ({
            tag: ind.tag,
            isPrimary: ind.isPrimary,
            receipts: ind.receipts.filter((r) => r.receiptNumber.trim()),
          })),
          wom: draft.hasWom
            ? {
                relatedFormType: draft.womFormType,
                courtDistrict: draft.womCourt,
                filedDate: draft.womFiledDate || null,
                womStatus: draft.womStatus,
              }
            : null,
          consent: draft.consent,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || 'Submit failed');
        setSubmitting(false);
        return;
      }
      sessionStorage.removeItem(STORAGE_KEY);
      router.push('/timeline');
      router.refresh();
    } catch {
      setError('Network error');
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="mb-8">
        <p className="text-xs uppercase tracking-[0.22em] font-semibold text-secondary mb-2">
          Setup · Step {progress}
        </p>
        <h1 className="text-3xl font-bold text-primary">Welcome{displayName ? `, ${displayName.split(' ')[0]}` : ''}</h1>
        <p className="text-neutral/60 mt-2 text-sm">
          {email ? `Signed in as ${email}. ` : ''}
          You can skip project details and WOM for now and fill them in later from Settings.
        </p>
        <progress className="progress progress-secondary w-full mt-4" value={step} max={5} />
      </div>

      {error && <div className="alert alert-error mb-4 text-sm">{error}</div>}

      {step === 1 && (
        <div className="card-elevated">
          <div className="card-body gap-4">
            <h2 className="font-bold text-lg text-primary">Project details</h2>
            <label className="form-control">
              <span className="label-text">Project name</span>
              <input
                className="input input-bordered"
                list="project-suggestions"
                value={draft.projectName}
                onChange={(e) => update('projectName', e.target.value)}
              />
              <datalist id="project-suggestions">
                {projectSuggestions.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            </label>
            <label className="form-control">
              <span className="label-text">Regional center name</span>
              <input
                className="input input-bordered"
                list="rc-suggestions"
                value={draft.regionalCenterName}
                onChange={(e) => update('regionalCenterName', e.target.value)}
              />
              <datalist id="rc-suggestions">
                {rcSuggestions.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            </label>
            <fieldset>
              <legend className="text-sm font-medium mb-2">Classification</legend>
              <div className="flex flex-wrap gap-3">
                {CLASSIFICATION_OPTIONS.map((o) => (
                  <label key={o.value} className="label cursor-pointer gap-2 justify-start">
                    <input
                      type="radio"
                      className="radio radio-sm radio-secondary"
                      checked={draft.classification === o.value}
                      onChange={() => update('classification', o.value)}
                    />
                    <span className="label-text">{o.label}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            <fieldset>
              <legend className="text-sm font-medium mb-2">I-956F status</legend>
              <div className="flex flex-wrap gap-3">
                {I956F_STATUS_OPTIONS.map((o) => (
                  <label key={o.value} className="label cursor-pointer gap-2 justify-start">
                    <input
                      type="radio"
                      className="radio radio-sm radio-secondary"
                      checked={draft.i956fStatus === o.value}
                      onChange={() => update('i956fStatus', o.value)}
                    />
                    <span className="label-text">{o.label}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            {draft.i956fStatus === 'approved' && (
              <label className="form-control">
                <span className="label-text">I-956F approval date</span>
                <input
                  type="date"
                  className="input input-bordered"
                  value={draft.i956fApprovalDate}
                  onChange={(e) => update('i956fApprovalDate', e.target.value)}
                />
              </label>
            )}
            <div>
              <span className="label-text mb-1 block">Country of birth (primary applicant)</span>
              <CountrySelect
                value={draft.countryOfBirth || null}
                onChange={(c) => update('countryOfBirth', c?.code || '')}
              />
            </div>
            <label className="form-control">
              <span className="label-text">Attorney name (optional)</span>
              <input
                className="input input-bordered"
                value={draft.attorneyName}
                onChange={(e) => update('attorneyName', e.target.value)}
              />
            </label>
            <label className="form-control">
              <span className="label-text">Agent name (optional)</span>
              <input
                className="input input-bordered"
                value={draft.agentName}
                onChange={(e) => update('agentName', e.target.value)}
              />
            </label>
            <div className="flex justify-between gap-3 mt-2">
              <button type="button" className="btn btn-ghost rounded-full" onClick={() => go(2)}>
                Skip for now
              </button>
              <button type="button" className="btn btn-primary rounded-full" onClick={() => go(2)}>
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="card-elevated">
          <div className="card-body gap-4">
            <h2 className="font-bold text-lg text-primary">Family members</h2>
            <p className="text-sm text-neutral/60">
              Add everyone whose cases you want to track. The primary applicant is listed first.
            </p>
            {draft.individuals.map((ind, idx) => (
              <div key={idx} className="flex gap-2 items-end">
                <label className="form-control flex-1">
                  <span className="label-text">Label</span>
                  <input
                    className="input input-bordered"
                    value={ind.tag}
                    onChange={(e) => {
                      const individuals = [...draft.individuals];
                      individuals[idx] = { ...ind, tag: e.target.value };
                      update('individuals', individuals);
                    }}
                  />
                </label>
                {!ind.isPrimary && (
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() =>
                      update(
                        'individuals',
                        draft.individuals.filter((_, i) => i !== idx)
                      )
                    }
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              className="btn btn-outline btn-sm rounded-full self-start"
              onClick={() =>
                update('individuals', [
                  ...draft.individuals,
                  {
                    tag: 'Family member',
                    isPrimary: false,
                    receipts: emptyReceipts(false),
                  },
                ])
              }
            >
              Add Family Member
            </button>
            <div className="flex justify-between gap-3 mt-2">
              <button type="button" className="btn btn-ghost rounded-full" onClick={() => go(1)}>
                Back
              </button>
              <button type="button" className="btn btn-primary rounded-full" onClick={() => go(3)}>
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <h2 className="font-bold text-lg text-primary">Receipt numbers</h2>
          {draft.individuals.map((ind, idx) => (
            <div key={idx} className="card-elevated">
              <div className="card-body gap-4">
                <h3 className="font-semibold text-primary">{ind.tag}</h3>
                {ind.receipts.map((r, rIdx) => (
                  <div key={r.formType} className="grid sm:grid-cols-2 gap-3">
                    <ReceiptField
                      label={`${r.formType} receipt${ind.isPrimary || r.formType !== 'I-526E' ? (r.formType === 'I-526E' ? '' : ' (optional)') : ''}`}
                      value={r.receiptNumber}
                      onChange={(v) => {
                        const individuals = [...draft.individuals];
                        const receipts = [...ind.receipts];
                        receipts[rIdx] = { ...r, receiptNumber: v };
                        individuals[idx] = { ...ind, receipts };
                        update('individuals', individuals);
                      }}
                    />
                    <label className="form-control">
                      <span className="label-text">Filing date</span>
                      <input
                        type="date"
                        className="input input-bordered"
                        value={r.filedDate}
                        onChange={(e) => {
                          const individuals = [...draft.individuals];
                          const receipts = [...ind.receipts];
                          receipts[rIdx] = { ...r, filedDate: e.target.value };
                          individuals[idx] = { ...ind, receipts };
                          update('individuals', individuals);
                        }}
                      />
                    </label>
                  </div>
                ))}
              </div>
            </div>
          ))}
          <div className="flex justify-between gap-3">
            <button type="button" className="btn btn-ghost rounded-full" onClick={() => go(2)}>
              Back
            </button>
            <button type="button" className="btn btn-primary rounded-full" onClick={() => go(4)}>
              Continue
            </button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="card-elevated">
          <div className="card-body gap-4">
            <h2 className="font-bold text-lg text-primary">Writ of Mandamus (optional)</h2>
            <label className="label cursor-pointer justify-start gap-3">
              <input
                type="checkbox"
                className="toggle toggle-secondary"
                checked={draft.hasWom}
                onChange={(e) => update('hasWom', e.target.checked)}
              />
              <span className="label-text">I have filed a WOM</span>
            </label>
            {draft.hasWom && (
              <>
                <label className="form-control">
                  <span className="label-text">Form type</span>
                  <select
                    className="select select-bordered"
                    value={draft.womFormType}
                    onChange={(e) => update('womFormType', e.target.value as FormType)}
                  >
                    {FORM_TYPES.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="form-control">
                  <span className="label-text">Court / district</span>
                  <input
                    className="input input-bordered"
                    value={draft.womCourt}
                    onChange={(e) => update('womCourt', e.target.value)}
                  />
                </label>
                <label className="form-control">
                  <span className="label-text">Filing date</span>
                  <input
                    type="date"
                    className="input input-bordered"
                    value={draft.womFiledDate}
                    onChange={(e) => update('womFiledDate', e.target.value)}
                  />
                </label>
                <label className="form-control">
                  <span className="label-text">WOM status</span>
                  <select
                    className="select select-bordered"
                    value={draft.womStatus}
                    onChange={(e) => update('womStatus', e.target.value as WomStatus)}
                  >
                    {WOM_STATUS_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </label>
              </>
            )}
            <div className="flex justify-between gap-3 mt-2">
              <button type="button" className="btn btn-ghost rounded-full" onClick={() => go(3)}>
                Back
              </button>
              <div className="flex gap-2">
                <button type="button" className="btn btn-ghost rounded-full" onClick={() => go(5)}>
                  Skip
                </button>
                <button type="button" className="btn btn-primary rounded-full" onClick={() => go(5)}>
                  Continue
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {step === 5 && (
        <div className="card-elevated">
          <div className="card-body gap-4">
            <h2 className="font-bold text-lg text-primary">Review and submit</h2>
            <div className="text-sm space-y-2 text-neutral/80">
              <p>
                <strong>Project:</strong> {draft.projectName || '—'} / {draft.regionalCenterName || '—'}
              </p>
              <p>
                <strong>Classification:</strong> {draft.classification || '—'} ·{' '}
                <strong>I-956F:</strong> {draft.i956fStatus || '—'}
              </p>
              <p>
                <strong>People:</strong>{' '}
                {draft.individuals.map((i) => i.tag).join(', ')}
              </p>
              <p>
                <strong>Receipts:</strong>{' '}
                {draft.individuals.reduce(
                  (n, i) => n + i.receipts.filter((r) => r.receiptNumber).length,
                  0
                )}{' '}
                entered
              </p>
              <p>
                <strong>WOM:</strong> {draft.hasWom ? `${draft.womFormType} · ${draft.womStatus}` : 'None'}
              </p>
            </div>
            <label className="label cursor-pointer justify-start gap-3 items-start">
              <input
                type="checkbox"
                className="checkbox checkbox-secondary mt-1"
                checked={draft.consent}
                onChange={(e) => update('consent', e.target.checked)}
              />
              <span className="label-text text-sm leading-relaxed">
                I understand my receipt numbers will be encrypted and used solely to check case status
                via the official USCIS API.
              </span>
            </label>
            <div className="flex justify-between gap-3 mt-2">
              <button type="button" className="btn btn-ghost rounded-full" onClick={() => go(4)}>
                Back
              </button>
              <button
                type="button"
                className="btn btn-accent text-accent-content rounded-full"
                disabled={!draft.consent || submitting}
                onClick={submit}
              >
                {submitting ? <span className="loading loading-spinner loading-sm" /> : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';

type InsightsPayload = {
  available?: boolean;
  user_count?: number;
  min_users?: number;
  message?: string;
  project_name?: string;
  quarter?: string;
  quarters?: string[];
  total_cases?: number;
  by_form?: Array<Record<string, unknown>>;
  by_service_center?: Array<Record<string, unknown>>;
  by_classification?: Array<Record<string, unknown>>;
};

function FormBars({ rows }: { rows?: Array<Record<string, unknown>> }) {
  if (!rows?.length) return <p className="text-sm text-neutral/50">No form data yet.</p>;
  return (
    <div className="space-y-4">
      {rows.map((row) => {
        const total = Number(row.total || 0) || 1;
        const approved = Number(row.approved || 0);
        const pending = Number(row.pending || 0);
        const rfe = Number(row.rfe || 0);
        return (
          <div key={String(row.form_type)} className="card-elevated">
            <div className="card-body gap-2">
              <div className="flex justify-between gap-2">
                <h3 className="font-bold text-primary">{String(row.form_type)}</h3>
                <span className="text-sm text-neutral/50">{total} cases</span>
              </div>
              <div className="text-sm text-neutral/70">
                {approved} approved ({Math.round((100 * approved) / total)}%) · {pending} pending
                {rfe ? ` · ${rfe} RFE` : ''}
              </div>
              {(row.median_months != null || row.median_months_approx != null) && (
                <p className="text-sm text-neutral/60">
                  Median processing ≈ {String(row.median_months ?? row.median_months_approx)} months
                </p>
              )}
              {row.approved_pct != null && (
                <p className="text-sm text-neutral/60">Approval rate: {String(row.approved_pct)}%</p>
              )}
              <div className="w-full h-3 rounded-full bg-base-200 overflow-hidden flex">
                <div className="bg-secondary h-full" style={{ width: `${(100 * approved) / total}%` }} />
                <div className="bg-info h-full" style={{ width: `${(100 * pending) / total}%` }} />
                <div className="bg-copper h-full" style={{ width: `${(100 * rfe) / total}%` }} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function InsightsClient({ projectName }: { projectName: string | null }) {
  const [tab, setTab] = useState<'project' | 'cohort' | 'overall'>('overall');
  const [quarter, setQuarter] = useState<string>('');
  const [data, setData] = useState<InsightsPayload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ tab });
    if (tab === 'cohort' && quarter) params.set('quarter', quarter);
    fetch(`/api/insights?${params}`)
      .then((r) => r.json())
      .then((json) => {
        setData(json);
        if (json.quarter && !quarter) setQuarter(json.quarter);
      })
      .finally(() => setLoading(false));
  }, [tab, quarter]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <p className="text-xs uppercase tracking-[0.22em] font-semibold text-secondary mb-2">
        Community insights
      </p>
      <h1 className="text-3xl font-bold text-primary mb-2">How cases are moving</h1>
      <p className="text-sm text-neutral/60 mb-6">
        Aggregates only — never individual receipt numbers. Groups with fewer than 5 users are hidden.
      </p>

      <div className="tabs tabs-boxed bg-base-200/60 p-1 mb-6 flex-wrap">
        <button type="button" className={`tab ${tab === 'project' ? 'tab-active' : ''}`} onClick={() => setTab('project')}>
          My Project
        </button>
        <button type="button" className={`tab ${tab === 'cohort' ? 'tab-active' : ''}`} onClick={() => setTab('cohort')}>
          Filing Cohort
        </button>
        <button type="button" className={`tab ${tab === 'overall' ? 'tab-active' : ''}`} onClick={() => setTab('overall')}>
          Overall
        </button>
      </div>

      {loading && (
        <div className="flex justify-center py-12">
          <span className="loading loading-spinner loading-lg" />
        </div>
      )}

      {!loading && data && (
        <>
          <p className="text-sm text-neutral/60 mb-4">
            Data from {data.user_count ?? 0} investor{(data.user_count || 0) === 1 ? '' : 's'}
            {tab === 'project' && projectName ? ` tracking “${projectName}”` : ''}
            {tab === 'cohort' && data.quarter ? ` in ${data.quarter}` : ''}.
          </p>

          {tab === 'cohort' && Array.isArray(data.quarters) && data.quarters.length > 0 && (
            <label className="form-control w-full max-w-xs mb-4">
              <span className="label-text">Filing quarter</span>
              <select
                className="select select-bordered"
                value={quarter || data.quarter || ''}
                onChange={(e) => setQuarter(e.target.value)}
              >
                {data.quarters.map((q) => (
                  <option key={q} value={q}>
                    {q}
                  </option>
                ))}
              </select>
            </label>
          )}

          {!data.available ? (
            <div className="alert alert-heritage-info text-sm">
              {data.message ||
                `Insights will be available once ${data.min_users || 5} or more investors are tracking${
                  tab === 'project' ? ' your project' : tab === 'cohort' ? ' in this cohort' : ''
                }. Currently ${data.user_count ?? 0} investor${(data.user_count || 0) === 1 ? '' : 's'} ${
                  tab === 'project' ? 'are tracking.' : 'in sample.'
                }`}
            </div>
          ) : (
            <>
              {tab === 'overall' && (
                <div className="stat-pill inline-flex mb-4">
                  <span className="font-semibold">{data.total_cases ?? 0}</span>
                  <span className="text-neutral/60 ml-2">total cases tracked</span>
                </div>
              )}
              <FormBars rows={data.by_form} />

              {tab === 'overall' && (
                <div className="grid sm:grid-cols-2 gap-4 mt-6">
                  <div className="card-elevated">
                    <div className="card-body">
                      <h3 className="font-bold text-primary">By service center</h3>
                      <ul className="text-sm space-y-1 mt-2">
                        {(data.by_service_center || []).map((r) => (
                          <li key={String(r.service_center)} className="flex justify-between">
                            <span>{String(r.service_center)}</span>
                            <span className="text-neutral/50">{String(r.total)}</span>
                          </li>
                        ))}
                        {!data.by_service_center?.length && (
                          <li className="text-neutral/50">No data yet</li>
                        )}
                      </ul>
                    </div>
                  </div>
                  <div className="card-elevated">
                    <div className="card-body">
                      <h3 className="font-bold text-primary">Rural vs HUA</h3>
                      <ul className="text-sm space-y-1 mt-2">
                        {(data.by_classification || []).map((r) => (
                          <li key={String(r.classification)} className="flex justify-between">
                            <span className="uppercase">{String(r.classification)}</span>
                            <span className="text-neutral/50">{String(r.users)} users</span>
                          </li>
                        ))}
                        {!data.by_classification?.length && (
                          <li className="text-neutral/50">No data yet</li>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

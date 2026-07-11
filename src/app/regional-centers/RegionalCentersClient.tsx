'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import type { RegionalCenter } from '@/lib/types';
import { US_STATES } from '@/lib/constants';

interface RegionalCentersClientProps {
  centers: (RegionalCenter & { project_count: number })[];
}

export default function RegionalCentersClient({ centers }: RegionalCentersClientProps) {
  const [q, setQ] = useState('');
  const [state, setState] = useState('');
  const [sort, setSort] = useState<'name' | 'projects'>('name');

  const filtered = useMemo(() => {
    let list = centers;
    if (q.trim()) {
      const term = q.trim().toLowerCase();
      list = list.filter(
        (rc) =>
          rc.name.toLowerCase().includes(term) ||
          (rc.uscis_rc_id || '').toLowerCase().includes(term)
      );
    }
    if (state) {
      list = list.filter(
        (rc) =>
          rc.headquarters_state === state ||
          (rc.operating_states || []).includes(state)
      );
    }
    if (sort === 'projects') {
      list = [...list].sort((a, b) => b.project_count - a.project_count);
    } else {
      list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    }
    return list;
  }, [centers, q, state, sort]);

  return (
    <div>
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <input
          type="search"
          className="input input-bordered flex-1"
          placeholder="Search regional centers…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select
          className="select select-bordered"
          value={state}
          onChange={(e) => setState(e.target.value)}
        >
          <option value="">All states</option>
          {US_STATES.map((s) => (
            <option key={s.code} value={s.code}>
              {s.name}
            </option>
          ))}
        </select>
        <select
          className="select select-bordered"
          value={sort}
          onChange={(e) => setSort(e.target.value as 'name' | 'projects')}
        >
          <option value="name">A–Z</option>
          <option value="projects">Most projects</option>
        </select>
      </div>

      <p className="text-sm text-neutral/70 mb-4">
        Showing <span className="font-semibold text-neutral">{filtered.length}</span> regional
        center{filtered.length === 1 ? '' : 's'}
      </p>

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-4xl mb-3" aria-hidden>
            🏢
          </div>
          <h2 className="text-lg font-bold text-neutral/70">No regional centers found</h2>
          <p className="text-sm text-neutral/50 mt-2">
            {q || state ? 'Try a different search term' : 'Be the first to add a regional center'}
          </p>
          <Link href="/regional-centers/new" className="btn btn-primary btn-sm rounded-full mt-4">
            + Add Regional Center
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((rc) => (
            <Link
              key={rc.id}
              href={`/rc/${rc.id}`}
              className="card card-bordered border-base-300/50 bg-base-100 shadow-sm transition-all duration-150 hover:shadow-md hover:-translate-y-0.5 hover:border-l-4 hover:border-l-primary"
            >
              <div className="card-body p-4 gap-2">
                <h3 className="card-title text-base font-bold text-primary">{rc.name}</h3>
                {rc.uscis_rc_id && (
                  <span className="badge bg-base-200 text-neutral/60 border-0 rounded-full text-xs font-semibold px-3 py-1 w-fit">
                    {rc.uscis_rc_id}
                  </span>
                )}
                {rc.headquarters_state && (
                  <p className="text-sm text-neutral/70">HQ: {rc.headquarters_state}</p>
                )}
                <p className="text-meta text-neutral/60">
                  {rc.project_count} project{rc.project_count === 1 ? '' : 's'}
                </p>
                {(rc.operating_states || []).length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {(rc.operating_states || []).slice(0, 6).map((s) => (
                      <span
                        key={s}
                        className="badge badge-ghost rounded-full text-xs px-2"
                      >
                        {s}
                      </span>
                    ))}
                    {(rc.operating_states || []).length > 6 && (
                      <span className="text-meta text-neutral/50">
                        +{(rc.operating_states || []).length - 6}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

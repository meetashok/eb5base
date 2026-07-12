'use client';

import Link from 'next/link';
import { AddRcLink } from '@/components/AuthGatedLinks';
import { useMemo, useState } from 'react';
import type { RcBrand } from '@/lib/types';
import { brandPath } from '@/lib/slugs';

interface BrandListItem extends RcBrand {
  project_count: number;
  entity_count: number;
}

interface BrandsClientProps {
  brands: BrandListItem[];
}

function BrandCard({ brand }: { brand: BrandListItem }) {
  return (
    <Link key={brand.id} href={brandPath(brand)} className="card-elevated block">
      <div className="p-5">
        <h2 className="text-base font-bold text-primary">{brand.name}</h2>
        {brand.website_url && (
          <p className="text-xs text-neutral/50 truncate mt-1">{brand.website_url}</p>
        )}
        <div className="flex gap-3 mt-3 text-xs text-neutral/50">
          <span className="badge bg-secondary/10 text-secondary border-0 rounded-full">
            {brand.project_count} project{brand.project_count !== 1 ? 's' : ''}
          </span>
          <span className="badge bg-base-200 text-neutral/60 border-0 rounded-full">
            {brand.entity_count} USCIS entit{brand.entity_count !== 1 ? 'ies' : 'y'}
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function BrandsClient({ brands }: BrandsClientProps) {
  const [q, setQ] = useState('');

  const filtered = useMemo(() => {
    if (!q.trim()) return brands;
    const term = q.trim().toLowerCase();
    return brands.filter((b) => b.name.toLowerCase().includes(term));
  }, [brands, q]);

  const { withProjects, withoutProjects } = useMemo(() => {
    const sorted = [...filtered].sort((a, b) => a.name.localeCompare(b.name));
    return {
      withProjects: sorted.filter((b) => b.project_count > 0),
      withoutProjects: sorted.filter((b) => b.project_count === 0),
    };
  }, [filtered]);

  return (
    <div>
      <div className="mb-6">
        <input
          type="search"
          className="input input-bordered w-full max-w-md bg-base-100 shadow-soft rounded-xl focus-ring"
          placeholder="Search by name..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <p className="text-sm text-neutral/70 mb-4">
        Showing <span className="font-semibold text-neutral">{filtered.length}</span> regional
        center{filtered.length === 1 ? '' : 's'}
      </p>

      {filtered.length === 0 ? (
        <div className="card-elevated py-16 text-center px-6">
          <h2 className="text-lg font-bold text-neutral/80">No regional centers found</h2>
          <p className="text-sm text-neutral/50 mt-2">
            {q ? 'Try a different search term' : 'Be the first to add one'}
          </p>
          <AddRcLink className="btn btn-primary btn-sm rounded-full mt-4">
            + Add Regional Center
          </AddRcLink>
        </div>
      ) : (
        <div className="space-y-10">
          {withProjects.length > 0 && (
            <section>
              <h2 className="text-lg font-bold text-primary mb-4">
                With projects ({withProjects.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {withProjects.map((brand) => (
                  <BrandCard key={brand.id} brand={brand} />
                ))}
              </div>
            </section>
          )}

          {withoutProjects.length > 0 && (
            <section>
              <h2 className="text-lg font-bold text-primary mb-4">
                No projects yet ({withoutProjects.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {withoutProjects.map((brand) => (
                  <BrandCard key={brand.id} brand={brand} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

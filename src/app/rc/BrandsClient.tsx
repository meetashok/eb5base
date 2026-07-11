'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import type { RcBrand } from '@/lib/types';
import { brandPath } from '@/lib/slugs';

interface BrandListItem extends RcBrand {
  project_count: number;
  entity_count: number;
}

interface BrandsClientProps {
  brands: BrandListItem[];
  isLoggedIn: boolean;
}

export default function BrandsClient({ brands, isLoggedIn }: BrandsClientProps) {
  const [q, setQ] = useState('');

  const filtered = useMemo(() => {
    if (!q.trim()) return brands;
    const term = q.trim().toLowerCase();
    return brands.filter((b) => b.name.toLowerCase().includes(term));
  }, [brands, q]);

  return (
    <div>
      <div className="mb-6">
        <input
          type="search"
          className="input input-bordered w-full max-w-md"
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
        <div className="text-center py-16">
          <div className="text-4xl mb-3" aria-hidden>
            🏢
          </div>
          <h2 className="text-lg font-bold text-neutral/70">No regional centers found</h2>
          <p className="text-sm text-neutral/50 mt-2">
            {q ? 'Try a different search term' : 'Be the first to add one'}
          </p>
          {isLoggedIn && (
            <Link href="/rc/new" className="btn btn-primary btn-sm rounded-full mt-4">
              + Add Regional Center
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((brand) => (
            <Link
              key={brand.id}
              href={brandPath(brand)}
              className="card card-bordered shadow-sm bg-base-100 hover:shadow-md transition-all duration-150"
            >
              <div className="card-body p-5">
                <h2 className="card-title text-base text-primary">{brand.name}</h2>
                {brand.website_url && (
                  <p className="text-xs text-neutral/50 truncate">{brand.website_url}</p>
                )}
                <div className="flex gap-3 mt-2 text-xs text-neutral/40">
                  <span>
                    {brand.project_count} project{brand.project_count !== 1 ? 's' : ''}
                  </span>
                  <span>
                    {brand.entity_count} USCIS entit
                    {brand.entity_count !== 1 ? 'ies' : 'y'}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

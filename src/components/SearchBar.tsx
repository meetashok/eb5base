'use client';

import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';

interface SearchBarProps {
  initialQuery?: string;
  large?: boolean;
  className?: string;
}

export default function SearchBar({
  initialQuery = '',
  large = false,
  className = '',
}: SearchBarProps) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set('q', query.trim());
    router.push(`/projects${params.toString() ? `?${params.toString()}` : ''}`);
  }

  return (
    <form onSubmit={handleSubmit} className={`w-full ${className}`}>
      <div
        className={`flex gap-2 ${large ? 'max-w-2xl mx-auto shadow-lift rounded-2xl p-1 bg-base-100/80 backdrop-blur-sm border border-base-300/50' : ''}`}
      >
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search projects, regional centers, locations…"
          className={`input input-bordered w-full bg-base-100 focus-ring ${
            large ? 'input-lg rounded-xl' : ''
          }`}
          aria-label="Search projects"
        />
        <button
          type="submit"
          className={`btn btn-primary focus-ring rounded-xl ${
            large ? 'btn-lg' : ''
          }`}
        >
          Search
        </button>
      </div>
    </form>
  );
}

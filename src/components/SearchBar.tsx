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
        className={`flex gap-2 ${large ? 'max-w-2xl mx-auto shadow-md rounded-lg' : ''}`}
      >
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search projects, regional centers, locations…"
          className={`input input-bordered w-full focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-offset-2 ${
            large ? 'input-lg' : ''
          }`}
          aria-label="Search projects"
        />
        <button
          type="submit"
          className={`btn btn-primary transition-all duration-150 focus:ring-2 focus:ring-secondary focus:ring-offset-2 ${
            large ? 'btn-lg' : ''
          }`}
        >
          Search
        </button>
      </div>
    </form>
  );
}

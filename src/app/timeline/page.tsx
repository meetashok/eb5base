'use client';

import { Suspense } from 'react';
import TimelineContent from './TimelineContent';

export default function TimelinePage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-3xl mx-auto px-4 py-12">
          <div className="skeleton-shimmer h-16 w-full mb-6" />
          <div className="skeleton-shimmer h-48 w-full" />
        </div>
      }
    >
      <TimelineContent />
    </Suspense>
  );
}

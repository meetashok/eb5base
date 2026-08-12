'use client';

import { useState } from 'react';
import type { I485SharePayload } from '@/lib/analysis/i485ShareParams';
import { shareViewTitle } from '@/lib/analysis/i485ShareParams';

function ShareIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="M8.59 13.51 15.42 17.49" />
      <path d="m15.41 6.51-6.82 3.98" />
    </svg>
  );
}

export default function I485ShareButton({
  buildPayload,
}: {
  buildPayload: () => I485SharePayload;
}) {
  const [status, setStatus] = useState<'idle' | 'working' | 'copied' | 'error'>('idle');

  async function onShare() {
    if (status === 'working') return;
    setStatus('working');
    try {
      const payload = buildPayload();
      const res = await fetch('/api/analysis/i485/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = (await res.json().catch(() => null)) as
        | { url?: string; error?: string }
        | null;
      if (!res.ok || !data?.url) {
        throw new Error(data?.error || 'Could not create share link.');
      }

      const url = data.url;
      const title = shareViewTitle(payload.view);
      const text = `${title} — EB5 Base`;
      const shareData = { title, text, url };

      try {
        if (
          typeof navigator.share === 'function' &&
          (!navigator.canShare || navigator.canShare(shareData))
        ) {
          await navigator.share(shareData);
          setStatus('idle');
          return;
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          setStatus('idle');
          return;
        }
      }

      await navigator.clipboard.writeText(url);
      setStatus('copied');
      window.setTimeout(() => setStatus('idle'), 2000);
    } catch {
      setStatus('error');
      window.setTimeout(() => setStatus('idle'), 2500);
    }
  }

  const label =
    status === 'working'
      ? 'Sharing…'
      : status === 'copied'
        ? 'Copied'
        : status === 'error'
          ? 'Failed'
          : 'Share';

  return (
    <button
      type="button"
      className={`inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary ${
        status === 'error'
          ? 'text-error'
          : status === 'copied'
            ? 'text-secondary'
            : 'text-neutral/60 hover:bg-base-300/60 hover:text-primary'
      }`}
      onClick={() => void onShare()}
      disabled={status === 'working'}
      aria-live="polite"
      aria-label={label === 'Share' ? 'Share this chart' : label}
      title={label === 'Share' ? 'Share this chart' : label}
    >
      <ShareIcon className="opacity-80" />
      <span>{label}</span>
    </button>
  );
}

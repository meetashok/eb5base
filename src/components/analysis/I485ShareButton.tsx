'use client';

import { useState } from 'react';
import type { I485SharePayload } from '@/lib/analysis/i485ShareParams';
import { shareViewTitle } from '@/lib/analysis/i485ShareParams';

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
        ? 'Link copied'
        : status === 'error'
          ? 'Share failed'
          : 'Share';

  return (
    <button
      type="button"
      className={`btn btn-ghost btn-xs ${
        status === 'error'
          ? 'text-error'
          : status === 'copied'
            ? 'text-secondary'
            : 'text-neutral/70 hover:text-primary'
      }`}
      onClick={() => void onShare()}
      disabled={status === 'working'}
      aria-live="polite"
    >
      {label}
    </button>
  );
}

'use client';

import { useState } from 'react';
import {
  chartPathWithParams,
  shareViewTitle,
  type I485SharePayload,
} from '@/lib/analysis/i485ShareParams';
import { SITE_URL } from '@/lib/constants';

/** Paper-plane / send glyph — reads as “share this” without the tray-arrow chrome. */
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
      <path d="M22 2L11 13" />
      <path d="M22 2L15 22l-4-9-9-4 20-7z" />
    </svg>
  );
}

function isAbortError(err: unknown): boolean {
  return err instanceof DOMException && err.name === 'AbortError';
}

/** Prefer the native share sheet on mobile; fall back to clipboard on desktop. */
async function openShareSheet(shareData: ShareData): Promise<'shared' | 'aborted' | 'unavailable'> {
  if (typeof navigator.share !== 'function') return 'unavailable';

  // Skip canShare — it falsely rejects valid payloads on some mobile browsers.
  try {
    await navigator.share(shareData);
    return 'shared';
  } catch (err) {
    if (isAbortError(err)) return 'aborted';
  }

  // Retry with URL only (widest support).
  if (shareData.url) {
    try {
      await navigator.share({ url: shareData.url });
      return 'shared';
    } catch (err) {
      if (isAbortError(err)) return 'aborted';
    }
  }

  return 'unavailable';
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
      const title = shareViewTitle(payload.view);
      const text = `${title} — EB5 Base`;
      // Immediate absolute URL so we always have something to share if minting fails.
      const longUrl = `${SITE_URL}${chartPathWithParams(payload)}`;
      let url = longUrl;

      try {
        const res = await fetch('/api/analysis/i485/share', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = (await res.json().catch(() => null)) as
          | { url?: string; error?: string }
          | null;
        if (res.ok && data?.url) url = data.url;
      } catch {
        // Keep longUrl — still open the share sheet.
      }

      const result = await openShareSheet({ title, text, url });
      if (result === 'shared' || result === 'aborted') {
        setStatus('idle');
        return;
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
      className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose ${
        status === 'error'
          ? 'border-error/40 bg-error/10 text-error'
          : status === 'copied'
            ? 'border-secondary/40 bg-secondary/15 text-secondary'
            : status === 'working'
              ? 'border-rose/25 bg-rose/10 text-rose/70'
              : 'border-rose/35 bg-rose/15 text-rose hover:border-rose/50 hover:bg-rose/25 hover:text-rose-dark'
      }`}
      onClick={() => void onShare()}
      disabled={status === 'working'}
      aria-live="polite"
      aria-label={label === 'Share' ? 'Share this chart' : label}
      title={label === 'Share' ? 'Share this chart' : label}
    >
      <span>{label}</span>
      <ShareIcon />
    </button>
  );
}

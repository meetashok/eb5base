'use client';

import { useEffect, useRef, useState } from 'react';
import {
  chartPathWithParams,
  sharePayloadToSearchParams,
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

function payloadKey(payload: I485SharePayload): string {
  return sharePayloadToSearchParams(payload).toString();
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

  // Retry with URL only (widest support on iOS).
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

async function copyViaClipboardApi(text: string): Promise<boolean> {
  try {
    if (!navigator.clipboard?.writeText) return false;
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

function copyViaExecCommand(text: string): boolean {
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.top = '0';
    ta.style.left = '0';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    ta.setSelectionRange(0, text.length);
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

async function copyText(text: string, allowPrompt = false): Promise<boolean> {
  if (await copyViaClipboardApi(text)) return true;
  if (copyViaExecCommand(text)) return true;
  if (!allowPrompt) return false;
  try {
    return window.prompt('Copy this link:', text) !== null;
  } catch {
    return false;
  }
}

async function mintShortShareUrl(payload: I485SharePayload): Promise<string | null> {
  try {
    const res = await fetch('/api/analysis/i485/share', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = (await res.json().catch(() => null)) as { url?: string } | null;
    if (res.ok && data?.url) return data.url;
  } catch {
    // Keep long URL.
  }
  return null;
}

export default function I485ShareButton({
  buildPayload,
  shareKey,
}: {
  buildPayload: () => I485SharePayload;
  /** Stable filter fingerprint; when it changes we pre-mint a short URL. */
  shareKey?: string;
}) {
  const [status, setStatus] = useState<'idle' | 'working' | 'copied' | 'error'>('idle');
  /** Pre-minted short URL for the current filter payload (ready before tap). */
  const [readyShortUrl, setReadyShortUrl] = useState<string | null>(null);
  const readyKeyRef = useRef<string>('');
  const buildPayloadRef = useRef(buildPayload);
  buildPayloadRef.current = buildPayload;

  // Mint a short link whenever filters change so Share can open immediately with it.
  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      const payload = buildPayloadRef.current();
      const key = shareKey ?? payloadKey(payload);
      if (key === readyKeyRef.current) return;

      void (async () => {
        const minted = await mintShortShareUrl(payload);
        if (cancelled || !minted) return;
        readyKeyRef.current = key;
        setReadyShortUrl(minted);
      })();
    }, 350);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [shareKey]);

  async function onShare() {
    if (status === 'working') return;
    setStatus('working');
    try {
      const payload = buildPayload();
      const title = shareViewTitle(payload.view);
      const text = `${title} · EB5 Base`;
      const longUrl = `${SITE_URL}${chartPathWithParams(payload)}`;
      const key = shareKey ?? payloadKey(payload);
      const shortUrl =
        readyKeyRef.current === key && readyShortUrl ? readyShortUrl : null;
      const url = shortUrl ?? longUrl;
      const canNativeShare = typeof navigator.share === 'function';

      // Open the sheet immediately (no await fetch) so iOS keeps the user gesture.
      if (canNativeShare) {
        const result = await openShareSheet({ title, text, url });
        if (result === 'shared' || result === 'aborted') {
          setStatus('idle');
          if (!shortUrl) {
            void mintShortShareUrl(payload).then((minted) => {
              if (!minted) return;
              readyKeyRef.current = key;
              setReadyShortUrl(minted);
            });
          }
          return;
        }
      }

      // Desktop / share unavailable: copy while the gesture is still usable.
      if (!(await copyText(url, true))) {
        setStatus('error');
        window.setTimeout(() => setStatus('idle'), 2500);
        return;
      }
      setStatus('copied');
      window.setTimeout(() => setStatus('idle'), 2000);

      if (!shortUrl) {
        const minted = await mintShortShareUrl(payload);
        if (minted) {
          readyKeyRef.current = key;
          setReadyShortUrl(minted);
          void copyText(minted, false);
        }
      }
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

'use client';

import { useEffect, useRef, useState } from 'react';

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
  try {
    await navigator.share(shareData);
    return 'shared';
  } catch (err) {
    if (isAbortError(err)) return 'aborted';
  }
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

async function mintShortShareUrl(endpoint: string, payload: unknown): Promise<string | null> {
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = (await res.json().catch(() => null)) as { url?: string } | null;
    if (res.ok && data?.url) return data.url;
  } catch {
    /* keep long URL */
  }
  return null;
}

export interface AnalysisShareButtonProps<TPayload> {
  buildPayload: () => TPayload;
  /** Stable fingerprint; when it changes a short URL is pre-minted. */
  shareKey?: string;
  /** POST endpoint that mints the short link. */
  endpoint: string;
  /** Title for the native share sheet / clipboard text. */
  getShareTitle: (payload: TPayload) => string;
  /** Absolute long URL fallback for the current payload. */
  buildLongUrl: (payload: TPayload) => string;
  /** Fallback dedup key derived from a payload. */
  keyOf: (payload: TPayload) => string;
}

/**
 * The one share button for every analysis chart. Opens the native share sheet
 * (clipboard fallback) with a pre-minted short URL. Datasets only supply the
 * endpoint, title, long-URL, and payload adapters.
 */
export default function AnalysisShareButton<TPayload>({
  buildPayload,
  shareKey,
  endpoint,
  getShareTitle,
  buildLongUrl,
  keyOf,
}: AnalysisShareButtonProps<TPayload>) {
  const [status, setStatus] = useState<'idle' | 'working' | 'copied' | 'error'>('idle');
  const [readyShortUrl, setReadyShortUrl] = useState<string | null>(null);
  const readyKeyRef = useRef<string>('');
  const buildPayloadRef = useRef(buildPayload);
  buildPayloadRef.current = buildPayload;

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      const payload = buildPayloadRef.current();
      const key = shareKey ?? keyOf(payload);
      if (key === readyKeyRef.current) return;
      void (async () => {
        const minted = await mintShortShareUrl(endpoint, payload);
        if (cancelled || !minted) return;
        readyKeyRef.current = key;
        setReadyShortUrl(minted);
      })();
    }, 350);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shareKey, endpoint]);

  async function onShare() {
    if (status === 'working') return;
    setStatus('working');
    try {
      const payload = buildPayload();
      const title = getShareTitle(payload);
      const text = `${title} · EB5 Base`;
      const longUrl = buildLongUrl(payload);
      const key = shareKey ?? keyOf(payload);
      const shortUrl = readyKeyRef.current === key && readyShortUrl ? readyShortUrl : null;
      const url = shortUrl ?? longUrl;

      if (typeof navigator.share === 'function') {
        const result = await openShareSheet({ title, text, url });
        if (result === 'shared' || result === 'aborted') {
          setStatus('idle');
          if (!shortUrl) {
            void mintShortShareUrl(endpoint, payload).then((minted) => {
              if (!minted) return;
              readyKeyRef.current = key;
              setReadyShortUrl(minted);
            });
          }
          return;
        }
      }

      if (!(await copyText(url, true))) {
        setStatus('error');
        window.setTimeout(() => setStatus('idle'), 2500);
        return;
      }
      setStatus('copied');
      window.setTimeout(() => setStatus('idle'), 2000);

      if (!shortUrl) {
        const minted = await mintShortShareUrl(endpoint, payload);
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
    status === 'working' ? 'Sharing…' : status === 'copied' ? 'Copied' : status === 'error' ? 'Failed' : 'Share';

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
      aria-label={label === 'Share' ? 'Share this view' : label}
      title={label === 'Share' ? 'Share this view' : label}
    >
      <span>{label}</span>
      <ShareIcon />
    </button>
  );
}

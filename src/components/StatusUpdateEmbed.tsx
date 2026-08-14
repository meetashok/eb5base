'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ListSkeleton } from '@/components/LoadingSkeleton';

const DESKTOP_MQ = '(min-width: 1024px)';

function readChromeBottom(): number {
  if (typeof window === 'undefined') return 112;
  const chrome = document.getElementById('site-chrome');
  if (chrome) {
    return Math.ceil(chrome.getBoundingClientRect().height);
  }
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue('--site-sticky-offset')
    .trim();
  const parsed = Number.parseFloat(raw);
  return Number.isFinite(parsed) ? parsed : 112;
}

function desktopFrameHeight(): number {
  return Math.max(window.innerHeight - readChromeBottom() - 12, 560);
}

export default function StatusUpdateEmbed() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(DESKTOP_MQ).matches : false
  );
  const [height, setHeight] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia(DESKTOP_MQ).matches
      ? desktopFrameHeight()
      : 2400
  );
  const [ready, setReady] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [shouldLoad, setShouldLoad] = useState(false);

  const applyDesktopHeight = useCallback(() => {
    setHeight(desktopFrameHeight());
  }, []);

  // Defer loading the (heavy) builder iframe until it is near the viewport, so
  // it doesn't compete with the hero on first paint. Fires ~immediately when
  // the iframe is above the fold.
  useEffect(() => {
    if (shouldLoad) return;
    const el = containerRef.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      setShouldLoad(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShouldLoad(true);
          io.disconnect();
        }
      },
      { rootMargin: '600px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [shouldLoad]);

  useEffect(() => {
    const mq = window.matchMedia(DESKTOP_MQ);
    const syncMode = () => {
      const desktop = mq.matches;
      setIsDesktop(desktop);
      if (desktop) applyDesktopHeight();
    };
    syncMode();
    mq.addEventListener('change', syncMode);
    return () => mq.removeEventListener('change', syncMode);
  }, [applyDesktopHeight]);

  useEffect(() => {
    if (!isDesktop) return;
    applyDesktopHeight();
    function onResize() {
      applyDesktopHeight();
    }
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [isDesktop, applyDesktopHeight]);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return;
      const data = event.data;
      if (!data || data.type !== 'eb5status-height') return;
      if (window.matchMedia(DESKTOP_MQ).matches) return;
      const next = Number(data.height);
      if (Number.isFinite(next) && next > 400) {
        setHeight(Math.ceil(next));
        setReady(true);
      }
    }
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    function syncHeight() {
      try {
        if (window.matchMedia(DESKTOP_MQ).matches) {
          applyDesktopHeight();
          setReady(true);
          return;
        }
        const el = iframeRef.current;
        if (!el) return;
        const doc = el.contentDocument;
        if (!doc?.body) return;
        const next = Math.max(
          doc.body.scrollHeight,
          doc.documentElement?.scrollHeight || 0,
          1200
        );
        setHeight(next + 24);
        setReady(true);
      } catch {
        // cross-origin or not ready
      }
    }

    function onLoad() {
      setReady(true);
      syncHeight();
    }

    iframe.addEventListener('load', onLoad);
    const interval = window.setInterval(syncHeight, 1000);
    const timeout = window.setTimeout(() => setReady(true), 8000);
    return () => {
      iframe.removeEventListener('load', onLoad);
      window.clearInterval(interval);
      window.clearTimeout(timeout);
    };
  }, [applyDesktopHeight]);

  return (
    <div
      ref={containerRef}
      className={`w-full pb-8 relative ${
        isDesktop
          ? 'lg:sticky lg:top-[var(--site-sticky-offset)] lg:z-10 lg:pb-3'
          : ''
      }`}
    >
      {!ready ? (
        <div className="absolute inset-x-0 top-0 z-10 px-4 max-w-3xl mx-auto">
          <ListSkeleton count={3} />
          <p className="sr-only">Loading status builder…</p>
        </div>
      ) : null}
      <iframe
        ref={iframeRef}
        title="EB-5 Status Update Builder"
        src={shouldLoad ? '/status/embed.html' : undefined}
        className={`w-full border-0 bg-transparent ${ready ? 'opacity-100' : 'opacity-0'}`}
        style={{ height }}
        loading="lazy"
      />
    </div>
  );
}

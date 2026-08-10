'use client';

import { useEffect, useRef, useState } from 'react';
import { ListSkeleton } from '@/components/LoadingSkeleton';

export default function StatusUpdateEmbed() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(2400);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return;
      const data = event.data;
      if (!data || data.type !== 'eb5status-height') return;
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
  }, []);

  return (
    <div className="w-full pb-8 relative">
      {!ready ? (
        <div className="absolute inset-x-0 top-0 z-10 px-4 max-w-3xl mx-auto">
          <ListSkeleton count={3} />
          <p className="sr-only">Loading status builder…</p>
        </div>
      ) : null}
      <iframe
        ref={iframeRef}
        title="EB-5 Status Update Builder"
        src="/status/embed.html"
        className={`w-full border-0 bg-transparent ${ready ? 'opacity-100' : 'opacity-0'}`}
        style={{ height }}
        loading="eager"
      />
    </div>
  );
}

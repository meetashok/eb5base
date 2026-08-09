'use client';

import { useEffect, useRef, useState } from 'react';

export default function StatusUpdateEmbed() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(2400);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return;
      const data = event.data;
      if (!data || data.type !== 'eb5status-height') return;
      const next = Number(data.height);
      if (Number.isFinite(next) && next > 400) {
        setHeight(Math.ceil(next));
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
      } catch {
        // cross-origin or not ready
      }
    }

    iframe.addEventListener('load', syncHeight);
    const interval = window.setInterval(syncHeight, 1000);
    return () => {
      iframe.removeEventListener('load', syncHeight);
      window.clearInterval(interval);
    };
  }, []);

  return (
    <div className="w-full pb-8">
      <p className="sr-only">Loading status builder…</p>
      <iframe
        ref={iframeRef}
        title="EB-5 Status Update Builder"
        src="/status/embed.html"
        className="w-full border-0 bg-transparent"
        style={{ height }}
        loading="eager"
      />
    </div>
  );
}

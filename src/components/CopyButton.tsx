'use client';

import { useState } from 'react';

export default function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  }

  return (
    <button
      type="button"
      className="btn btn-ghost btn-xs"
      onClick={copy}
      aria-label="Copy receipt number"
      title="Copy"
    >
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

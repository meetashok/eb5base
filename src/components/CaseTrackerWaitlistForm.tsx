'use client';

import { FormEvent, useState } from 'react';

type WaitlistSource = 'home' | 'tracker';

export default function CaseTrackerWaitlistForm({
  source,
  variant = 'compact',
  inputId,
}: {
  source: WaitlistSource;
  variant?: 'compact' | 'full';
  inputId: string;
}) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus('loading');
    setMessage('');
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source }),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string; ok?: boolean };
      if (!res.ok) {
        setStatus('error');
        setMessage(json.error || 'Something went wrong. Try again.');
        return;
      }
      setStatus('success');
      setMessage('You are on the list. We will email you once when Case Tracker launches.');
      setEmail('');
    } catch {
      setStatus('error');
      setMessage('Network error. Check your connection and try again.');
    }
  }

  const inputClass =
    variant === 'compact'
      ? 'input input-sm input-bordered w-full'
      : 'input input-bordered w-full';
  const buttonClass =
    variant === 'compact'
      ? 'btn btn-sm btn-outline rounded-full border-neutral/30 shrink-0'
      : 'btn btn-primary text-primary-content shrink-0';

  if (status === 'success') {
    return (
      <p
        className={`text-sm text-secondary font-medium leading-relaxed ${
          variant === 'compact' ? 'mt-2' : ''
        }`}
        role="status"
      >
        {message}
      </p>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className={variant === 'compact' ? 'mt-2 space-y-1.5' : 'space-y-2 max-w-lg'}
    >
      <label className="sr-only" htmlFor={inputId}>
        Email for Case Tracker waitlist
      </label>
      <div
        className={
          variant === 'compact' ? 'flex items-center gap-2' : 'flex flex-col sm:flex-row gap-2'
        }
      >
        <input
          id={inputId}
          type="email"
          name="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className={inputClass}
          disabled={status === 'loading'}
        />
        <button type="submit" className={buttonClass} disabled={status === 'loading'}>
          {status === 'loading' ? 'Saving…' : 'Notify me'}
        </button>
      </div>
      {variant === 'compact' ? (
        <p className="text-[11px] text-neutral/60 leading-relaxed">
          We store your email only to notify you once when Case Tracker launches. No ads, no
          marketing list.{' '}
          <a href="/privacy" className="underline underline-offset-2 hover:text-secondary">
            Privacy
          </a>
          .
        </p>
      ) : null}
      {status === 'error' && message ? (
        <p className="text-xs text-error leading-relaxed" role="alert">
          {message}
        </p>
      ) : null}
    </form>
  );
}

'use client';

import { FormEvent, Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import AuthBrandPanel from '@/components/AuthBrandPanel';

function GoogleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg
      className="w-10 h-10 text-secondary mx-auto"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 7l9 6 9-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LoginForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  async function handleGoogleSignIn() {
    const supabase = createClient();
    const origin = window.location.origin;
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${origin}/auth/callback?next=${encodeURIComponent('/profile/setup')}`,
      },
    });
  }

  async function handleMagicLink(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error: err } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent('/profile/setup')}`,
      },
    });
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    setMagicLinkSent(true);
  }

  const urlError = searchParams.get('error');

  return (
    <div className="flex min-h-[calc(100vh-8rem)]">
      <AuthBrandPanel title="Welcome to EB5 Base" />
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-primary">Sign in to EB5 Base</h1>
            <p className="text-neutral/60 mt-2">
              Browse projects, confirm status, and contribute
            </p>
          </div>

          <div className="card card-bordered shadow-sm bg-base-100">
            <div className="card-body gap-4">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                className="btn btn-outline w-full gap-2 rounded-full transition-all duration-150"
              >
                <GoogleIcon />
                Continue with Google
              </button>

              <div className="divider text-xs text-neutral/40">OR</div>

              {!magicLinkSent ? (
                <form onSubmit={handleMagicLink}>
                  <div className="form-control mb-3">
                    <label className="label">
                      <span className="label-text font-medium">Email address</span>
                    </label>
                    <input
                      type="email"
                      className="input input-bordered"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                    />
                  </div>
                  {(error || urlError) && (
                    <p className="text-error text-sm mb-3">{error || urlError}</p>
                  )}
                  <button
                    type="submit"
                    className="btn btn-primary w-full rounded-full"
                    disabled={loading || !email.trim()}
                  >
                    {loading ? (
                      <span className="loading loading-spinner loading-sm" />
                    ) : (
                      'Send login link'
                    )}
                  </button>
                </form>
              ) : (
                <div className="text-center py-4">
                  <div className="mb-3">
                    <MailIcon />
                  </div>
                  <h3 className="font-bold text-lg">Check your inbox</h3>
                  <p className="text-sm text-neutral/60 mt-2">
                    We sent a login link to <strong>{email}</strong>
                  </p>
                  <p className="text-xs text-neutral/40 mt-3">
                    Didn&apos;t get it? Check your spam folder or{' '}
                    <button
                      type="button"
                      className="link link-primary"
                      onClick={() => {
                        setMagicLinkSent(false);
                        setError(null);
                      }}
                    >
                      try again
                    </button>
                  </p>
                </div>
              )}
            </div>
          </div>

          <p className="text-center text-xs text-neutral/40 mt-6">
            By signing in, you agree to our{' '}
            <a href="/privacy" className="link link-hover">
              Terms of Service
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="max-w-md mx-auto px-4 py-12 skeleton-shimmer h-64" />}>
      <LoginForm />
    </Suspense>
  );
}

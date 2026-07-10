'use client';

import Link from 'next/link';
import { FormEvent, Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import AuthBrandPanel from '@/components/AuthBrandPanel';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function signInWithGoogle() {
    const supabase = createClient();
    const origin = window.location.origin;
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${origin}/auth/callback?next=${encodeURIComponent('/profile/setup')}`,
      },
    });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    // Setup page redirects home if profile is already complete
    router.push('/profile/setup');
    router.refresh();
  }

  async function handleForgot() {
    if (!email) {
      setError('Enter your email above, then click Forgot password.');
      return;
    }
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/profile`,
    });
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    setMessage('Password reset email sent. Check your inbox.');
  }

  return (
    <div className="flex min-h-[calc(100vh-8rem)]">
      <AuthBrandPanel title="Welcome back to EB5 Base" />
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <h1 className="text-2xl font-bold text-primary text-center mb-6">
            Sign in to EB5 Base
          </h1>

          <button
            type="button"
            className="btn btn-outline w-full transition-all duration-150"
            onClick={signInWithGoogle}
          >
            Sign in with Google
          </button>

          <div className="divider text-neutral/40 text-sm">or</div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="form-control">
              <span className="label-text mb-1">Email</span>
              <input
                type="email"
                className="input input-bordered"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <label className="form-control">
              <span className="label-text mb-1">Password</span>
              <input
                type="password"
                className="input input-bordered"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            {(error || searchParams.get('error')) && (
              <p className="text-error text-sm">{error || searchParams.get('error')}</p>
            )}
            {message && <p className="text-success text-sm">{message}</p>}
            <button type="submit" className="btn btn-primary w-full" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <div className="mt-4 flex flex-col gap-2 text-sm text-center">
            <button type="button" className="link link-secondary" onClick={handleForgot}>
              Forgot password?
            </button>
            <p>
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="link link-secondary">
                Sign up
              </Link>
            </p>
          </div>
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

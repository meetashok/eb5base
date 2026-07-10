'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import AuthBrandPanel from '@/components/AuthBrandPanel';

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function signUpWithGoogle() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/profile/setup`,
      },
    });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error: err } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/profile/setup`,
      },
    });
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    router.push('/profile/setup');
    router.refresh();
  }

  return (
    <div className="flex min-h-[calc(100vh-8rem)]">
      <AuthBrandPanel />
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <h1 className="text-2xl font-bold text-primary text-center mb-6">
            Create your account
          </h1>

          <button
            type="button"
            className="btn btn-outline w-full transition-all duration-150"
            onClick={signUpWithGoogle}
          >
            Sign up with Google
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
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            {error && <p className="text-error text-sm">{error}</p>}
            <button type="submit" className="btn btn-primary w-full" disabled={loading}>
              {loading ? 'Creating account…' : 'Sign up'}
            </button>
          </form>

          <p className="mt-4 text-sm text-center">
            Already have an account?{' '}
            <Link href="/login" className="link link-secondary">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

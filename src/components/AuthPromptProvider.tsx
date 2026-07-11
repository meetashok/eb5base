'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';
import SignInPromptModal from './SignInPromptModal';

type AuthPromptContextValue = {
  user: User | null;
  authLoading: boolean;
  promptSignIn: (redirectPath?: string) => void;
};

const AuthPromptContext = createContext<AuthPromptContextValue | null>(null);

export function useAuthPrompt() {
  const ctx = useContext(AuthPromptContext);
  if (!ctx) {
    throw new Error('useAuthPrompt must be used within AuthPromptProvider');
  }
  return ctx;
}

export function AuthPromptProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [redirectPath, setRedirectPath] = useState('/');

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null);
      setAuthLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const promptSignIn = useCallback(
    (path?: string) => {
      setRedirectPath(path || pathname || '/');
      setOpen(true);
    },
    [pathname]
  );

  const goToLogin = useCallback(() => {
    setOpen(false);
    router.push(`/login?redirect=${encodeURIComponent(redirectPath)}`);
  }, [router, redirectPath]);

  const dismiss = useCallback(() => {
    setOpen(false);
  }, []);

  const value = useMemo(
    () => ({ user, authLoading, promptSignIn }),
    [user, authLoading, promptSignIn]
  );

  return (
    <AuthPromptContext.Provider value={value}>
      {children}
      <SignInPromptModal open={open} onDismiss={dismiss} onSignIn={goToLogin} />
    </AuthPromptContext.Provider>
  );
}

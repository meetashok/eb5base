'use client';

import Link from 'next/link';
import type { ComponentProps } from 'react';
import { useAuthPrompt } from './AuthPromptProvider';

type AuthGateLinkProps = ComponentProps<typeof Link>;

export default function AuthGateLink({ href, onClick, ...props }: AuthGateLinkProps) {
  const { user, authLoading, promptSignIn } = useAuthPrompt();

  const path = typeof href === 'string' ? href : href.pathname || '/';

  return (
    <Link
      href={href}
      {...props}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented || authLoading) return;
        if (!user) {
          e.preventDefault();
          promptSignIn(path);
        }
      }}
    />
  );
}

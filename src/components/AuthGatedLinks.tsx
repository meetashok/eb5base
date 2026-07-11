'use client';

import type { ComponentProps } from 'react';
import AuthGateLink from './AuthGateLink';

export function AddProjectLink(props: Omit<ComponentProps<typeof AuthGateLink>, 'href'>) {
  return <AuthGateLink href="/projects/add" {...props} />;
}

export function AddRcLink(props: Omit<ComponentProps<typeof AuthGateLink>, 'href'>) {
  return <AuthGateLink href="/rc/add" {...props} />;
}

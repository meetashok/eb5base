import type { Metadata } from 'next';
import { nprmMetadata } from '@/lib/nprm/metadata';

export const metadata: Metadata = nprmMetadata('overview');

export default function NprmLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

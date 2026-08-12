import { redirect } from 'next/navigation';
import { I485_DEFAULT_PATH } from '@/lib/analysis/i485Routes';

/** Canonical explorer entry is /analysis/i485/inventory. */
export default function I485IndexRedirect() {
  redirect(I485_DEFAULT_PATH);
}

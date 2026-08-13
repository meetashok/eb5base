import { redirect } from 'next/navigation';
import { I526_DEFAULT_PATH } from '@/lib/analysis/i526Routes';

export default function I526Root() {
  redirect(I526_DEFAULT_PATH);
}

import { redirect } from 'next/navigation';

export default function LegacyNewRcRedirect() {
  redirect('/rc/add');
}

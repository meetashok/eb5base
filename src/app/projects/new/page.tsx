import { redirect } from 'next/navigation';

export default function LegacyNewProjectRedirect() {
  redirect('/projects/add');
}

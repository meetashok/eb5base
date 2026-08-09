import { redirect } from 'next/navigation';

/** Legacy / short-path alias for the Status Update builder. */
export default function Eb5StatusRedirectPage() {
  redirect('/status');
}

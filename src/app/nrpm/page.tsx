import { redirect } from 'next/navigation';

/** Typo alias - canonicalize to /nprm */
export default function NrpmTypoRedirect() {
  redirect('/nprm');
}

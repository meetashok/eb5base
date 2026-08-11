import { redirect } from 'next/navigation';

/** Legacy Themes URL → Summary (six key topics). */
export default function CommentThemesRedirect() {
  redirect('/nprm/summary');
}

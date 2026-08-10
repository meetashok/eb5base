import type { Metadata } from 'next';
import { permanentRedirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Disclaimer',
  description:
    'EB5 Base disclaimer lives on the About page. Not legal or financial advice; not affiliated with USCIS or DHS.',
  robots: { index: false, follow: true },
};

/** Legacy URL: send everyone to About → Disclaimer. */
export default function DisclaimerRedirectPage() {
  permanentRedirect('/about#disclaimer');
}

import { createNprmOgImage, OG_CONTENT_TYPE, OG_SIZE } from '@/lib/og';

export const runtime = 'nodejs';
export const alt =
  'EB5 Base NPRM guide — plain-English EB-5 proposed rule summary and comment builder';
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

/** Stable share card for WhatsApp / social previews of /nprm. */
export const revalidate = 86400;

export default async function Image() {
  return createNprmOgImage();
}

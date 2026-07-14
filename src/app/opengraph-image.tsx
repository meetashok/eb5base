import { createOgImage, OG_CONTENT_TYPE, OG_SIZE } from '@/lib/og';

export const runtime = 'nodejs';
export const alt = 'EB5 Base - EB-5 case status tracker';
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export const revalidate = 3600;

export default async function Image() {
  return createOgImage();
}

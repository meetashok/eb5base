import { createOgImage, OG_CONTENT_TYPE, OG_SIZE } from '@/lib/og';

export const runtime = 'nodejs';
export const alt = 'EB5 Base';
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

/** Revalidate roughly hourly so chat previews can pick up fresh directory stats. */
export const revalidate = 3600;

export default async function Image() {
  return createOgImage();
}

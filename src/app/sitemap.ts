import type { MetadataRoute } from 'next';
import { isMaintenanceMode } from '@/lib/maintenance';

const BASE = 'https://eb5base.com';

export default function sitemap(): MetadataRoute.Sitemap {
  const lastMod = new Date();

  const core = [
    '/',
    '/nprm',
    '/nprm/summary',
    '/nprm/themes',
    '/nprm/comment-themes',
    '/nprm/write',
    '/nprm/builder',
    '/nprm/comments',
    '/nprm/about',
    '/status',
    '/status-update',
    '/tracker',
    '/case-tracker',
    '/about',
    '/debug/crawl',
    '/debug/plain',
  ];

  const full = [
    ...core,
    '/privacy',
    '/terms',
    '/resources',
    '/contact',
    '/debug/crawl',
    '/debug/plain',
  ];

  const paths = isMaintenanceMode() ? core : full;

  return paths.map((path) => ({
    url: `${BASE}${path === '/' ? '/' : path}`,
    lastModified: lastMod,
    changeFrequency: path.startsWith('/nprm') ? 'daily' : 'weekly',
    priority:
      path === '/' || path === '/nprm'
        ? 1
        : path.startsWith('/nprm')
          ? 0.9
          : 0.6,
  })) as MetadataRoute.Sitemap;
}

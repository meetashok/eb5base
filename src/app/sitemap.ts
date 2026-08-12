import type { MetadataRoute } from 'next';
import { isMaintenanceMode } from '@/lib/maintenance';

const BASE = 'https://eb5base.com';

export default function sitemap(): MetadataRoute.Sitemap {
  const lastMod = new Date();

  const core = [
    '/',
    '/nprm',
    '/nprm/summary',
    '/nprm/write',
    '/nprm/builder',
    '/nprm/comments',
    '/nprm/about',
    '/status',
    '/status-update',
    '/analysis',
    '/analysis/i485',
    '/analysis/i485/inventory',
    '/analysis/i485/priority-date',
    '/analysis/i485/compare',
    '/analysis/i485/data',
    '/tracker',
    '/case-tracker',
    '/about',
    '/robots.txt',
    '/sitemap.xml',
    '/debug/crawl',
    '/debug/plain',
    '/debug/text',
    '/api/crawl-test',
  ];

  const full = [
    ...core,
    '/privacy',
    '/terms',
    '/resources',
    '/contact',
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

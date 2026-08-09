import type { MetadataRoute } from 'next';
import { isMaintenanceMode } from '@/lib/maintenance';

const BASE = 'https://eb5base.com';

export default function sitemap(): MetadataRoute.Sitemap {
  if (isMaintenanceMode()) {
    return [
      { url: `${BASE}/`, changeFrequency: 'weekly', priority: 1 },
      { url: `${BASE}/nprm`, changeFrequency: 'daily', priority: 0.95 },
      { url: `${BASE}/nprm/summary`, changeFrequency: 'weekly', priority: 0.9 },
      { url: `${BASE}/nprm/themes`, changeFrequency: 'weekly', priority: 0.85 },
      { url: `${BASE}/nprm/write`, changeFrequency: 'weekly', priority: 0.9 },
      { url: `${BASE}/nprm/comments`, changeFrequency: 'daily', priority: 0.85 },
      { url: `${BASE}/status`, changeFrequency: 'monthly', priority: 0.7 },
      { url: `${BASE}/tracker`, changeFrequency: 'monthly', priority: 0.6 },
      { url: `${BASE}/about`, changeFrequency: 'monthly', priority: 0.5 },
      { url: `${BASE}/disclaimer`, changeFrequency: 'yearly', priority: 0.4 },
    ];
  }

  const lastMod = new Date();
  const paths = [
    '/',
    '/nprm',
    '/nprm/summary',
    '/nprm/themes',
    '/nprm/write',
    '/nprm/comments',
    '/nprm/about',
    '/status',
    '/tracker',
    '/about',
    '/privacy',
    '/terms',
    '/disclaimer',
    '/resources',
    '/contact',
  ];

  return paths.map((path) => ({
    url: `${BASE}${path === '/' ? '/' : path}`,
    lastModified: lastMod,
    changeFrequency: path.startsWith('/nprm') ? 'daily' : 'weekly',
    priority: path === '/' || path === '/nprm' ? 1 : path.startsWith('/nprm') ? 0.9 : 0.6,
  })) as MetadataRoute.Sitemap;
}

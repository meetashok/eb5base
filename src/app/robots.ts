import type { MetadataRoute } from 'next';
import { isMaintenanceMode } from '@/lib/maintenance';

export default function robots(): MetadataRoute.Robots {
  if (isMaintenanceMode()) {
    return {
      rules: {
        userAgent: '*',
        allow: ['/', '/nprm', '/nprm/', '/status', '/tracker', '/about', '/disclaimer'],
        disallow: ['/admin', '/projects', '/rc'],
      },
      sitemap: 'https://eb5base.com/sitemap.xml',
    };
  }

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/api/'],
    },
    sitemap: 'https://eb5base.com/sitemap.xml',
  };
}

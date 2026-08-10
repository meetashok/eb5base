import type { MetadataRoute } from 'next';
import { isMaintenanceMode } from '@/lib/maintenance';

const CRAWLER_AGENTS = [
  'Googlebot',
  'Bingbot',
  'facebookexternalhit',
  'Facebot',
  'LinkedInBot',
  'Twitterbot',
  'Slackbot',
  'MetaAI',
  'Applebot',
];

export default function robots(): MetadataRoute.Robots {
  const sitemap = 'https://eb5base.com/sitemap.xml';

  if (isMaintenanceMode()) {
    return {
      rules: [
        {
          userAgent: '*',
          allow: [
            '/',
            '/nprm',
            '/nprm/',
            '/status',
            '/tracker',
            '/about',
            '/debug',
            '/robots.txt',
            '/sitemap.xml',
          ],
          disallow: ['/admin', '/projects', '/rc', '/api/', '/_next/'],
        },
        {
          userAgent: CRAWLER_AGENTS,
          allow: [
            '/',
            '/nprm',
            '/nprm/',
            '/status',
            '/tracker',
            '/about',
            '/debug',
            '/robots.txt',
            '/sitemap.xml',
          ],
        },
      ],
      sitemap,
    };
  }

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/api/', '/_next/'],
      },
      {
        userAgent: CRAWLER_AGENTS,
        allow: '/',
      },
    ],
    sitemap,
  };
}

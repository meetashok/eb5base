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

/** Keep /api/crawl-test crawlable; do not blanket-disallow /api/. */
const DISALLOW = ['/admin/', '/api/private/'];

const PUBLIC_ALLOW = [
  '/',
  '/nprm',
  '/nprm/',
  '/status',
  '/tracker',
  '/about',
  '/debug',
  '/debug/',
  '/robots.txt',
  '/sitemap.xml',
  '/api/crawl-test',
];

export default function robots(): MetadataRoute.Robots {
  const sitemap = 'https://eb5base.com/sitemap.xml';

  if (isMaintenanceMode()) {
    return {
      rules: [
        {
          userAgent: '*',
          allow: PUBLIC_ALLOW,
          disallow: DISALLOW,
        },
        {
          userAgent: CRAWLER_AGENTS,
          allow: PUBLIC_ALLOW,
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
        disallow: DISALLOW,
      },
      {
        userAgent: CRAWLER_AGENTS,
        allow: '/',
      },
    ],
    sitemap,
  };
}

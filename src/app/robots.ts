import type { MetadataRoute } from 'next';
import { isMaintenanceMode } from '@/lib/maintenance';

export default function robots(): MetadataRoute.Robots {
  if (isMaintenanceMode()) {
    return {
      rules: {
        userAgent: '*',
        disallow: '/',
      },
    };
  }

  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
  };
}

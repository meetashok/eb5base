import { createShareRoute } from '@/lib/analysis/createShareRoute';
import {
  chartPathWithParams,
  makeSharePayload,
  parseSharePayload,
  shortSharePath,
  shortShareUrl,
  type I526SharePayload,
} from '@/lib/analysis/i526ShareParams';
import { SITE_URL } from '@/lib/constants';

export const runtime = 'nodejs';

// i526 keeps a long-URL fallback when the share table is unavailable.
export const POST = createShareRoute<I526SharePayload>({
  table: 'i526_shares',
  logTag: 'i526-share',
  parsePayload: (body) => {
    const parsed = parseSharePayload(body);
    return parsed ? makeSharePayload(parsed) : null;
  },
  buildRow: (id, payload) => ({ id, view: payload.view, payload }),
  shortPath: shortSharePath,
  shortUrl: shortShareUrl,
  fallbackUrl: (payload) => `${SITE_URL}${chartPathWithParams(payload)}`,
});

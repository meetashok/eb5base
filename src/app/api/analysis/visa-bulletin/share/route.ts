import { createShareRoute } from '@/lib/analysis/createShareRoute';
import {
  parseSharePayload,
  shortSharePath,
  shortShareUrl,
} from '@/lib/analysis/visaBulletinShareParams';

export const runtime = 'nodejs';

export const POST = createShareRoute({
  table: 'visa_bulletin_shares',
  logTag: 'vb-share',
  parsePayload: parseSharePayload,
  buildRow: (id, payload) => ({ id, payload }),
  shortPath: shortSharePath,
  shortUrl: shortShareUrl,
  maxBytes: 4_000,
});

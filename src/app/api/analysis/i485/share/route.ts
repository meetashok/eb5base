import { createShareRoute } from '@/lib/analysis/createShareRoute';
import {
  prefsToSharePayload,
  sharePayloadToPrefs,
  shortSharePath,
  shortShareUrl,
  type I485SharePayload,
} from '@/lib/analysis/i485ShareParams';

export const runtime = 'nodejs';

export const POST = createShareRoute<I485SharePayload>({
  table: 'i485_shares',
  logTag: 'i485-share',
  parsePayload: (body) => {
    const parsed = sharePayloadToPrefs(body);
    return parsed ? prefsToSharePayload(parsed.prefs, parsed.hide) : null;
  },
  buildRow: (id, payload) => ({ id, view: payload.view, payload }),
  shortPath: shortSharePath,
  shortUrl: shortShareUrl,
});

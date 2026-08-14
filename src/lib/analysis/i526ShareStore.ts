import { createShareStore } from '@/lib/analysis/createShareStore';
import { parseSharePayload, type I526SharePayload } from '@/lib/analysis/i526ShareParams';

export const fetchI526Share = createShareStore<I526SharePayload>({
  table: 'i526_shares',
  toPayload: (raw) => parseSharePayload(raw),
});

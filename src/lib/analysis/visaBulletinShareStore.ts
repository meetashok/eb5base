import { createShareStore } from '@/lib/analysis/createShareStore';
import {
  parseSharePayload,
  type VisaBulletinSharePayload,
} from '@/lib/analysis/visaBulletinShareParams';

export const fetchVisaBulletinShare = createShareStore<VisaBulletinSharePayload>({
  table: 'visa_bulletin_shares',
  toPayload: (raw) => parseSharePayload(raw),
});

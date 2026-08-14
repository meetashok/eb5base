/** Serialize / parse Visa Bulletin explorer state for share links + short URLs. */
import { SITE_URL } from '@/lib/constants';
import type { VbDateType } from '@/lib/analysis/visaBulletin';

export const VB_SHARE_VERSION = 1 as const;

export interface VisaBulletinSharePayload {
  v: typeof VB_SHARE_VERSION;
  /** Bulletin month YYYY-MM (omitted = latest). */
  m?: string;
  /** Category key, e.g. "EB5.UNRESERVED". */
  cat: string;
  dt: VbDateType;
  y: 'date' | 'years';
  sc: 'eb5' | 'all';
  /** Table: which date leads each cell. */
  tp: VbDateType;
  /** Table: show the "change vs last bulletin" line. */
  ch: boolean;
}

const CAT_RE = /^EB[1-5]\.[A-Z_]+$/;

export function parseSharePayload(body: unknown): VisaBulletinSharePayload | null {
  if (!body || typeof body !== 'object') return null;
  const o = body as Record<string, unknown>;
  const cat = typeof o.cat === 'string' && CAT_RE.test(o.cat) ? o.cat : 'EB5.UNRESERVED';
  const dt: VbDateType = o.dt === 'FILING' ? 'FILING' : 'FINAL_ACTION';
  const y = o.y === 'date' ? 'date' : 'years';
  const sc = o.sc === 'all' ? 'all' : 'eb5';
  const tp: VbDateType = o.tp === 'FINAL_ACTION' ? 'FINAL_ACTION' : 'FILING';
  const ch = o.ch !== false;
  const m = typeof o.m === 'string' && /^\d{4}-\d{2}$/.test(o.m) ? o.m : undefined;
  return { v: VB_SHARE_VERSION, ...(m ? { m } : {}), cat, dt, y, sc, tp, ch };
}

export function sharePayloadToSearchParams(p: VisaBulletinSharePayload): URLSearchParams {
  const params = new URLSearchParams();
  if (p.m) params.set('m', p.m);
  params.set('cat', p.cat);
  params.set('dt', p.dt === 'FINAL_ACTION' ? 'fa' : 'dff');
  params.set('y', p.y);
  params.set('sc', p.sc);
  params.set('tp', p.tp === 'FINAL_ACTION' ? 'fa' : 'dff');
  params.set('ch', p.ch ? '1' : '0');
  return params;
}

/** Record form to feed VisaBulletinExplorerPage's searchParams prop. */
export function sharePayloadToSearchRecord(p: VisaBulletinSharePayload): Record<string, string> {
  const rec: Record<string, string> = {
    cat: p.cat,
    dt: p.dt === 'FINAL_ACTION' ? 'fa' : 'dff',
    y: p.y,
    sc: p.sc,
    tp: p.tp === 'FINAL_ACTION' ? 'fa' : 'dff',
    ch: p.ch ? '1' : '0',
  };
  if (p.m) rec.m = p.m;
  return rec;
}

export function chartPathWithParams(p: VisaBulletinSharePayload): string {
  return `/analysis/visa-bulletin?${sharePayloadToSearchParams(p).toString()}`;
}

export function shortSharePath(id: string): string {
  return `/analysis/visa-bulletin/s/${id}`;
}

export function shortShareUrl(id: string): string {
  return `${SITE_URL}${shortSharePath(id)}`;
}

export function shareViewTitle(): string {
  return 'EB-5 Visa Bulletin over time';
}

export { generateShareId, isValidShareId } from '@/lib/analysis/shareId';

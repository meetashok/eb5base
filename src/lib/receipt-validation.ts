import { RECEIPT_PREFIXES } from '@/lib/constants';

const RECEIPT_RE = new RegExp(
  `^(${RECEIPT_PREFIXES.join('|')})\\d{10}$`,
  'i'
);

export function normalizeReceiptInput(value: string): string {
  const cleaned = value.replace(/\s+/g, '').toUpperCase();
  // Auto-uppercase prefix while typing digits
  return cleaned;
}

export function isValidReceiptNumber(value: string): boolean {
  return RECEIPT_RE.test(value.trim());
}

export function receiptValidationMessage(value: string): string | null {
  const v = value.trim();
  if (!v) return null;
  if (v.length < 13) {
    return `Enter 13 characters (${v.length}/13)`;
  }
  if (v.length > 13) {
    return 'Receipt numbers are exactly 13 characters';
  }
  const prefix = v.slice(0, 3).toUpperCase();
  if (!(RECEIPT_PREFIXES as readonly string[]).includes(prefix)) {
    return `Prefix must be one of: ${RECEIPT_PREFIXES.join(', ')}`;
  }
  if (!/^\d{10}$/.test(v.slice(3))) {
    return 'Last 10 characters must be digits';
  }
  return null;
}

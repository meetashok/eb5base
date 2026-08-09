import { createHash, createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { RECEIPT_PREFIXES } from '@/lib/constants';

const ALGO = 'aes-256-gcm';
const IV_LENGTH = 12;

function getKey(): Buffer {
  const raw = process.env.RECEIPT_ENCRYPTION_KEY;
  if (!raw) {
    throw new Error('RECEIPT_ENCRYPTION_KEY is not configured');
  }
  // Accept 64-char hex (32 bytes) or derive from any string for local/dev convenience
  if (/^[0-9a-fA-F]{64}$/.test(raw)) {
    return Buffer.from(raw, 'hex');
  }
  return createHash('sha256').update(raw).digest();
}

/**
 * Encrypt a receipt number with AES-256-GCM.
 * Stored format: base64(iv):base64(ciphertext):base64(authTag)
 */
export function encryptReceiptNumber(plaintext: string): string {
  const normalized = plaintext.trim().toUpperCase();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGO, getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(normalized, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('base64')}:${encrypted.toString('base64')}:${tag.toString('base64')}`;
}

export function decryptReceiptNumber(payload: string): string {
  const parts = payload.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted receipt format');
  }
  const [ivB64, dataB64, tagB64] = parts;
  const iv = Buffer.from(ivB64, 'base64');
  const data = Buffer.from(dataB64, 'base64');
  const tag = Buffer.from(tagB64, 'base64');
  const decipher = createDecipheriv(ALGO, getKey(), iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
  return decrypted.toString('utf8');
}

/** Mask for admin / non-owner views: IOE09326XXXXX */
export function maskReceiptNumber(receipt: string): string {
  const r = receipt.trim().toUpperCase();
  if (r.length < 8) return 'XXXXXXXXXXXXX';
  return `${r.slice(0, 8)}${'X'.repeat(Math.max(0, r.length - 8))}`;
}

export function extractServiceCenter(receipt: string): string | null {
  const prefix = receipt.trim().toUpperCase().slice(0, 3);
  return (RECEIPT_PREFIXES as readonly string[]).includes(prefix) ? prefix : null;
}

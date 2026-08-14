/** URL-safe short id + validator shared by all analysis share links. */

export function generateShareId(bytes = 6): string {
  const alphabet = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  let out = '';
  for (let i = 0; i < arr.length; i += 1) out += alphabet[arr[i]! % alphabet.length]!;
  return out;
}

export function isValidShareId(id: string): boolean {
  return /^[0-9a-zA-Z]{6,16}$/.test(id);
}

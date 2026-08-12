/** Shared Visx chart tokens and scale helpers (brand-aligned). */

export const chartColors = {
  bar: '#2d5a47', // secondary
  barHover: '#d4af37', // accent
  barUp: '#2d5a47', // inventory increase
  barDown: '#9e3a3a', // inventory decrease (error)
  line: '#0a1628', // primary
  point: '#0a1628',
  pointHover: '#d4af37',
  grid: '#e6dfd4', // base-300
  axis: '#6b7280',
  zero: '#c4bdb2',
} as const;

const nf = new Intl.NumberFormat('en-US');

export function formatAxisCount(n: number): string {
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  if (abs >= 1_000_000) {
    const v = abs / 1_000_000;
    return `${sign}${Number.isInteger(v) ? v : v.toFixed(1)}M`;
  }
  if (abs >= 1_000) {
    const v = abs / 1_000;
    return `${sign}${Number.isInteger(v) ? v : v.toFixed(1)}k`;
  }
  return `${sign}${nf.format(abs)}`;
}

export function formatSignedCount(n: number): string {
  if (n > 0) return `+${nf.format(n)}`;
  if (n < 0) return nf.format(n); // already has minus
  return '0';
}

/** Round max up to a clean chart ceiling and return evenly spaced ticks (incl. 0). */
export function niceTicks(maxValue: number, tickCount = 4): number[] {
  if (maxValue <= 0) return [0];
  const raw = maxValue / tickCount;
  const pow = 10 ** Math.floor(Math.log10(raw));
  const normalized = raw / pow;
  const niceStep =
    normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  const step = niceStep * pow;
  const ceiling = Math.ceil(maxValue / step) * step;
  const ticks: number[] = [];
  for (let v = 0; v <= ceiling + step / 1000; v += step) ticks.push(v);
  return ticks;
}

/** Symmetric ticks around zero for signed (delta) charts. */
export function niceSymmetricTicks(maxAbs: number, tickCount = 4): number[] {
  const positive = niceTicks(Math.max(maxAbs, 1), tickCount);
  const ceiling = positive[positive.length - 1] || 1;
  const step = positive.length > 1 ? positive[1]! : ceiling;
  const ticks: number[] = [];
  for (let v = -ceiling; v <= ceiling + step / 1000; v += step) {
    ticks.push(Math.round(v * 1e6) / 1e6);
  }
  return ticks;
}

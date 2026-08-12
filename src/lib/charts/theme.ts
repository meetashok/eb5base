/** Shared Visx chart tokens and scale helpers (brand-aligned). */

export const chartColors = {
  bar: '#2d5a47', // secondary
  barHover: '#d4af37', // accent
  line: '#0a1628', // primary
  point: '#0a1628',
  pointHover: '#d4af37',
  grid: '#e6dfd4', // base-300
  axis: '#6b7280',
  zero: '#c4bdb2',
} as const;

const nf = new Intl.NumberFormat('en-US');

export function formatAxisCount(n: number): string {
  if (n >= 1_000_000) {
    const v = n / 1_000_000;
    return `${Number.isInteger(v) ? v : v.toFixed(1)}M`;
  }
  if (n >= 1_000) {
    const v = n / 1_000;
    return `${Number.isInteger(v) ? v : v.toFixed(1)}k`;
  }
  return nf.format(n);
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

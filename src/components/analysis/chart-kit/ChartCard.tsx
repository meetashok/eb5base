import type { ReactNode } from 'react';
import { chartCardClass } from './tokens';

/**
 * The standard analysis chart/section card. No className escape hatch - every
 * chart card looks the same by construction. Compose a ChartHeader as the first
 * child to get the tinted header bar.
 */
export default function ChartCard({ children }: { children: ReactNode }) {
  return <section className={chartCardClass}>{children}</section>;
}

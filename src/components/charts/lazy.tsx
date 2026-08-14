'use client';

import dynamic from 'next/dynamic';
import ChartSkeleton from '@/components/charts/ChartSkeleton';

/**
 * Lazily-loaded chart components. These pull in @visx (~120 kB) as a separate
 * client chunk instead of the route's initial JS. Charts already render an
 * empty box until their width is measured client-side, so ssr:false costs no
 * meaningful SSR/SEO - we just defer the heavy chunk.
 */

export const BarChart = dynamic(() => import('@/components/charts/BarChart'), {
  ssr: false,
  loading: () => <ChartSkeleton />,
});

export const DiffBarChart = dynamic(() => import('@/components/charts/DiffBarChart'), {
  ssr: false,
  loading: () => <ChartSkeleton />,
});

export const LineChart = dynamic(() => import('@/components/charts/LineChart'), {
  ssr: false,
  loading: () => <ChartSkeleton />,
});

export const MultiSeriesLineChart = dynamic(
  () => import('@/components/charts/MultiSeriesLineChart'),
  {
    ssr: false,
    loading: () => <ChartSkeleton />,
  },
);

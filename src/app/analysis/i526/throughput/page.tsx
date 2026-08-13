import { redirect } from 'next/navigation';

// 'Throughput & processing' is hidden for now (tab removed from I526ViewBar).
// To revisit, restore the I526ExplorerPage render below (see git history) and
// re-add the tab in src/components/analysis/I526ViewBar.tsx.
export default function I526ThroughputRoute() {
  redirect('/analysis/i526/trend');
}

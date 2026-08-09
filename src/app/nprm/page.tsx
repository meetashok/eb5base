import NprmShell from './NprmShell';

// Request-time so Hatch feed publishes show up on every page load.
export const dynamic = 'force-dynamic';

export default function NprmPage() {
  return <NprmShell tab="overview" />;
}

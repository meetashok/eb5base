/** Placeholder shown while a lazily-loaded chart chunk is fetching. */
export default function ChartSkeleton({ height = 280 }: { height?: number }) {
  return (
    <div
      className="skeleton-shimmer w-full rounded-lg"
      style={{ height }}
      role="presentation"
      aria-hidden
    />
  );
}

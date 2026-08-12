/** Shared X-axis caption under Visx charts. */
export default function ChartXAxisLabel({
  label,
  paddingLeft = 40,
}: {
  label: string;
  paddingLeft?: number;
}) {
  return (
    <p
      className="pt-1 text-left text-xs font-medium text-neutral/55"
      style={{ paddingLeft }}
    >
      <span aria-hidden className="mr-1.5 text-neutral/40">
        →
      </span>
      {label}
    </p>
  );
}

'use client';

interface VolumePoint {
  date: string;
  count: number;
}

/** Fill every calendar day between first and last so the axis is continuous. */
function fillDailySeries(data: VolumePoint[]): VolumePoint[] {
  if (data.length === 0) return [];
  const byDate = new Map(data.map((d) => [d.date, d.count]));
  const start = new Date(`${data[0].date}T00:00:00Z`);
  const end = new Date(`${data[data.length - 1].date}T00:00:00Z`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return data;

  const out: VolumePoint[] = [];
  for (let t = start.getTime(); t <= end.getTime(); t += 24 * 60 * 60 * 1000) {
    const iso = new Date(t).toISOString().slice(0, 10);
    out.push({ date: iso, count: byDate.get(iso) || 0 });
  }
  return out;
}

function shortLabel(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

export default function VolumeChart({ data }: { data: VolumePoint[] }) {
  if (data.length === 0) {
    return (
      <p className="text-sm text-neutral">No posted-date volume data yet.</p>
    );
  }

  const series = fillDailySeries(data);
  const max = Math.max(...series.map((d) => d.count), 1);
  const chartH = 160; // px - absolute so bar heights resolve reliably

  return (
    <div className="w-full">
      <div
        className="flex items-end gap-0.5 sm:gap-1"
        style={{ height: chartH }}
        role="img"
        aria-label="Daily comment volume chart"
      >
        {series.map((d) => {
          const barPx =
            d.count <= 0 ? 0 : Math.max(6, Math.round((d.count / max) * chartH));
          return (
            <div
              key={d.date}
              className="group relative flex-1 min-w-0 h-full flex flex-col justify-end items-center"
            >
              <div
                className={`w-full max-w-[14px] sm:max-w-[18px] mx-auto rounded-t-sm transition-colors duration-150 ${
                  d.count > 0
                    ? 'bg-secondary group-hover:bg-primary'
                    : 'bg-transparent'
                }`}
                style={{ height: barPx }}
                title={`${d.date}: ${d.count} comment${d.count === 1 ? '' : 's'}`}
              />
              {/* Hover tooltip */}
              <div className="pointer-events-none absolute -top-1 left-1/2 z-10 hidden -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-md border border-base-300 bg-base-100 px-2 py-1 text-[10px] font-semibold text-primary shadow-soft group-hover:block">
                {shortLabel(d.date)} · {d.count}
              </div>
              <span className="sr-only">
                {d.date}: {d.count} comments
              </span>
            </div>
          );
        })}
      </div>
      <div className="flex justify-between mt-2 text-[10px] sm:text-xs font-semibold text-neutral">
        <span>{shortLabel(series[0].date)}</span>
        <span>
          Peak {max}/day · {data.reduce((s, d) => s + d.count, 0)} total
        </span>
        <span>{shortLabel(series[series.length - 1].date)}</span>
      </div>
    </div>
  );
}

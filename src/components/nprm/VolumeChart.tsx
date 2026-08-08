'use client';

interface VolumePoint {
  date: string;
  count: number;
}

export default function VolumeChart({ data }: { data: VolumePoint[] }) {
  if (data.length === 0) {
    return (
      <p className="text-sm text-neutral">No posted-date volume data yet.</p>
    );
  }

  const max = Math.max(...data.map((d) => d.count), 1);

  return (
    <div className="w-full">
      <div
        className="flex items-end gap-1 h-36 sm:h-40"
        role="img"
        aria-label="Daily comment volume chart"
      >
        {data.map((d) => {
          const height = Math.max(8, Math.round((d.count / max) * 100));
          return (
            <div
              key={d.date}
              className="group relative flex-1 min-w-0 flex flex-col justify-end items-center"
            >
              <div
                className="w-full max-w-[18px] mx-auto rounded-t-sm bg-secondary group-hover:bg-primary transition-colors duration-200"
                style={{ height: `${height}%` }}
                title={`${d.date}: ${d.count}`}
              />
              <span className="sr-only">
                {d.date}: {d.count} comments
              </span>
            </div>
          );
        })}
      </div>
      <div className="flex justify-between mt-2 text-[10px] sm:text-xs font-medium text-neutral">
        <span>{data[0]?.date}</span>
        <span>{data[data.length - 1]?.date}</span>
      </div>
    </div>
  );
}

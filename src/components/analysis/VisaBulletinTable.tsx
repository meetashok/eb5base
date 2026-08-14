'use client';

import {
  CATEGORY_ROWS,
  COUNTRY_LABELS,
  COUNTRY_ORDER,
  cellKey,
  cutoffDeltaDays,
  statusLabel,
  type VisaBulletinDate,
} from '@/lib/analysis/visaBulletin';

interface Props {
  index: Map<string, VisaBulletinDate>;
  releaseId: number;
  prevReleaseId: number | null;
}

function shortStatus(row: VisaBulletinDate | undefined): string {
  if (!row) return '';
  if (row.status === 'CURRENT') return 'C';
  if (row.status === 'UNAVAILABLE') return 'U';
  return 'date';
}

/** Movement of the final action date vs the previous bulletin. */
function MovementChip({
  fad,
  prevFad,
}: {
  fad: VisaBulletinDate | undefined;
  prevFad: VisaBulletinDate | undefined;
}) {
  if (!fad) return null;
  const now = shortStatus(fad);
  const before = shortStatus(prevFad);

  if (!prevFad) return <span className="text-neutral/40">new</span>;

  if (now === 'date' && before === 'date') {
    const d = cutoffDeltaDays(prevFad.cutoff_date, fad.cutoff_date) ?? 0;
    if (d === 0) return <span className="text-neutral/40">no change</span>;
    const cls = d > 0 ? 'text-secondary' : 'text-error';
    return (
      <span className={cls}>
        {d > 0 ? '▲' : '▼'} {d > 0 ? '+' : ''}
        {d}d
      </span>
    );
  }
  if (now === before) return <span className="text-neutral/40">no change</span>;
  // Status transition (e.g. Current -> date, date -> Unavailable).
  const toLabel = fad.status === 'CURRENT' ? 'Current' : fad.status === 'UNAVAILABLE' ? 'Unavail.' : 'dated';
  return <span className="text-neutral/50">→ {toLabel}</span>;
}

/** Gap between Dates for Filing and Final Action for the same cell. */
function FilingChip({
  fad,
  filing,
}: {
  fad: VisaBulletinDate | undefined;
  filing: VisaBulletinDate | undefined;
}) {
  if (!filing) return null;
  if (filing.status === 'CURRENT') return <span className="text-neutral/45">Filing: C</span>;
  if (filing.status === 'UNAVAILABLE') return <span className="text-neutral/45">Filing: U</span>;
  if (!fad || fad.status !== 'DATE') {
    return <span className="text-neutral/45">Filing dated</span>;
  }
  const d = cutoffDeltaDays(fad.cutoff_date, filing.cutoff_date) ?? 0;
  const months = Math.round(d / 30);
  if (months === 0) return <span className="text-neutral/45">Filing = FA</span>;
  return (
    <span className="text-neutral/45">
      Filing {months > 0 ? '+' : ''}
      {months}mo
    </span>
  );
}

export default function VisaBulletinTable({ index, releaseId, prevReleaseId }: Props) {
  // Only render rows that exist for this bulletin (pre-RIA lacks set-asides).
  const rows = CATEGORY_ROWS.filter((r) =>
    COUNTRY_ORDER.some(
      (c) =>
        index.has(cellKey(releaseId, r.preference, r.subcategory, c, 'FINAL_ACTION')) ||
        index.has(cellKey(releaseId, r.preference, r.subcategory, c, 'FILING')),
    ),
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse text-sm">
        <thead>
          <tr className="border-b-2 border-base-300 text-left">
            <th className="py-2 pr-3 font-semibold text-primary">Employment-based</th>
            {COUNTRY_ORDER.map((c) => (
              <th key={c} className="px-2 py-2 text-right font-semibold text-primary">
                {COUNTRY_LABELS[c]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr
              key={`${r.preference}-${r.subcategory}`}
              className={`border-b border-base-200 align-top ${r.eb5 ? 'bg-secondary/5' : ''}`}
            >
              <th
                scope="row"
                className={`py-2 pr-3 text-left font-medium ${r.eb5 ? 'text-primary' : 'text-neutral'}`}
              >
                {r.label}
              </th>
              {COUNTRY_ORDER.map((c) => {
                const fad = index.get(cellKey(releaseId, r.preference, r.subcategory, c, 'FINAL_ACTION'));
                const filing = index.get(cellKey(releaseId, r.preference, r.subcategory, c, 'FILING'));
                const prevFad = prevReleaseId
                  ? index.get(cellKey(prevReleaseId, r.preference, r.subcategory, c, 'FINAL_ACTION'))
                  : undefined;
                const primary = fad ?? filing;
                return (
                  <td key={c} className="px-2 py-2 text-right tabular-nums">
                    <div className="font-semibold text-primary">
                      {primary ? statusLabel(primary) : '-'}
                    </div>
                    <div className="mt-0.5 flex flex-col items-end gap-0.5 text-[11px] leading-tight">
                      <MovementChip fad={fad} prevFad={prevFad} />
                      <FilingChip fad={fad} filing={filing} />
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

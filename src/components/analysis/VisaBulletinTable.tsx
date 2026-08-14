'use client';

import { useState, type ReactNode } from 'react';
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
  eb5Only: boolean;
}

/** Movement of a cut-off vs the previous bulletin, as text. */
function movementText(
  row: VisaBulletinDate | undefined,
  prev: VisaBulletinDate | undefined,
): string {
  if (!row) return '-';
  if (!prev) return 'new';
  if (row.status === 'DATE' && prev.status === 'DATE') {
    const d = cutoffDeltaDays(prev.cutoff_date, row.cutoff_date) ?? 0;
    if (d === 0) return 'no change';
    return `${d > 0 ? '+' : ''}${d}d`;
  }
  if (row.status === prev.status) return 'no change';
  const to = row.status === 'CURRENT' ? 'Current' : row.status === 'UNAVAILABLE' ? 'Unavailable' : 'dated';
  return `-> ${to}`;
}

function movementClass(
  row: VisaBulletinDate | undefined,
  prev: VisaBulletinDate | undefined,
): string {
  if (!row || !prev || row.status !== 'DATE' || prev.status !== 'DATE') return 'text-neutral/50';
  const d = cutoffDeltaDays(prev.cutoff_date, row.cutoff_date) ?? 0;
  if (d > 0) return 'text-secondary';
  if (d < 0) return 'text-error';
  return 'text-neutral/50';
}

interface CellData {
  fad?: VisaBulletinDate;
  filing?: VisaBulletinDate;
  prevFad?: VisaBulletinDate;
  prevFiling?: VisaBulletinDate;
}

/** Color the primary value: Current green, Unavailable grey, dates dark. */
function statusColorClass(status: VisaBulletinDate['status'] | undefined): string {
  if (status === 'CURRENT') return 'text-secondary';
  if (status === 'UNAVAILABLE') return 'text-neutral/45';
  return 'text-primary';
}

/** Compact in-cell display: filing date on top, final action as an offset. */
function CellFace({ fad, filing }: CellData) {
  const primary = filing ?? fad;
  let secondary: ReactNode = null;
  if (filing?.status === 'DATE' && fad?.status === 'DATE') {
    const months = Math.round((cutoffDeltaDays(filing.cutoff_date, fad.cutoff_date) ?? 0) / 30);
    secondary = <span className="text-neutral/45">FA {months > 0 ? '+' : ''}{months}mo</span>;
  } else if (fad && fad !== primary) {
    secondary = <span className="text-neutral/45">FA: {statusLabel(fad)}</span>;
  }
  return (
    <>
      <div className={`font-semibold ${statusColorClass(primary?.status)}`}>
        {primary ? statusLabel(primary) : '-'}
      </div>
      {secondary ? <div className="mt-0.5 text-[11px] leading-tight">{secondary}</div> : null}
    </>
  );
}

export default function VisaBulletinTable({ index, releaseId, prevReleaseId, eb5Only }: Props) {
  const [tip, setTip] = useState<{ x: number; y: number; node: ReactNode } | null>(null);

  const rows = CATEGORY_ROWS.filter(
    (r) =>
      (!eb5Only || r.preference === 'EB5') &&
      COUNTRY_ORDER.some(
        (c) =>
          index.has(cellKey(releaseId, r.preference, r.subcategory, c, 'FINAL_ACTION')) ||
          index.has(cellKey(releaseId, r.preference, r.subcategory, c, 'FILING')),
      ),
  );

  function tooltipFor(label: string, country: string, cell: CellData): ReactNode {
    return (
      <div className="space-y-1">
        <div className="font-semibold text-primary-content">
          {label} - {COUNTRY_LABELS[country as keyof typeof COUNTRY_LABELS] ?? country}
        </div>
        <div className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-0.5 text-primary-content/85">
          <span className="text-primary-content/60">Final Action</span>
          <span className="tabular-nums">
            {statusLabel(cell.fad ?? { status: 'UNAVAILABLE', cutoff_date: null })}{' '}
            <span className={movementClass(cell.fad, cell.prevFad)}>({movementText(cell.fad, cell.prevFad)})</span>
          </span>
          <span className="text-primary-content/60">Dates for Filing</span>
          <span className="tabular-nums">
            {cell.filing ? statusLabel(cell.filing) : '-'}{' '}
            {cell.filing ? (
              <span className={movementClass(cell.filing, cell.prevFiling)}>
                ({movementText(cell.filing, cell.prevFiling)})
              </span>
            ) : null}
          </span>
        </div>
      </div>
    );
  }

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
                const cell: CellData = {
                  fad: index.get(cellKey(releaseId, r.preference, r.subcategory, c, 'FINAL_ACTION')),
                  filing: index.get(cellKey(releaseId, r.preference, r.subcategory, c, 'FILING')),
                  prevFad: prevReleaseId
                    ? index.get(cellKey(prevReleaseId, r.preference, r.subcategory, c, 'FINAL_ACTION'))
                    : undefined,
                  prevFiling: prevReleaseId
                    ? index.get(cellKey(prevReleaseId, r.preference, r.subcategory, c, 'FILING'))
                    : undefined,
                };
                return (
                  <td
                    key={c}
                    className="px-2 py-2 text-right tabular-nums"
                    onMouseMove={(e) =>
                      setTip({ x: e.clientX, y: e.clientY, node: tooltipFor(r.label, c, cell) })
                    }
                    onMouseLeave={() => setTip(null)}
                  >
                    <CellFace {...cell} />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {tip ? (
        <div
          className="pointer-events-none fixed z-50 max-w-xs rounded-lg border border-primary-content/15 bg-neutral/95 px-3 py-2 text-xs shadow-nav backdrop-blur"
          style={{ left: Math.min(tip.x + 14, (typeof window !== 'undefined' ? window.innerWidth : 9999) - 280), top: tip.y + 14 }}
        >
          {tip.node}
        </div>
      ) : null}
    </div>
  );
}

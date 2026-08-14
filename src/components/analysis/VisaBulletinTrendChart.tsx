'use client';

import { AxisBottom, AxisLeft } from '@visx/axis';
import { curveMonotoneX } from '@visx/curve';
import { GridRows } from '@visx/grid';
import { Group } from '@visx/group';
import { scaleLinear, scalePoint } from '@visx/scale';
import { LinePath } from '@visx/shape';
import { useMemo, useState } from 'react';
import { chartColors } from '@/lib/charts/theme';
import ChartXAxisLabel from '@/components/charts/ChartXAxisLabel';
import ChartLegend from '@/components/charts/ChartLegend';
import ChartHoverReadout, { type HoverRow } from '@/components/charts/ChartHoverReadout';
import { useElementWidth } from '@/components/charts/useElementWidth';
import { useSeriesLegend } from '@/components/charts/useSeriesLegend';

export interface TrendXMeta {
  key: string;
  label: string;
  shortLabel: string;
}

export interface TrendSeries {
  key: string;
  label: string;
  color: string;
  /** One value per xAxis entry; null renders a gap (e.g. Unavailable). */
  data: (number | null)[];
  /**
   * Optional per-point tooltip override (e.g. "Unavailable" / "Current").
   * When set for an index, the tooltip shows it instead of the numeric value,
   * so a gap month still reports its status.
   */
  statusText?: (string | null)[];
}

export interface VisaBulletinTrendChartProps {
  xAxis: TrendXMeta[];
  series: TrendSeries[];
  /** Format a Y value for ticks + tooltip (date label or "9.7 yrs"). */
  formatY: (v: number) => string;
  /** Pin the Y-axis floor (e.g. 0 for "years behind"). */
  yMin?: number;
  /**
   * Invert the Y axis (larger value at the bottom). Used for the cut-off-date
   * mode so its line shape matches "years behind" (a more backlogged / older
   * cut-off sits higher, an improving one sits lower).
   */
  invertY?: boolean;
  /** The x key currently selected in the table (draws a marker). */
  selectedKey?: string | null;
  onSelectX?: (key: string) => void;
  /** Series keys hidden by default (still toggleable in the legend). */
  initialHiddenKeys?: string[];
  height?: number;
  ariaLabel?: string;
  xAxisLabel?: string;
}

const margin = { top: 12, right: 16, bottom: 40, left: 68 };
const SELECT_COLOR = '#2d5a47'; // secondary

/** ~6 evenly spaced tick values across [min, max]. */
function linearTicks(min: number, max: number, count = 6): number[] {
  if (max <= min) return [min];
  const step = (max - min) / count;
  const ticks: number[] = [];
  for (let i = 0; i <= count; i++) ticks.push(min + step * i);
  return ticks;
}

export default function VisaBulletinTrendChart({
  xAxis,
  series,
  formatY,
  yMin,
  invertY,
  selectedKey,
  onSelectX,
  initialHiddenKeys,
  height = 300,
  ariaLabel = 'Visa Bulletin trend',
  xAxisLabel,
}: VisaBulletinTrendChartProps) {
  const { ref, width } = useElementWidth<HTMLDivElement>();
  const [hoverKey, setHoverKey] = useState<string | null>(null);
  const { hiddenKeys, focusKey, setFocusKey, toggleSeries, emphasis } = useSeriesLegend(
    series.map((s) => s.key),
    initialHiddenKeys ?? [],
  );

  const visible = useMemo(
    () => series.filter((s) => !hiddenKeys.has(s.key)),
    [series, hiddenKeys],
  );
  const drawOrder = useMemo(() => {
    if (!focusKey) return visible;
    return [...visible].sort((a, b) => (a.key === focusKey ? 1 : b.key === focusKey ? -1 : 0));
  }, [visible, focusKey]);

  const [domainMin, domainMax] = useMemo(() => {
    const vals = visible.flatMap((s) => s.data.filter((v): v is number => v != null));
    if (vals.length === 0) return [yMin ?? 0, (yMin ?? 0) + 1];
    let lo = yMin != null ? yMin : Math.min(...vals);
    let hi = Math.max(...vals);
    if (hi === lo) hi = lo + 1;
    const pad = (hi - lo) * 0.05;
    if (yMin == null) lo -= pad;
    hi += pad;
    return [lo, hi];
  }, [visible, yMin]);

  const ticks = useMemo(() => linearTicks(domainMin, domainMax), [domainMin, domainMax]);

  const innerWidth = Math.max(width - margin.left - margin.right, 0);
  const innerHeight = height - margin.top - margin.bottom;

  const xScale = useMemo(
    () => scalePoint<string>({ domain: xAxis.map((d) => d.key), range: [0, innerWidth], padding: 0.5 }),
    [xAxis, innerWidth],
  );
  const yScale = useMemo(
    () =>
      scaleLinear<number>({
        domain: [domainMin, domainMax],
        range: invertY ? [0, innerHeight] : [innerHeight, 0],
        nice: false,
      }),
    [domainMin, domainMax, innerHeight, invertY],
  );

  const xTickKeys = useMemo(() => {
    if (xAxis.length <= 3) return xAxis.map((d) => d.key);
    const step = Math.max(1, Math.ceil(xAxis.length / 8));
    return xAxis.filter((_d, i) => i % step === 0 || i === xAxis.length - 1).map((d) => d.key);
  }, [xAxis]);

  const hoverMeta = hoverKey ? xAxis.find((d) => d.key === hoverKey) : null;
  const hoverIdx = hoverKey ? xAxis.findIndex((d) => d.key === hoverKey) : -1;
  const ready = width >= 10 && xAxis.length > 0 && series.length > 0;

  const hoverRows: HoverRow[] = hoverMeta
    ? (visible
        .map((s) => {
          const v = hoverIdx >= 0 ? s.data[hoverIdx] : null;
          const st = hoverIdx >= 0 ? s.statusText?.[hoverIdx] : null;
          if (v == null && !st) return null;
          return { key: s.key, color: s.color, label: s.label, value: st ?? formatY(v as number) };
        })
        .filter(Boolean) as HoverRow[])
    : [];

  return (
    <div className="w-full space-y-2" onMouseLeave={() => setHoverKey(null)}>
      <ChartLegend
        series={series.map((s) => ({ key: s.key, label: s.label, color: s.color }))}
        hiddenKeys={hiddenKeys}
        focusKey={focusKey}
        onToggle={toggleSeries}
        onFocus={setFocusKey}
        ariaLabel="Toggle country series"
      />

      <div className="relative w-full pt-12">
        <ChartHoverReadout metaLabel={hoverMeta?.label} rows={hoverRows} />

        <div ref={ref} className="w-full">
          {!ready ? (
            <div style={{ height }} aria-hidden />
          ) : (
            <svg width={width} height={height} role="img" aria-label={ariaLabel}>
              <Group left={margin.left} top={margin.top}>
                <GridRows
                  scale={yScale}
                  width={innerWidth}
                  tickValues={ticks}
                  stroke={chartColors.grid}
                  pointerEvents="none"
                />
                <AxisLeft
                  scale={yScale}
                  tickValues={ticks}
                  tickFormat={(v) => formatY(v as number)}
                  stroke={chartColors.zero}
                  tickStroke="transparent"
                  tickLabelProps={() => ({
                    fill: chartColors.axis,
                    fontSize: 10,
                    textAnchor: 'end',
                    dx: -4,
                    dy: '0.35em',
                    fontFamily: 'inherit',
                  })}
                  hideAxisLine
                  hideTicks
                />
                <AxisBottom
                  top={innerHeight}
                  scale={xScale}
                  tickValues={xTickKeys}
                  tickFormat={(key) => xAxis.find((d) => d.key === key)?.shortLabel ?? String(key)}
                  stroke={chartColors.zero}
                  tickStroke="transparent"
                  tickLabelProps={() => ({
                    fill: chartColors.axis,
                    fontSize: 10,
                    textAnchor: 'middle',
                    dy: '0.4em',
                    fontFamily: 'inherit',
                  })}
                  hideTicks
                />

                {selectedKey && xScale(selectedKey) != null ? (
                  <line
                    x1={xScale(selectedKey)}
                    x2={xScale(selectedKey)}
                    y1={0}
                    y2={innerHeight}
                    stroke={SELECT_COLOR}
                    strokeWidth={1.5}
                    strokeOpacity={0.5}
                    pointerEvents="none"
                  />
                ) : null}

                {drawOrder.map((s) => {
                  const pts = xAxis.map((x, i) => ({ key: x.key, value: s.data[i] ?? null }));
                  const { strokeWidth, opacity } = emphasis(s.key);
                  return (
                    <LinePath
                      key={s.key}
                      data={pts}
                      x={(d) => xScale(d.key) ?? 0}
                      y={(d) => yScale(d.value ?? 0) ?? 0}
                      defined={(d) => d.value != null}
                      curve={curveMonotoneX}
                      stroke={s.color}
                      strokeWidth={strokeWidth}
                      strokeOpacity={opacity}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  );
                })}

                {xAxis.map((meta, i) => {
                  const cx = xScale(meta.key) ?? 0;
                  const active = hoverKey === meta.key;
                  const band = Math.max(innerWidth / Math.max(xAxis.length, 1), 8);
                  return (
                    <g key={meta.key}>
                      <rect
                        x={cx - band / 2}
                        y={0}
                        width={band}
                        height={innerHeight}
                        fill="transparent"
                        style={{ cursor: onSelectX ? 'pointer' : 'default' }}
                        onMouseEnter={() => setHoverKey(meta.key)}
                        onMouseMove={() => setHoverKey(meta.key)}
                        onClick={() => onSelectX?.(meta.key)}
                      />
                      {active ? (
                        <line
                          x1={cx}
                          x2={cx}
                          y1={0}
                          y2={innerHeight}
                          stroke={chartColors.zero}
                          strokeWidth={1}
                          strokeDasharray="3 3"
                          pointerEvents="none"
                        />
                      ) : null}
                      {active
                        ? visible.map((s) => {
                            const v = s.data[i];
                            if (v == null) return null;
                            return (
                              <circle
                                key={s.key}
                                cx={cx}
                                cy={yScale(v) ?? 0}
                                r={4}
                                fill={s.color}
                                stroke="#faf7f2"
                                strokeWidth={2}
                                pointerEvents="none"
                              />
                            );
                          })
                        : null}
                    </g>
                  );
                })}
              </Group>
            </svg>
          )}
        </div>
      </div>
      {xAxisLabel ? <ChartXAxisLabel label={xAxisLabel} paddingLeft={margin.left} /> : null}
    </div>
  );
}

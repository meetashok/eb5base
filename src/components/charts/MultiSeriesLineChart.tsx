'use client';

import { AxisBottom, AxisLeft } from '@visx/axis';
import { curveMonotoneX } from '@visx/curve';
import { localPoint } from '@visx/event';
import { GridRows } from '@visx/grid';
import { Group } from '@visx/group';
import { scaleLinear, scalePoint } from '@visx/scale';
import { LinePath } from '@visx/shape';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  chartColors,
  formatAxisCount,
  niceTicks,
  seriesColor,
} from '@/lib/charts/theme';

export interface MultiSeriesPoint {
  key: string;
  value: number;
}

export interface MultiSeriesLine {
  key: string;
  label: string;
  color?: string;
  data: MultiSeriesPoint[];
}

export interface MultiSeriesXMeta {
  key: string;
  label: string;
  shortLabel: string;
}

export interface MultiSeriesLineChartProps {
  xAxis: MultiSeriesXMeta[];
  series: MultiSeriesLine[];
  height?: number;
  ariaLabel?: string;
  showTick?: (d: MultiSeriesXMeta, index: number) => boolean;
}

const margin = { top: 12, right: 12, bottom: 28, left: 40 };
const nf = new Intl.NumberFormat('en-US');

function useElementWidth<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setWidth(el.clientWidth);
    update();
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) setWidth(entry.contentRect.width);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return { ref, width };
}

export default function MultiSeriesLineChart({
  xAxis,
  series,
  height = 240,
  ariaLabel = 'Multi-series line chart',
  showTick,
}: MultiSeriesLineChartProps) {
  const { ref, width } = useElementWidth<HTMLDivElement>();
  const [hoverKey, setHoverKey] = useState<string | null>(null);

  const colored = useMemo(
    () =>
      series.map((s, i) => ({
        ...s,
        color: s.color ?? seriesColor(i),
      })),
    [series],
  );

  const dataMax = Math.max(1, ...colored.flatMap((s) => s.data.map((d) => d.value)));
  const ticks = useMemo(() => niceTicks(dataMax), [dataMax]);
  const axisMax = ticks[ticks.length - 1] || dataMax;

  const innerWidth = Math.max(width - margin.left - margin.right, 0);
  const innerHeight = height - margin.top - margin.bottom;

  const xScale = useMemo(
    () =>
      scalePoint<string>({
        domain: xAxis.map((d) => d.key),
        range: [0, innerWidth],
        padding: 0.5,
      }),
    [xAxis, innerWidth],
  );

  const yScale = useMemo(
    () =>
      scaleLinear<number>({
        domain: [0, axisMax],
        range: [innerHeight, 0],
        nice: false,
      }),
    [axisMax, innerHeight],
  );

  const xTickKeys = useMemo(() => {
    const filtered = xAxis.filter((d, i) => (showTick ? showTick(d, i) : true));
    if (filtered.length > 0) return filtered.map((d) => d.key);
    if (xAxis.length <= 3) return xAxis.map((d) => d.key);
    return [
      xAxis[0]!.key,
      xAxis[Math.floor(xAxis.length / 2)]!.key,
      xAxis[xAxis.length - 1]!.key,
    ];
  }, [xAxis, showTick]);

  const hoverMeta = hoverKey ? xAxis.find((d) => d.key === hoverKey) : null;
  const hoverValues = hoverKey
    ? colored.map((s) => ({
        key: s.key,
        label: s.label,
        color: s.color,
        value: s.data.find((d) => d.key === hoverKey)?.value ?? 0,
      }))
    : [];

  const ready = width >= 10 && xAxis.length > 0 && colored.length > 0;

  return (
    <div
      className="space-y-2 w-full"
      onMouseLeave={() => setHoverKey(null)}
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs min-h-4">
        {colored.map((s) => (
          <span key={s.key} className="inline-flex items-center gap-1.5 text-neutral/80">
            <span
              className="inline-block h-0.5 w-3 rounded-full"
              style={{ backgroundColor: s.color }}
              aria-hidden
            />
            {s.label}
          </span>
        ))}
      </div>

      {/* Fixed-height readout so hover never shifts the plot. */}
      <div
        className="h-11 text-xs font-semibold text-neutral overflow-hidden"
        aria-live="polite"
      >
        {hoverMeta ? (
          <div className="ml-auto text-right space-y-0.5 max-w-full">
            <div className="text-primary truncate">{hoverMeta.label}</div>
            <div className="flex flex-wrap justify-end gap-x-3 gap-y-0.5 tabular-nums font-medium text-neutral/80">
              {hoverValues.map((v) => (
                <span key={v.key} className="inline-flex items-center gap-1">
                  <span
                    className="inline-block h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: v.color }}
                    aria-hidden
                  />
                  {v.label} {nf.format(v.value)}
                </span>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <div ref={ref} className="w-full">
        {!ready ? (
          <div style={{ height }} aria-hidden />
        ) : (
          <svg
            width={width}
            height={height}
            role="img"
            aria-label={ariaLabel}
          >
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
                tickFormat={(v) => formatAxisCount(v as number)}
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
                tickFormat={(key) =>
                  xAxis.find((d) => d.key === key)?.shortLabel ?? String(key)
                }
                stroke={chartColors.zero}
                tickStroke="transparent"
                tickLabelProps={(value) => ({
                  fill: chartColors.axis,
                  fontSize: 9,
                  textAnchor: value === '_earlier' ? 'start' : 'middle',
                  dx: value === '_earlier' ? 2 : 0,
                  dy: '0.25em',
                  fontFamily: 'inherit',
                })}
                hideTicks
              />

              {colored.map((s) => (
                <LinePath
                  key={s.key}
                  data={s.data}
                  x={(d) => xScale(d.key) ?? 0}
                  y={(d) => yScale(d.value) ?? 0}
                  curve={curveMonotoneX}
                  stroke={s.color}
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ))}

              {xAxis.map((meta) => {
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
                      onMouseEnter={() => setHoverKey(meta.key)}
                      onMouseMove={(event) => {
                        const point = localPoint(event);
                        if (point) setHoverKey(meta.key);
                      }}
                    />
                    {active && (
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
                    )}
                    {colored.map((s) => {
                      const pt = s.data.find((d) => d.key === meta.key);
                      if (!pt) return null;
                      const cy = yScale(pt.value) ?? 0;
                      return (
                        <circle
                          key={`${s.key}-${meta.key}`}
                          cx={cx}
                          cy={cy}
                          r={active ? 4.5 : 2.5}
                          fill={s.color}
                          stroke="#faf7f2"
                          strokeWidth={active ? 2 : 1}
                          opacity={active ? 1 : 0.85}
                          pointerEvents="none"
                        />
                      );
                    })}
                  </g>
                );
              })}
            </Group>
          </svg>
        )}
      </div>
    </div>
  );
}

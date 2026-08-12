'use client';

import { AxisBottom, AxisLeft } from '@visx/axis';
import { GridRows } from '@visx/grid';
import { Group } from '@visx/group';
import { scaleBand, scaleLinear } from '@visx/scale';
import { Bar } from '@visx/shape';
import { useMemo, useState } from 'react';
import { chartColors, formatAxisCount, niceTicks } from '@/lib/charts/theme';

export interface BarChartDatum {
  key: string;
  /** Full label for hover / accessibility. */
  label: string;
  /** Compact X-axis tick. */
  shortLabel: string;
  value: number;
  /** Optional formatted value (e.g. "1,234+"). Defaults to locale count. */
  valueLabel?: string;
}

export interface BarChartProps {
  data: BarChartDatum[];
  height?: number;
  /** Minimum width per band; chart scrolls horizontally when needed. */
  minBarWidth?: number;
  maxBarWidth?: number;
  showTick?: (d: BarChartDatum, index: number) => boolean;
  ariaLabel?: string;
  barColor?: string;
  barHoverColor?: string;
}

const margin = { top: 8, right: 8, bottom: 28, left: 40 };

export default function BarChart({
  data,
  height = 220,
  minBarWidth = 10,
  maxBarWidth = 28,
  showTick,
  ariaLabel = 'Bar chart',
  barColor = chartColors.bar,
  barHoverColor = chartColors.barHover,
}: BarChartProps) {
  const [hoverKey, setHoverKey] = useState<string | null>(null);

  const dataMax = Math.max(...data.map((d) => d.value), 1);
  const ticks = useMemo(() => niceTicks(dataMax), [dataMax]);
  const axisMax = ticks[ticks.length - 1] || dataMax;

  const innerHeight = height - margin.top - margin.bottom;
  const plotWidth = Math.max(data.length * minBarWidth, 240);
  const innerWidth = plotWidth - margin.right;

  const xScale = useMemo(
    () =>
      scaleBand<string>({
        domain: data.map((d) => d.key),
        range: [0, innerWidth],
        paddingInner: 0.15,
        paddingOuter: 0.05,
      }),
    [data, innerWidth],
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

  const bandWidth = xScale.bandwidth();
  const barWidth = Math.min(bandWidth, maxBarWidth);
  const hovered = hoverKey ? data.find((d) => d.key === hoverKey) : null;

  const tickShouldShow = (d: BarChartDatum, i: number) =>
    showTick ? showTick(d, i) : true;

  if (data.length === 0) return null;

  return (
    <div className="space-y-1">
      <div className="flex items-center text-xs font-semibold text-neutral min-h-4">
        {hovered && (
          <span className="ml-auto tabular-nums text-primary">
            {hovered.label} · {hovered.valueLabel ?? formatAxisCount(hovered.value)}
          </span>
        )}
      </div>

      <div className="flex">
        {/* Sticky Y-axis */}
        <svg width={margin.left} height={height} className="shrink-0 overflow-visible" aria-hidden>
          <AxisLeft
            left={margin.left - 4}
            top={margin.top}
            scale={yScale}
            tickValues={ticks}
            tickFormat={(v) => formatAxisCount(v as number)}
            stroke={chartColors.zero}
            tickStroke="transparent"
            tickLabelProps={() => ({
              fill: chartColors.axis,
              fontSize: 10,
              textAnchor: 'end',
              dx: -2,
              dy: '0.35em',
              fontFamily: 'inherit',
            })}
            hideAxisLine
            hideTicks
          />
        </svg>

        <div className="min-w-0 flex-1 overflow-x-auto">
          <svg
            width={plotWidth}
            height={height}
            role="img"
            aria-label={ariaLabel}
            onMouseLeave={() => setHoverKey(null)}
          >
            <Group top={margin.top} left={0}>
              <GridRows
                scale={yScale}
                width={innerWidth}
                tickValues={ticks}
                stroke={chartColors.grid}
                strokeOpacity={0.9}
                pointerEvents="none"
              />
              {data.map((d) => {
                const x = (xScale(d.key) ?? 0) + (bandWidth - barWidth) / 2;
                const barH = Math.max(d.value > 0 ? 2 : 0, innerHeight - (yScale(d.value) ?? 0));
                const y = innerHeight - barH;
                const active = hoverKey === d.key;
                return (
                  <Bar
                    key={d.key}
                    x={x}
                    y={y}
                    width={barWidth}
                    height={barH}
                    fill={active ? barHoverColor : barColor}
                    rx={2}
                    onMouseEnter={() => setHoverKey(d.key)}
                  />
                );
              })}
              <AxisBottom
                top={innerHeight}
                scale={xScale}
                stroke={chartColors.zero}
                tickStroke="transparent"
                tickValues={data.filter((d, i) => tickShouldShow(d, i)).map((d) => d.key)}
                tickFormat={(key) => data.find((d) => d.key === key)?.shortLabel ?? String(key)}
                tickLabelProps={() => ({
                  fill: chartColors.axis,
                  fontSize: 9,
                  textAnchor: 'middle',
                  dy: '0.25em',
                  fontFamily: 'inherit',
                })}
                hideAxisLine={false}
                hideTicks
              />
            </Group>
          </svg>
        </div>
      </div>
    </div>
  );
}

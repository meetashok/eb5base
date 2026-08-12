'use client';

import { AxisBottom, AxisLeft } from '@visx/axis';
import { GridRows } from '@visx/grid';
import { Group } from '@visx/group';
import { scaleBand, scaleLinear } from '@visx/scale';
import { Bar } from '@visx/shape';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  chartColors,
  formatAxisCount,
  formatSignedCount,
  niceSignedTicks,
} from '@/lib/charts/theme';

export interface DiffBarDatum {
  key: string;
  label: string;
  shortLabel: string;
  /** Signed change (later − earlier). */
  value: number;
  valueLabel?: string;
}

export interface DiffBarChartProps {
  data: DiffBarDatum[];
  height?: number;
  minBarWidth?: number;
  showTick?: (d: DiffBarDatum, index: number) => boolean;
  ariaLabel?: string;
  /** Caption under the plot clarifying what the X axis measures. */
  xAxisLabel?: string;
  upColor?: string;
  downColor?: string;
  hoverColor?: string;
}

const margin = { top: 8, right: 8, bottom: 28, left: 44 };

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

export default function DiffBarChart({
  data,
  height = 240,
  minBarWidth = 10,
  showTick,
  ariaLabel = 'Change bar chart',
  xAxisLabel,
  upColor = chartColors.barUp,
  downColor = chartColors.barDown,
  hoverColor = chartColors.barHover,
}: DiffBarChartProps) {
  const [hoverKey, setHoverKey] = useState<string | null>(null);
  const { ref, width } = useElementWidth<HTMLDivElement>();

  const dataMin = Math.min(0, ...data.map((d) => d.value));
  const dataMax = Math.max(0, ...data.map((d) => d.value));
  const { ticks, domain } = useMemo(
    () => niceSignedTicks(dataMin, dataMax),
    [dataMin, dataMax],
  );

  const innerHeight = height - margin.top - margin.bottom;
  const availablePlotWidth = Math.max(width - margin.left, 0);
  const neededPlotWidth = data.length * minBarWidth;
  const plotWidth = Math.max(availablePlotWidth, neededPlotWidth, 1);
  const innerWidth = Math.max(plotWidth - margin.right, 0);

  const xScale = useMemo(
    () =>
      scaleBand<string>({
        domain: data.map((d) => d.key),
        range: [0, innerWidth],
        paddingInner: data.length <= 12 ? 0.28 : 0.15,
        paddingOuter: 0.05,
      }),
    [data, innerWidth],
  );

  const yScale = useMemo(
    () =>
      scaleLinear<number>({
        domain,
        range: [innerHeight, 0],
        nice: false,
      }),
    [domain, innerHeight],
  );

  const zeroY = yScale(0) ?? innerHeight / 2;
  const bandWidth = xScale.bandwidth();
  const hovered = hoverKey ? data.find((d) => d.key === hoverKey) : null;
  const tickShouldShow = (d: DiffBarDatum, i: number) =>
    showTick ? showTick(d, i) : true;

  if (data.length === 0) return null;
  const ready = width >= 10;

  return (
    <div className="space-y-1 w-full">
      <div className="flex items-center text-xs font-semibold text-neutral min-h-4">
        {hovered && (
          <span className="ml-auto tabular-nums text-primary">
            {hovered.label} ·{' '}
            {hovered.valueLabel ?? formatSignedCount(hovered.value)}
          </span>
        )}
      </div>

      <div ref={ref} className="w-full">
        {!ready ? (
          <div style={{ height }} aria-hidden />
        ) : (
          <div className="flex w-full">
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
                  <line
                    x1={0}
                    x2={innerWidth}
                    y1={zeroY}
                    y2={zeroY}
                    stroke={chartColors.zero}
                    strokeWidth={1.25}
                    pointerEvents="none"
                  />
                  {data.map((d) => {
                    const x = xScale(d.key) ?? 0;
                    const yVal = yScale(d.value) ?? zeroY;
                    const y = d.value >= 0 ? yVal : zeroY;
                    const barH = Math.max(d.value !== 0 ? 2 : 0, Math.abs(zeroY - yVal));
                    const active = hoverKey === d.key;
                    const fill =
                      active ? hoverColor : d.value >= 0 ? upColor : downColor;
                    return (
                      <Bar
                        key={d.key}
                        x={x}
                        y={y}
                        width={bandWidth}
                        height={barH}
                        fill={fill}
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
                    tickFormat={(key) =>
                      data.find((d) => d.key === key)?.shortLabel ?? String(key)
                    }
                    tickLabelProps={(value) => ({
                      fill: chartColors.axis,
                      fontSize: 9,
                      textAnchor: value === '_earlier' ? 'start' : 'middle',
                      dx: value === '_earlier' ? 2 : 0,
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
        )}
      </div>
      {xAxisLabel ? (
        <p
          className="text-center text-[11px] font-medium text-neutral/50"
          style={{ paddingLeft: margin.left }}
        >
          {xAxisLabel}
        </p>
      ) : null}
    </div>
  );
}

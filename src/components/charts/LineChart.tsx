'use client';

import { AxisBottom, AxisLeft } from '@visx/axis';
import { curveMonotoneX } from '@visx/curve';
import { localPoint } from '@visx/event';
import { GridRows } from '@visx/grid';
import { Group } from '@visx/group';
import { scaleLinear, scalePoint } from '@visx/scale';
import { LinePath } from '@visx/shape';
import { ParentSize } from '@visx/responsive';
import { useMemo, useState } from 'react';
import { chartColors, formatAxisCount, niceTicks } from '@/lib/charts/theme';
import ChartXAxisLabel from '@/components/charts/ChartXAxisLabel';

export interface LineChartDatum {
  key: string;
  label: string;
  value: number;
  valueLabel?: string;
}

export interface LineChartProps {
  data: LineChartDatum[];
  height?: number;
  ariaLabel?: string;
  /** Caption under the plot clarifying what the X axis measures. */
  xAxisLabel?: string;
  /** Prefixed before the hovered X label, e.g. "Snapshot date". */
  hoverLabelPrefix?: string;
  lineColor?: string;
  pointColor?: string;
  pointHoverColor?: string;
  /**
   * Force a shared Y max (e.g. across facet charts). When omitted, the max
   * is inferred from this chart's data alone.
   */
  yMax?: number;
}

const margin = { top: 12, right: 12, bottom: 28, left: 40 };

function LineChartInner({
  data,
  width,
  height,
  ariaLabel,
  hoverLabelPrefix,
  lineColor,
  pointColor,
  pointHoverColor,
  yMax: yMaxProp,
}: LineChartProps & { width: number; height: number }) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const dataMax = Math.max(1, yMaxProp ?? Math.max(...data.map((d) => d.value), 1));
  const ticks = useMemo(() => niceTicks(dataMax), [dataMax]);
  const axisMax = ticks[ticks.length - 1] || dataMax;

  const innerWidth = Math.max(width - margin.left - margin.right, 0);
  const innerHeight = height - margin.top - margin.bottom;

  const xScale = useMemo(
    () =>
      scalePoint<string>({
        domain: data.map((d) => d.key),
        range: [0, innerWidth],
        padding: 0.5,
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

  const hovered = hoverIdx != null ? data[hoverIdx] : null;

  // Sparse bottom ticks: first, middle, last
  const xTickKeys = useMemo(() => {
    if (data.length <= 3) return data.map((d) => d.key);
    return [data[0].key, data[Math.floor(data.length / 2)].key, data[data.length - 1].key];
  }, [data]);

  if (width < 10 || data.length === 0) return null;

  return (
    <div className="space-y-1 w-full">
      <div className="flex items-center text-xs font-semibold text-neutral min-h-4">
        {hovered && (
          <span className="ml-auto tabular-nums text-primary">
            {hoverLabelPrefix ? `${hoverLabelPrefix} ${hovered.label}` : hovered.label}
            {' · '}
            {hovered.valueLabel ?? formatAxisCount(hovered.value)} pending
          </span>
        )}
      </div>
      <svg
        width={width}
        height={height}
        role="img"
        aria-label={ariaLabel}
        onMouseLeave={() => setHoverIdx(null)}
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
            tickFormat={(key) => data.find((d) => d.key === key)?.label ?? String(key)}
            stroke={chartColors.zero}
            tickStroke="transparent"
            tickLabelProps={() => ({
              fill: chartColors.axis,
              fontSize: 10,
              textAnchor: 'middle',
              dy: '0.25em',
              fontFamily: 'inherit',
            })}
            hideTicks
          />
          <LinePath
            data={data}
            x={(d) => xScale(d.key) ?? 0}
            y={(d) => yScale(d.value) ?? 0}
            curve={curveMonotoneX}
            stroke={lineColor}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Invisible wider hit targets */}
          {data.map((d, i) => {
            const cx = xScale(d.key) ?? 0;
            const cy = yScale(d.value) ?? 0;
            const active = hoverIdx === i;
            return (
              <g key={d.key}>
                <circle
                  cx={cx}
                  cy={cy}
                  r={14}
                  fill="transparent"
                  onMouseEnter={() => setHoverIdx(i)}
                  onMouseMove={(event) => {
                    const point = localPoint(event);
                    if (point) setHoverIdx(i);
                  }}
                />
                <circle
                  cx={cx}
                  cy={cy}
                  r={active ? 5 : 3.5}
                  fill={active ? pointHoverColor : pointColor}
                  stroke="#faf7f2"
                  strokeWidth={2}
                  pointerEvents="none"
                />
              </g>
            );
          })}
        </Group>
      </svg>
    </div>
  );
}

export default function LineChart({
  data,
  height = 220,
  ariaLabel = 'Line chart',
  xAxisLabel,
  hoverLabelPrefix,
  lineColor = chartColors.line,
  pointColor = chartColors.point,
  pointHoverColor = chartColors.pointHover,
  yMax,
}: LineChartProps) {
  return (
    <div className="w-full space-y-1">
      <div style={{ width: '100%', height }}>
        <ParentSize debounceTime={10}>
          {({ width }) => (
            <LineChartInner
              data={data}
              width={width}
              height={height}
              ariaLabel={ariaLabel}
              hoverLabelPrefix={hoverLabelPrefix}
              lineColor={lineColor}
              pointColor={pointColor}
              pointHoverColor={pointHoverColor}
              yMax={yMax}
            />
          )}
        </ParentSize>
      </div>
      {xAxisLabel ? <ChartXAxisLabel label={xAxisLabel} paddingLeft={margin.left} /> : null}
    </div>
  );
}

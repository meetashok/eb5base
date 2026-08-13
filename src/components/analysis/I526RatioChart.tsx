'use client';

import { AxisBottom, AxisLeft } from '@visx/axis';
import { curveMonotoneX } from '@visx/curve';
import { GridRows } from '@visx/grid';
import { Group } from '@visx/group';
import { scaleLinear, scalePoint } from '@visx/scale';
import { LinePath } from '@visx/shape';
import { useEffect, useMemo, useRef, useState } from 'react';
import { chartColors, niceTicks } from '@/lib/charts/theme';
import ChartXAxisLabel from '@/components/charts/ChartXAxisLabel';
import type { TimeBucketMeta } from '@/lib/analysis/i526';

export interface RatioChartSeries {
  key: string;
  label: string;
  color: string;
  /** Dashed + lighter (used for the noisier per-period line). */
  muted?: boolean;
  /** One value per xAxis entry; null renders a gap. */
  data: (number | null)[];
}

export interface I526RatioChartProps {
  xAxis: TimeBucketMeta[];
  series: RatioChartSeries[];
  /** Horizontal reference line (e.g. 2 = quota-balanced). */
  referenceValue?: number;
  referenceLabel?: string;
  height?: number;
  ariaLabel?: string;
  xAxisLabel?: string;
}

const margin = { top: 12, right: 16, bottom: 40, left: 40 };

function fmtRatio(n: number): string {
  return n >= 10 ? n.toFixed(0) : n.toFixed(1);
}

function useElementWidth<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    setWidth(el.clientWidth);
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) setWidth(entry.contentRect.width);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return { ref, width };
}

export default function I526RatioChart({
  xAxis,
  series,
  referenceValue,
  referenceLabel,
  height = 260,
  ariaLabel = 'Ratio chart',
  xAxisLabel,
}: I526RatioChartProps) {
  const { ref, width } = useElementWidth<HTMLDivElement>();
  const [hoverKey, setHoverKey] = useState<string | null>(null);

  const dataMax = useMemo(() => {
    const vals = series.flatMap((s) =>
      s.data.filter((v): v is number => v != null),
    );
    if (referenceValue != null) vals.push(referenceValue);
    return Math.max(1, ...vals);
  }, [series, referenceValue]);

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
    () => scaleLinear<number>({ domain: [0, axisMax], range: [innerHeight, 0], nice: false }),
    [axisMax, innerHeight],
  );

  const xTickKeys = useMemo(() => {
    if (xAxis.length <= 3) return xAxis.map((d) => d.key);
    const step = Math.max(1, Math.ceil(xAxis.length / 8));
    return xAxis.filter((_d, i) => i % step === 0 || i === xAxis.length - 1).map((d) => d.key);
  }, [xAxis]);

  const hoverMeta = hoverKey ? xAxis.find((d) => d.key === hoverKey) : null;
  const hoverIdx = hoverKey ? xAxis.findIndex((d) => d.key === hoverKey) : -1;

  const ready = width >= 10 && xAxis.length > 0 && series.length > 0;

  return (
    <div className="w-full space-y-2" onMouseLeave={() => setHoverKey(null)}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
        {series.map((s) => (
          <span key={s.key} className="inline-flex items-center gap-1.5 text-neutral/80">
            <span
              className="inline-block w-4"
              style={{ borderTop: `2px ${s.muted ? 'dashed' : 'solid'} ${s.color}` }}
              aria-hidden
            />
            {s.label}
          </span>
        ))}
        {referenceValue != null ? (
          <span className="inline-flex items-center gap-1.5 text-neutral/55">
            <span
              className="inline-block w-4"
              style={{ borderTop: `1px dashed ${chartColors.axis}` }}
              aria-hidden
            />
            {referenceLabel ?? `Balanced (${fmtRatio(referenceValue)})`}
          </span>
        ) : null}
      </div>

      <div className="relative w-full pt-12">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 z-10 h-11 overflow-hidden text-xs font-semibold text-neutral"
          aria-live="polite"
        >
          {hoverMeta ? (
            <div className="ml-auto max-w-full space-y-0.5 text-right">
              <div className="truncate font-medium text-neutral/55">{hoverMeta.label}</div>
              <div className="flex flex-wrap justify-end gap-x-3 gap-y-0.5 tabular-nums text-primary">
                {series.map((s) => {
                  const v = hoverIdx >= 0 ? s.data[hoverIdx] : null;
                  if (v == null) return null;
                  return (
                    <span key={s.key} className="inline-flex items-center gap-1">
                      <span
                        className="inline-block h-1.5 w-1.5 rounded-full"
                        style={{ backgroundColor: s.color }}
                        aria-hidden
                      />
                      <span className="font-medium text-neutral/55">{s.label}</span> {fmtRatio(v)}
                    </span>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>

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
                  tickFormat={(v) => fmtRatio(v as number)}
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

                {referenceValue != null && referenceValue <= axisMax ? (
                  <line
                    x1={0}
                    x2={innerWidth}
                    y1={yScale(referenceValue)}
                    y2={yScale(referenceValue)}
                    stroke={chartColors.axis}
                    strokeWidth={1}
                    strokeDasharray="4 4"
                    strokeOpacity={0.7}
                    pointerEvents="none"
                  />
                ) : null}

                {series.map((s) => {
                  const pts = xAxis.map((x, i) => ({ key: x.key, value: s.data[i] ?? null }));
                  return (
                    <LinePath
                      key={s.key}
                      data={pts}
                      x={(d) => xScale(d.key) ?? 0}
                      y={(d) => yScale(d.value ?? 0) ?? 0}
                      defined={(d) => d.value != null}
                      curve={curveMonotoneX}
                      stroke={s.color}
                      strokeWidth={s.muted ? 1.5 : 2.25}
                      strokeOpacity={s.muted ? 0.55 : 1}
                      strokeDasharray={s.muted ? '4 3' : undefined}
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
                        onMouseEnter={() => setHoverKey(meta.key)}
                        onMouseMove={() => setHoverKey(meta.key)}
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
                        ? series.map((s) => {
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

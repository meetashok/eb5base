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
  /** Force the Y-axis ceiling (keeps the reference line in view past spikes). */
  yMax?: number;
  height?: number;
  ariaLabel?: string;
  xAxisLabel?: string;
}

const margin = { top: 12, right: 16, bottom: 40, left: 40 };
/** Rose is reserved for annotations (never a data series color). */
const REFERENCE_COLOR = '#be123c';

function fmtRatio(n: number): string {
  return n >= 10 ? n.toFixed(0) : n.toFixed(1);
}

/** Nice tick values (0.5 steps for typical ratios) from 0 up to `peak`. */
function ratioTickValues(peak: number): number[] {
  const steps = [0.25, 0.5, 1, 2, 5];
  const maxTicks = 6;
  let step = steps[steps.length - 1]!;
  for (const s of steps) {
    if (peak / s <= maxTicks) {
      step = s;
      break;
    }
  }
  const ticks: number[] = [];
  for (let v = 0; v <= peak + 1e-9; v += step) {
    ticks.push(Math.round(v * 100) / 100);
  }
  return ticks;
}

export default function I526RatioChart({
  xAxis,
  series,
  referenceValue,
  referenceLabel,
  yMax,
  height = 260,
  ariaLabel = 'Ratio chart',
  xAxisLabel,
}: I526RatioChartProps) {
  const { ref, width } = useElementWidth<HTMLDivElement>();
  const [hoverKey, setHoverKey] = useState<string | null>(null);
  const { hiddenKeys, focusKey, setFocusKey, toggleSeries, emphasis } = useSeriesLegend(
    series.map((s) => s.key),
  );

  const visible = useMemo(
    () => series.filter((s) => !hiddenKeys.has(s.key)),
    [series, hiddenKeys],
  );
  const drawOrder = useMemo(() => {
    if (!focusKey) return visible;
    return [...visible].sort((a, b) => (a.key === focusKey ? 1 : b.key === focusKey ? -1 : 0));
  }, [visible, focusKey]);

  const peak = useMemo(() => {
    const base =
      yMax != null
        ? yMax
        : Math.max(0, ...visible.flatMap((s) => s.data.filter((v): v is number => v != null)));
    return Math.max(base, referenceValue ?? 0, 1);
  }, [visible, referenceValue, yMax]);

  const ticks = useMemo(() => ratioTickValues(peak), [peak]);
  // Snug ceiling: just above the highest line / the reference, not rounded up.
  const axisMax = peak + 0.1;

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

  const hoverRows: HoverRow[] = hoverMeta
    ? (visible
        .map((s) => {
          const v = hoverIdx >= 0 ? s.data[hoverIdx] : null;
          if (v == null) return null;
          return { key: s.key, color: s.color, label: s.label, value: fmtRatio(v) };
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
        ariaLabel="Toggle ratio series"
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
                  <g pointerEvents="none">
                    <line
                      x1={0}
                      x2={innerWidth}
                      y1={yScale(referenceValue)}
                      y2={yScale(referenceValue)}
                      stroke={REFERENCE_COLOR}
                      strokeWidth={1.5}
                      strokeDasharray="5 4"
                      strokeOpacity={0.9}
                    />
                    <text
                      x={2}
                      y={yScale(referenceValue) - 4}
                      textAnchor="start"
                      fontSize={10}
                      fontWeight={600}
                      fill={REFERENCE_COLOR}
                    >
                      {referenceLabel ?? `Balanced (${fmtRatio(referenceValue)})`}
                    </text>
                  </g>
                ) : null}

                {drawOrder.map((s) => {
                  const pts = xAxis.map((x, i) => ({ key: x.key, value: s.data[i] ?? null }));
                  const { strokeWidth, opacity } = emphasis(s.key);
                  return (
                    <LinePath
                      key={s.key}
                      data={pts}
                      x={(d) => xScale(d.key) ?? 0}
                      y={(d) => yScale(Math.min(d.value ?? 0, axisMax)) ?? 0}
                      defined={(d) => d.value != null}
                      curve={curveMonotoneX}
                      stroke={s.color}
                      strokeWidth={s.muted ? 1.5 : strokeWidth}
                      strokeOpacity={s.muted ? 0.55 : opacity}
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
                        ? visible.map((s) => {
                            const v = s.data[i];
                            if (v == null) return null;
                            return (
                              <circle
                                key={s.key}
                                cx={cx}
                                cy={yScale(Math.min(v, axisMax)) ?? 0}
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

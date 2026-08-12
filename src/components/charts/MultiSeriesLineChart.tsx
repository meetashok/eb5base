'use client';

import { AxisBottom, AxisLeft } from '@visx/axis';
import { curveMonotoneX } from '@visx/curve';
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
import ChartXAxisLabel from '@/components/charts/ChartXAxisLabel';

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
  /** Caption under the plot clarifying what the X axis measures. */
  xAxisLabel?: string;
  /** Prefixed before the hovered X label, e.g. "Snapshot date". */
  hoverLabelPrefix?: string;
  showTick?: (d: MultiSeriesXMeta, index: number) => boolean;
  /**
   * Controlled hidden series keys (for syncing legends across facet charts).
   * When set with `onToggleSeries`, visibility is owned by the parent.
   */
  hiddenKeys?: ReadonlySet<string>;
  onToggleSeries?: (key: string) => void;
  /** Controlled legend-hover focus (sync highlight across facet charts). */
  legendFocusKey?: string | null;
  onLegendFocusChange?: (key: string | null) => void;
  /** Stable colors by series key (keeps India/China facets aligned). */
  seriesColors?: Record<string, string>;
  /** When false, hide the legend row (parent may render a shared one). */
  showLegend?: boolean;
  /**
   * Force a shared Y max (e.g. across facet charts). When omitted, the max
   * is inferred from visible series in this chart alone.
   */
  yMax?: number;
}

const margin = { top: 12, right: 12, bottom: 40, left: 40 };
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
  xAxisLabel,
  hoverLabelPrefix,
  showTick,
  hiddenKeys: hiddenKeysProp,
  onToggleSeries,
  legendFocusKey: legendFocusKeyProp,
  onLegendFocusChange,
  seriesColors,
  showLegend = true,
  yMax: yMaxProp,
}: MultiSeriesLineChartProps) {
  const { ref, width } = useElementWidth<HTMLDivElement>();
  const [hoverKey, setHoverKey] = useState<string | null>(null);
  const [internalLegendFocusKey, setInternalLegendFocusKey] = useState<string | null>(null);
  const [internalHiddenKeys, setInternalHiddenKeys] = useState<Set<string>>(() => new Set());

  const controlledHidden = hiddenKeysProp != null && onToggleSeries != null;
  const controlledFocus = onLegendFocusChange != null;
  const hiddenKeys = controlledHidden ? hiddenKeysProp! : internalHiddenKeys;
  const legendFocusKey = controlledFocus
    ? (legendFocusKeyProp ?? null)
    : internalLegendFocusKey;

  const seriesKeySig = series.map((s) => s.key).join('|');
  useEffect(() => {
    if (!controlledHidden) setInternalHiddenKeys(new Set());
    if (!controlledFocus) setInternalLegendFocusKey(null);
  }, [seriesKeySig, controlledHidden, controlledFocus]);

  const colored = useMemo(
    () =>
      series.map((s, i) => ({
        ...s,
        color: seriesColors?.[s.key] ?? s.color ?? seriesColor(i),
      })),
    [series, seriesColors],
  );

  const visible = useMemo(
    () => colored.filter((s) => !hiddenKeys.has(s.key)),
    [colored, hiddenKeys],
  );

  /** Draw focused series last so it sits on top of dimmed lines. */
  const visibleDrawOrder = useMemo(() => {
    if (!legendFocusKey) return visible;
    return [...visible].sort((a, b) => {
      if (a.key === legendFocusKey) return 1;
      if (b.key === legendFocusKey) return -1;
      return 0;
    });
  }, [visible, legendFocusKey]);

  function setLegendFocus(key: string | null) {
    if (controlledFocus) onLegendFocusChange!(key);
    else setInternalLegendFocusKey(key);
  }

  function toggleSeries(key: string) {
    if (controlledHidden) {
      onToggleSeries!(key);
      return;
    }
    setInternalHiddenKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
        return next;
      }
      // Keep at least one series visible.
      if (colored.length - next.size <= 1) return prev;
      next.add(key);
      return next;
    });
  }

  function seriesEmphasis(key: string): { strokeWidth: number; opacity: number } {
    if (!legendFocusKey) return { strokeWidth: 2, opacity: 1 };
    if (legendFocusKey === key) return { strokeWidth: 3.25, opacity: 1 };
    return { strokeWidth: 1.5, opacity: 0.22 };
  }

  const dataMax =
    yMaxProp != null
      ? Math.max(1, yMaxProp)
      : Math.max(1, ...visible.flatMap((s) => s.data.map((d) => d.value)));
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
    ? visible.flatMap((s) => {
        const pt = s.data.find((d) => d.key === hoverKey);
        if (!pt) return [];
        return [
          {
            key: s.key,
            label: s.label,
            color: s.color,
            value: pt.value,
          },
        ];
      })
    : [];

  const ready = width >= 10 && xAxis.length > 0 && colored.length > 0;

  return (
    <div className="w-full space-y-2" onMouseLeave={() => setHoverKey(null)}>
      {showLegend ? (
        <div
          className="flex min-h-4 flex-wrap items-center gap-x-1.5 gap-y-1 text-xs"
          role="group"
          aria-label="Toggle series"
          onMouseLeave={() => setLegendFocus(null)}
        >
          {colored.map((s) => {
            const on = !hiddenKeys.has(s.key);
            const focused = legendFocusKey === s.key;
            return (
              <button
                key={s.key}
                type="button"
                className={`inline-flex items-center gap-1.5 rounded-md px-1.5 py-0.5 transition-opacity focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary ${
                  on
                    ? focused
                      ? 'bg-base-200 text-primary'
                      : 'text-neutral/80'
                    : 'text-neutral/35'
                }`}
                aria-pressed={on}
                title={on ? `Hide ${s.label}` : `Show ${s.label}`}
                onClick={() => {
                  toggleSeries(s.key);
                  setLegendFocus(null);
                }}
                onMouseEnter={() => {
                  if (on) setLegendFocus(s.key);
                }}
                onFocus={() => {
                  if (on) setLegendFocus(s.key);
                }}
                onBlur={() => {
                  if (legendFocusKey === s.key) setLegendFocus(null);
                }}
              >
                <span
                  className="inline-block w-3 rounded-full"
                  style={{
                    backgroundColor: on ? s.color : '#c4bdb2',
                    height: focused ? 3 : 2,
                  }}
                  aria-hidden
                />
                <span className={on ? undefined : 'line-through'}>{s.label}</span>
              </button>
            );
          })}
        </div>
      ) : null}

      {/*
        Reserve top padding for the hover readout; render it absolutely so
        appearing/disappearing values never change layout height.
      */}
      <div className="relative w-full pt-12">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 z-10 h-11 overflow-hidden text-xs font-semibold text-neutral"
          aria-live="polite"
        >
          {hoverMeta ? (
            <div className="ml-auto max-w-full space-y-0.5 text-right">
              <div className="truncate font-medium text-neutral/55">
                {hoverLabelPrefix
                  ? `${hoverLabelPrefix} ${hoverMeta.label}`
                  : hoverMeta.label}
              </div>
              <div className="flex flex-wrap justify-end gap-x-3 gap-y-0.5 font-semibold tabular-nums text-primary">
                {hoverValues.map((v) => (
                  <span key={v.key} className="inline-flex items-center gap-1">
                    <span
                      className="inline-block h-1.5 w-1.5 rounded-full"
                      style={{ backgroundColor: v.color }}
                      aria-hidden
                    />
                    <span className="font-medium text-neutral/55">{v.label}</span>{' '}
                    {nf.format(v.value)}
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
                    fontSize: 10,
                    textAnchor: value === '_earlier' ? 'start' : 'middle',
                    dx: value === '_earlier' ? 2 : 0,
                    dy: '0.4em',
                    fontFamily: 'inherit',
                  })}
                  hideTicks
                />

                {visibleDrawOrder.map((s) => {
                  const { strokeWidth, opacity } = seriesEmphasis(s.key);
                  return (
                    <LinePath
                      key={s.key}
                      data={s.data}
                      x={(d) => xScale(d.key) ?? 0}
                      y={(d) => yScale(d.value) ?? 0}
                      curve={curveMonotoneX}
                      stroke={s.color}
                      strokeWidth={strokeWidth}
                      strokeOpacity={opacity}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  );
                })}

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
                        onMouseMove={() => setHoverKey(meta.key)}
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
                      {visibleDrawOrder.map((s) => {
                        const pt = s.data.find((d) => d.key === meta.key);
                        if (!pt) return null;
                        const cy = yScale(pt.value) ?? 0;
                        const { opacity } = seriesEmphasis(s.key);
                        const focused = legendFocusKey === s.key;
                        return (
                          <circle
                            key={`${s.key}-${meta.key}`}
                            cx={cx}
                            cy={cy}
                            r={active || focused ? 4.5 : 2.5}
                            fill={s.color}
                            stroke="#faf7f2"
                            strokeWidth={active || focused ? 2 : 1}
                            opacity={opacity}
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
      {xAxisLabel ? <ChartXAxisLabel label={xAxisLabel} paddingLeft={margin.left} /> : null}
    </div>
  );
}

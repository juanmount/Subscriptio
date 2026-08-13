import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop, Circle, Rect } from 'react-native-svg';

export type SparkPoint = {
  label: string;
  value: number;
};

type SparkChartProps = {
  data: SparkPoint[];
  width?: number;
  height?: number;
  gradientColors?: [string, string];
  highlightIndex?: number;
  formatValue?: (value: number) => string;
  onIndexChange?: (index: number) => void;
};

export function SparkChart({
  data,
  width = 280,
  height = 110,
  gradientColors = ['#9B7BFF', '#7B5EE0'],
  highlightIndex,
  formatValue = (v) => `$${(v / 100).toFixed(2)}`,
  onIndexChange,
}: SparkChartProps) {
  const [tappedIndex, setTappedIndex] = useState<number | null>(null);

  const activeIndex = tappedIndex ?? highlightIndex;

  const handleTouch = useCallback(
    (evt: { locationX: number }) => {
      if (data.length === 0) return;
      const padX = 8;
      const chartW = width - padX * 2;
      const step = chartW / (data.length - 1 || 1);
      const relX = evt.locationX - padX;
      const idx = Math.round(relX / step);
      const clamped = Math.max(0, Math.min(data.length - 1, idx));
      setTappedIndex(clamped);
      onIndexChange?.(clamped);
    },
    [data.length, width, onIndexChange],
  );

  if (data.length === 0) return null;

  const padX = 8;
  const padTop = 48;
  const padBottom = 20;
  const chartW = width - padX * 2;
  const chartH = height - padTop - padBottom;

  const values = data.map((d) => d.value);
  const maxVal = Math.max(...values, 1);
  const minVal = Math.min(...values, 0);
  const range = maxVal - minVal || 1;

  const points = data.map((d, i) => {
    const x = padX + (chartW / (data.length - 1 || 1)) * i;
    const y = padTop + chartH - ((d.value - minVal) / range) * chartH;
    return { x, y, ...d };
  });

  // Smooth curve path
  const linePath = points.reduce((acc, p, i) => {
    if (i === 0) return `M ${p.x} ${p.y}`;
    const prev = points[i - 1];
    const cx = (prev.x + p.x) / 2;
    return `${acc} Q ${cx} ${prev.y} ${cx} ${(prev.y + p.y) / 2} T ${p.x} ${p.y}`;
  }, '');

  // Area path (close to bottom)
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${padTop + chartH} L ${points[0].x} ${padTop + chartH} Z`;

  const activePoint = activeIndex !== undefined && activeIndex < points.length ? points[activeIndex] : null;

  // Tooltip positioning — keep within bounds
  const tooltipW = 70;
  let tooltipX = activePoint ? activePoint.x - tooltipW / 2 : 0;
  tooltipX = Math.max(2, Math.min(width - tooltipW - 2, tooltipX));
  const tooltipY = activePoint ? Math.max(2, activePoint.y - 48) : 0;

  return (
    <View style={[{ width, height }, styles.container]}>
      <TouchableOpacity
        style={styles.touchArea as ViewStyle}
        activeOpacity={1}
        onPressIn={(e) => handleTouch({ locationX: e.nativeEvent.locationX })}
      >
        <Svg width={width} height={height}>
          <Defs>
            <LinearGradient id="spark-area" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={gradientColors[0]} stopOpacity="0.25" />
              <Stop offset="1" stopColor={gradientColors[1]} stopOpacity="0.02" />
            </LinearGradient>
            <LinearGradient id="spark-line" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor={gradientColors[0]} />
              <Stop offset="1" stopColor={gradientColors[1]} />
            </LinearGradient>
          </Defs>

          {/* Area fill */}
          <Path d={areaPath} fill="url(#spark-area)" />

          {/* Line */}
          <Path
            d={linePath}
            fill="none"
            stroke="url(#spark-line)"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Active point */}
          {activePoint && (
            <>
              {/* Vertical guide line */}
              <Rect
                x={activePoint.x - 0.5}
                y={padTop}
                width={1}
                height={chartH}
                fill={gradientColors[1]}
                opacity={0.2}
              />
              <Circle
                cx={activePoint.x}
                cy={activePoint.y}
                r={6}
                fill={gradientColors[1]}
              />
              <Circle
                cx={activePoint.x}
                cy={activePoint.y}
                r={3}
                fill="#FFFFFF"
              />
            </>
          )}
        </Svg>

        {/* Tooltip */}
        {activePoint && (
          <View style={[styles.tooltip, { left: tooltipX, top: tooltipY, width: tooltipW }]}>
            <Text style={styles.tooltipMonth}>{activePoint.label}</Text>
            <Text style={styles.tooltipValue}>{formatValue(activePoint.value)}</Text>
          </View>
        )}

        {/* Month labels */}
        <View style={styles.labelsRow}>
          {data.map((d, i) => (
            <Text
              key={i}
              style={[
                styles.label,
                i === activeIndex && styles.labelActive,
                i === 0 && styles.labelFirst,
                i === data.length - 1 && styles.labelLast,
              ]}
            >
              {d.label}
            </Text>
          ))}
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { justifyContent: 'center' },
  touchArea: { width: '100%', height: '100%' },
  tooltip: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignItems: 'center',
    shadowColor: '#7B5EE0',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  tooltipMonth: { fontSize: 9, fontWeight: '600', color: '#B8B4C8', textTransform: 'uppercase' },
  tooltipValue: { fontSize: 13, fontWeight: '700', color: '#7B5EE0', marginTop: 1 },
  labelsRow: {
    position: 'absolute',
    bottom: 0,
    left: 8,
    right: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  label: { fontSize: 9, fontWeight: '600', color: '#B8B4C8', textAlign: 'center' },
  labelActive: { color: '#7B5EE0', fontWeight: '700' },
  labelFirst: { textAlign: 'left' },
  labelLast: { textAlign: 'right' },
});

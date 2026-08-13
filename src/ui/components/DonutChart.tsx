import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, G, Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Colors } from '@/ui/theme';

export type DonutSegment = {
  label: string;
  value: number;
  colors: [string, string];
};

type DonutChartProps = {
  segments: DonutSegment[];
  size?: number;
  strokeWidth?: number;
  centerLabel?: string;
  centerValue?: string;
  centerSubLabel?: string;
  centerValueSize?: number;
  trackColor?: string;
  selectedIndex?: number | null;
  onSegmentPress?: (index: number) => void;
};

export function DonutChart({
  segments,
  size = 140,
  strokeWidth = 16,
  centerLabel,
  centerValue,
  centerSubLabel,
  centerValueSize,
  trackColor = '#EEEAFA',
  selectedIndex = null,
  onSegmentPress,
}: DonutChartProps) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  const radius = (size - strokeWidth) / 2;
  const gapAngle = 0.025;
  const hitRadius = radius + strokeWidth / 2 + 6;

  let cumulativeAngle = -Math.PI / 2;

  // Precompute segment angles for hit testing
  const segAngles: Array<{ start: number; end: number; mid: number }> = [];

  return (
    <View style={[{ width: size, height: size }, styles.container]}>
      <Svg width={size} height={size}>
        <Defs>
          {segments.map((seg, i) => (
            <LinearGradient key={`grad-${i}`} id={`donut-grad-${i}`} x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={seg.colors[0]} />
              <Stop offset="1" stopColor={seg.colors[1]} />
            </LinearGradient>
          ))}
        </Defs>

        {/* Track ring */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />

        {total > 0 &&
          segments.map((seg, i) => {
            const fraction = seg.value / total;
            if (fraction <= 0) return null;
            const segAngle = fraction * (2 * Math.PI) - gapAngle;
            const startAngle = cumulativeAngle + gapAngle / 2;
            const endAngle = startAngle + Math.max(segAngle, 0.01);
            const midAngle = (startAngle + endAngle) / 2;
            cumulativeAngle += fraction * 2 * Math.PI;
            segAngles[i] = { start: startAngle, end: endAngle, mid: midAngle };

            const x1 = size / 2 + radius * Math.cos(startAngle);
            const y1 = size / 2 + radius * Math.sin(startAngle);
            const x2 = size / 2 + radius * Math.cos(endAngle);
            const y2 = size / 2 + radius * Math.sin(endAngle);

            const largeArc = segAngle > Math.PI ? 1 : 0;
            const path = `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`;
            const gradId = `url(#donut-grad-${i})`;
            const isSelected = selectedIndex === i;
            const sw = isSelected ? strokeWidth + 4 : strokeWidth;

            return (
              <G key={i}>
                <Path
                  d={path}
                  fill="none"
                  stroke={gradId}
                  strokeWidth={sw}
                  strokeLinecap="round"
                  opacity={selectedIndex !== null && !isSelected ? 0.35 : 1}
                />
                {/* Invisible hit area */}
                {onSegmentPress && (
                  <Path
                    d={path}
                    fill="none"
                    stroke="transparent"
                    strokeWidth={sw + 12}
                    strokeLinecap="round"
                    onPress={() => onSegmentPress(i)}
                  />
                )}
              </G>
            );
          })}
      </Svg>
      <View style={styles.center}>
        {centerLabel && <Text style={styles.centerLabel}>{centerLabel}</Text>}
        {centerValue && (
          <Text style={[styles.centerValue, centerValueSize ? { fontSize: centerValueSize } : undefined]}>
            {centerValue}
          </Text>
        )}
        {centerSubLabel && <Text style={styles.centerSubLabel}>{centerSubLabel}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { justifyContent: 'center', alignItems: 'center' },
  center: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerLabel: { fontSize: 9, fontWeight: '600', color: '#B0B0C0', textTransform: 'uppercase', letterSpacing: 1.2 },
  centerValue: { fontSize: 18, fontWeight: '800', color: Colors.textPrimary, letterSpacing: -0.5, marginTop: 4 },
  centerSubLabel: { fontSize: 10, fontWeight: '600', color: '#A0A0B8', marginTop: 3 },
});

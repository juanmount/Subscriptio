import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface ScreenBackgroundProps {
  children: React.ReactNode;
  paddingBottom?: number;
}

export function ScreenBackground({ children, paddingBottom = 0 }: ScreenBackgroundProps) {
  return (
    <LinearGradient
      colors={['#D9CEFF', '#E8E3FF', '#F2F0FC', '#FAFAFE', '#FAFAFE']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={[styles.container, { paddingBottom }]}
    >
      <View style={styles.blob1} pointerEvents="none" />
      <View style={styles.blob2} pointerEvents="none" />
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, position: 'relative' },
  blob1: {
    position: 'absolute',
    top: -60,
    right: -40,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(155,123,255,0.15)',
  },
  blob2: {
    position: 'absolute',
    top: 80,
    left: -60,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255,160,190,0.08)',
  },
});

import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/ui/theme';
import { getLogoForProvider } from '@/assets/logos';

const GRADIENT_PAIRS: [string, string][] = [
  ['#8B72FF', '#6B52E0'],
  ['#3B9EFF', '#2277DD'],
  ['#4CD68A', '#2DCE7A'],
  ['#FFB347', '#FF8C42'],
  ['#FF7A85', '#FF3B50'],
  ['#C07AEA', '#AF52DE'],
  ['#00D4BE', '#00A896'],
  ['#4DC8DF', '#30B0C7'],
];

function gradientFromName(name: string): [string, string] {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return GRADIENT_PAIRS[Math.abs(hash) % GRADIENT_PAIRS.length];
}

interface ProviderAvatarProps {
  name: string;
  size?: number;
}

export function ProviderAvatar({ name, size = 40 }: ProviderAvatarProps) {
  const trimmed = name.trim().replace(/^[-–—]+$/, '');
  const logo = getLogoForProvider(trimmed);
  const [c1, c2] = trimmed ? gradientFromName(trimmed) : [Colors.backgroundSecondary, Colors.backgroundSecondary];
  const initial = trimmed.charAt(0).toUpperCase();
  const fontSize = Math.round(size * 0.42);
  const radius = size / 2;

  if (logo) {
    return (
      <View style={[styles.container, { width: size, height: size, borderRadius: radius, backgroundColor: Colors.background }]}>
        <Image source={logo} style={{ width: size, height: size, borderRadius: radius }} resizeMode="contain" />
      </View>
    );
  }

  return (
    <LinearGradient
      colors={[c1, c2]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.container, { width: size, height: size, borderRadius: radius }]}
    >
      {trimmed ? (
        <Text style={[styles.letter, { fontSize }]}>{initial}</Text>
      ) : (
        <Ionicons name="cube-outline" size={Math.round(size * 0.5)} color={Colors.textTertiary} />
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  letter: {
    color: Colors.textInverse,
    fontWeight: '700',
  },
});
